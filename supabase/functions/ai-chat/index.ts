import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch all financial data in parallel
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const inicioMes = `${mesAtual}-01`;
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [
      transRes, cartoesRes, parcelasRes, bancosRes, metasRes, investRes, profileRes, categRes, orcRes,
    ] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(100),
      supabase.from("cartoes").select("*").eq("user_id", userId),
      supabase.from("parcelas_cartao").select("*, compras_cartao(descricao, cartao_id, valor_total, parcelas, responsavel_id)").eq("paga", false).eq("ativo", true),
      supabase.from("bancos").select("*").eq("user_id", userId).eq("ativo", true),
      supabase.from("metas").select("*").eq("user_id", userId),
      supabase.from("investimentos").select("*").eq("user_id", userId).eq("ativo", true),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("categories").select("*").eq("user_id", userId),
      supabase.from("orcamentos").select("*, categories(name)").eq("user_id", userId).eq("mes_referencia", mesAtual),
    ]);

    // Build context
    const transactions = transRes.data || [];
    const cartoes = cartoesRes.data || [];
    const parcelas = parcelasRes.data || [];
    const bancos = bancosRes.data || [];
    const metas = metasRes.data || [];
    const investimentos = investRes.data || [];
    const profile = profileRes.data;
    const categories = categRes.data || [];
    const orcamentos = orcRes.data || [];

    // Calculate balances
    const saldoInicial = profile?.saldo_inicial || 0;
    const saldoBancos = bancos.reduce((s, b) => s + (b.saldo_inicial || 0), 0);
    const totalReceitas = transactions.filter((t) => t.type === "income" && t.status === "completed").reduce((s, t) => s + t.amount, 0);
    const totalDespesas = transactions.filter((t) => t.type === "expense" && t.status === "completed").reduce((s, t) => s + t.amount, 0);
    const saldoReal = saldoBancos + totalReceitas - totalDespesas;

    const receitasMes = transactions.filter((t) => t.type === "income" && t.status === "completed" && t.date >= inicioMes && t.date <= fimMes).reduce((s, t) => s + t.amount, 0);
    const despesasMes = transactions.filter((t) => t.type === "expense" && t.status === "completed" && t.date >= inicioMes && t.date <= fimMes).reduce((s, t) => s + t.amount, 0);

    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    let contexto = `📊 DADOS FINANCEIROS DO USUÁRIO (${profile?.full_name || "Usuário"})\nData atual: ${now.toLocaleDateString("pt-BR")}\n\n`;
    contexto += `💰 SALDO REAL: ${formatCurrency(saldoReal)}\n`;
    contexto += `📈 Receitas do mês (${mesAtual}): ${formatCurrency(receitasMes)}\n`;
    contexto += `📉 Despesas do mês (${mesAtual}): ${formatCurrency(despesasMes)}\n\n`;

    if (bancos.length > 0) {
      contexto += `🏦 BANCOS:\n`;
      bancos.forEach((b) => { contexto += `- ${b.nome}: saldo inicial ${formatCurrency(b.saldo_inicial)}${b.tipo_conta ? ` (${b.tipo_conta})` : ""}\n`; });
      contexto += "\n";
    }

    if (cartoes.length > 0) {
      contexto += `💳 CARTÕES:\n`;
      cartoes.forEach((c) => { contexto += `- ${c.nome}: limite ${formatCurrency(c.limite)}, fecha dia ${c.dia_fechamento}, vence dia ${c.dia_vencimento}\n`; });
      contexto += "\n";
    }

    if (parcelas.length > 0) {
      contexto += `📋 PARCELAS PENDENTES:\n`;
      parcelas.slice(0, 30).forEach((p: any) => {
        const desc = p.compras_cartao?.descricao || "Compra";
        contexto += `- ${desc}: parcela ${p.numero_parcela}/${p.total_parcelas} = ${formatCurrency(p.valor)} (${p.mes_referencia})\n`;
      });
      contexto += "\n";
    }

    if (metas.length > 0) {
      contexto += `🎯 METAS:\n`;
      metas.forEach((m) => {
        const pct = m.valor_alvo > 0 ? ((m.valor_atual / m.valor_alvo) * 100).toFixed(1) : "0";
        contexto += `- ${m.titulo}: ${formatCurrency(m.valor_atual)}/${formatCurrency(m.valor_alvo)} (${pct}%)${m.concluida ? " ✅" : ""}\n`;
      });
      contexto += "\n";
    }

    if (investimentos.length > 0) {
      contexto += `📊 INVESTIMENTOS:\n`;
      const totalInv = investimentos.reduce((s, i) => s + i.valor_atual, 0);
      investimentos.forEach((i) => { contexto += `- ${i.nome} (${i.tipo}): ${formatCurrency(i.valor_atual)}${i.instituicao ? ` em ${i.instituicao}` : ""}\n`; });
      contexto += `Total investido: ${formatCurrency(totalInv)}\n\n`;
    }

    if (orcamentos.length > 0) {
      contexto += `📋 ORÇAMENTOS DO MÊS:\n`;
      orcamentos.forEach((o: any) => {
        const catName = o.categories?.name || "Categoria";
        contexto += `- ${catName}: limite ${formatCurrency(o.valor_limite)}\n`;
      });
      contexto += "\n";
    }

    // Last 20 transactions summary
    const ultimas = transactions.slice(0, 20);
    if (ultimas.length > 0) {
      contexto += `📝 ÚLTIMAS TRANSAÇÕES:\n`;
      ultimas.forEach((t) => {
        const tipo = t.type === "income" ? "📈" : "📉";
        const cat = t.category_id ? catMap[t.category_id] || "" : "";
        contexto += `${tipo} ${t.date} | ${t.description || "Sem descrição"} | ${formatCurrency(t.amount)}${cat ? ` | ${cat}` : ""} | ${t.status}\n`;
      });
    }

    const systemPrompt = `Você é o Fina, assistente financeiro pessoal inteligente. Responda perguntas sobre finanças do usuário com base nos dados fornecidos abaixo.

REGRAS:
- Responda APENAS com base nos dados fornecidos, nunca invente valores
- Use formatação simples com emojis para facilitar a leitura
- Seja objetivo e direto nas respostas
- Se não houver dados suficientes para responder, informe isso
- Valores monetários sempre em R$ (reais)
- Quando relevante, dê dicas ou insights financeiros
- Responda sempre em português brasileiro
- NÃO use markdown complexo (sem tabelas, sem código), apenas texto, emojis e listas simples

${contexto}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function fmt(v: number) {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const inicioMes = `${mesAtual}-01`;
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    // Fetch ALL data in parallel
    const [
      allTransRes, recentTransRes, cartoesRes, parcelasRes, bancosRes, metasRes,
      investRes, profileRes, categRes, orcRes, responsaveisRes, acertosRes,
      movMetasRes, movInvestRes, pendingTransRes,
    ] = await Promise.all([
      // ALL completed transactions (no limit) for correct balance
      supabase.from("transactions").select("type, amount, category_id").eq("user_id", userId).eq("status", "completed"),
      // Recent transactions for context display (last 30)
      supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(30),
      supabase.from("cartoes").select("*").eq("user_id", userId),
      // All unpaid active installments with purchase + responsible person details
      supabase.from("parcelas_cartao").select("*, compras_cartao(descricao, cartao_id, valor_total, parcelas, responsavel_id, categoria_id)").eq("paga", false).eq("ativo", true),
      supabase.from("bancos").select("*").eq("user_id", userId).eq("ativo", true),
      supabase.from("metas").select("*").eq("user_id", userId),
      supabase.from("investimentos").select("*").eq("user_id", userId).eq("ativo", true),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("categories").select("*").eq("user_id", userId),
      supabase.from("orcamentos").select("*, categories(name)").eq("user_id", userId).eq("mes_referencia", mesAtual),
      supabase.from("responsaveis").select("*").eq("user_id", userId).eq("ativo", true),
      supabase.from("acertos_fatura").select("*, responsavel:responsaveis(nome, apelido, is_titular), cartao:cartoes(nome)").eq("user_id", userId).neq("status", "pago"),
      supabase.from("movimentacoes_meta").select("*, meta:metas(titulo)").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("movimentacoes_investimento").select("*, investimento:investimentos(nome)").eq("user_id", userId).order("data", { ascending: false }).limit(20),
      // Pending transactions for the month
      supabase.from("transactions").select("*").eq("user_id", userId).eq("status", "pending").gte("due_date", inicioMes).lte("due_date", fimMes),
    ]);

    const allCompleted = allTransRes.data || [];
    const recentTrans = recentTransRes.data || [];
    const cartoes = cartoesRes.data || [];
    const parcelas = parcelasRes.data || [];
    const bancos = bancosRes.data || [];
    const metas = metasRes.data || [];
    const investimentos = investRes.data || [];
    const profile = profileRes.data;
    const categories = categRes.data || [];
    const orcamentos = orcRes.data || [];
    const responsaveis = responsaveisRes.data || [];
    const acertos = acertosRes.data || [];
    const movMetas = movMetasRes.data || [];
    const movInvest = movInvestRes.data || [];
    const pendingTrans = pendingTransRes.data || [];

    // Build category maps
    const catMap = Object.fromEntries(categories.map((c: any) => [c.id, c.name]));
    // Identify meta-related categories to exclude from real income/expense totals
    const metaCatIds = new Set(
      categories.filter((c: any) => ["Depósito em Meta", "Retirada de Meta", "Deposito em Meta"].includes(c.name)).map((c: any) => c.id)
    );

    // Build responsible person map
    const respMap = Object.fromEntries(responsaveis.map((r: any) => [r.id, r]));
    const titular = responsaveis.find((r: any) => r.is_titular);

    // ===== CORRECT BALANCE CALCULATIONS (matching the real system) =====
    // Saldo Inicial = sum of bank initial balances (or profile.saldo_inicial if no banks)
    const saldoInicialBancos = bancos.reduce((s: number, b: any) => s + (b.saldo_inicial || 0), 0);
    const saldoInicial = bancos.length > 0 ? saldoInicialBancos : (profile?.saldo_inicial || 0);

    // Filter out meta-related transactions from balance calculation
    const realCompleted = allCompleted.filter((t: any) => !metaCatIds.has(t.category_id));
    const totalReceitasCompleted = realCompleted.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
    const totalDespesasCompleted = realCompleted.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);

    // Saldo Disponível = Saldo Inicial + All Completed Income - All Completed Expenses
    const saldoDisponivel = Math.max(0, saldoInicial + totalReceitasCompleted - totalDespesasCompleted);

    // Total in goals (non-completed only)
    const totalMetas = metas.filter((m: any) => !m.concluida).reduce((s: number, m: any) => s + (m.valor_atual || 0), 0);
    const totalInvestimentos = investimentos.reduce((s: number, i: any) => s + (i.valor_atual || 0), 0);

    // Patrimônio Total = Saldo Disponível + Metas + Investimentos
    const patrimonioTotal = saldoDisponivel + totalMetas + totalInvestimentos;

    // Monthly pending transactions
    const aReceberMes = pendingTrans.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
    const aPagarMes = pendingTrans.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);

    // Card invoice: separate titular vs terceiros
    let faturaTotalMes = 0;
    let faturaTitularMes = 0;
    let faturaTerceirosMes = 0;
    const parcelasMes = parcelas.filter((p: any) => p.mes_referencia === inicioMes);
    for (const p of parcelasMes) {
      const compra = (p as any).compras_cartao;
      const respId = compra?.responsavel_id;
      const resp = respId ? respMap[respId] : null;
      const isTitular = !resp || resp.is_titular;
      faturaTotalMes += p.valor;
      if (isTitular) faturaTitularMes += p.valor;
      else faturaTerceirosMes += p.valor;
    }

    // Saldo Estimado = Saldo Disponível + A Receber - A Pagar - Fatura Titular
    const saldoEstimado = saldoDisponivel + aReceberMes - aPagarMes - faturaTitularMes;

    // Monthly completed transactions
    const completedMes = recentTrans.filter((t: any) => t.status === "completed" && t.date >= inicioMes && t.date <= fimMes && !metaCatIds.has(t.category_id));
    const receitasMes = completedMes.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
    const despesasMes = completedMes.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);

    // Card limits used
    const limiteUsadoPorCartao: Record<string, number> = {};
    for (const p of parcelas) {
      const cartaoId = (p as any).compras_cartao?.cartao_id;
      if (cartaoId) limiteUsadoPorCartao[cartaoId] = (limiteUsadoPorCartao[cartaoId] || 0) + p.valor;
    }

    // ===== BUILD CONTEXT =====
    let ctx = `📊 DADOS FINANCEIROS DE ${profile?.full_name || "Usuário"}\n`;
    ctx += `📅 Data atual: ${now.toLocaleDateString("pt-BR")}\n\n`;

    ctx += `═══ SALDOS E PATRIMÔNIO ═══\n`;
    ctx += `💰 Saldo Disponível: ${fmt(saldoDisponivel)} (dinheiro livre para gastar)\n`;
    ctx += `🏛️ Patrimônio Total: ${fmt(patrimonioTotal)} (Disponível + Metas + Investimentos)\n`;
    ctx += `📊 Saldo Estimado do Mês: ${fmt(saldoEstimado)} (Disponível + A Receber - A Pagar - Fatura Titular)\n\n`;

    ctx += `═══ RESUMO DO MÊS (${mesAtual}) ═══\n`;
    ctx += `📈 Receitas recebidas: ${fmt(receitasMes)}\n`;
    ctx += `📉 Despesas pagas: ${fmt(despesasMes)}\n`;
    ctx += `📥 A receber (pendente): ${fmt(aReceberMes)}\n`;
    ctx += `📤 A pagar (pendente): ${fmt(aPagarMes)}\n`;
    ctx += `💳 Fatura cartão (titular): ${fmt(faturaTitularMes)}\n`;
    ctx += `💳 Fatura cartão (terceiros): ${fmt(faturaTerceirosMes)}\n`;
    ctx += `💳 Fatura total: ${fmt(faturaTotalMes)}\n\n`;

    if (bancos.length > 0) {
      ctx += `═══ BANCOS ═══\n`;
      bancos.forEach((b: any) => { ctx += `- ${b.nome}: saldo inicial ${fmt(b.saldo_inicial)}${b.tipo_conta ? ` (${b.tipo_conta})` : ""}\n`; });
      ctx += "\n";
    }

    if (cartoes.length > 0) {
      ctx += `═══ CARTÕES DE CRÉDITO ═══\n`;
      cartoes.forEach((c: any) => {
        const usado = limiteUsadoPorCartao[c.id] || 0;
        const disponivel = c.limite - usado;
        ctx += `- ${c.nome}: limite ${fmt(c.limite)}, usado ${fmt(usado)}, disponível ${fmt(disponivel)}, fecha dia ${c.dia_fechamento}, vence dia ${c.dia_vencimento}\n`;
      });
      ctx += "\n";
    }

    if (responsaveis.length > 0) {
      ctx += `═══ RESPONSÁVEIS ═══\n`;
      responsaveis.forEach((r: any) => {
        ctx += `- ${r.apelido || r.nome}${r.is_titular ? " (TITULAR - é o dono da conta)" : " (TERCEIRO - usa o cartão e deve ao titular)"}\n`;
      });
      ctx += "\n";
    }

    if (acertos.length > 0) {
      ctx += `═══ ACERTOS DE FATURA PENDENTES ═══\n`;
      acertos.forEach((a: any) => {
        const resp = a.responsavel?.apelido || a.responsavel?.nome || "?";
        const cartao = a.cartao?.nome || "?";
        const pendente = a.valor_devido - a.valor_pago;
        ctx += `- ${resp} deve ${fmt(pendente)} do ${cartao} (ref: ${a.mes_referencia})${a.valor_pago > 0 ? ` (já pagou ${fmt(a.valor_pago)})` : ""}\n`;
      });
      ctx += "\n";
    }

    if (metas.length > 0) {
      ctx += `═══ METAS DE ECONOMIA ═══\n`;
      metas.forEach((m: any) => {
        const pct = m.valor_alvo > 0 ? ((m.valor_atual / m.valor_alvo) * 100).toFixed(1) : "0";
        ctx += `- ${m.titulo}: ${fmt(m.valor_atual)}/${fmt(m.valor_alvo)} (${pct}%)${m.concluida ? " ✅ Concluída" : ""}${m.data_limite ? ` | prazo: ${m.data_limite}` : ""}\n`;
      });
      ctx += `Total em metas (ativas): ${fmt(totalMetas)}\n\n`;
    }

    if (investimentos.length > 0) {
      ctx += `═══ INVESTIMENTOS ═══\n`;
      investimentos.forEach((i: any) => {
        ctx += `- ${i.nome} (${i.tipo}): ${fmt(i.valor_atual)}${i.instituicao ? ` em ${i.instituicao}` : ""}${i.rentabilidade_anual ? ` | rent. ${i.rentabilidade_anual}% a.a.` : ""}\n`;
      });
      ctx += `Total investido: ${fmt(totalInvestimentos)}\n\n`;
    }

    if (orcamentos.length > 0) {
      ctx += `═══ ORÇAMENTOS DO MÊS ═══\n`;
      orcamentos.forEach((o: any) => {
        const catName = o.categories?.name || "Categoria";
        // Calculate spent in this category this month
        const gastoCategoria = completedMes.filter((t: any) => t.type === "expense" && t.category_id === o.category_id).reduce((s: number, t: any) => s + t.amount, 0);
        const pct = o.valor_limite > 0 ? ((gastoCategoria / o.valor_limite) * 100).toFixed(0) : "0";
        ctx += `- ${catName}: gasto ${fmt(gastoCategoria)} de ${fmt(o.valor_limite)} (${pct}%)\n`;
      });
      ctx += "\n";
    }

    // Pending transactions of the month
    if (pendingTrans.length > 0) {
      ctx += `═══ TRANSAÇÕES PENDENTES DO MÊS ═══\n`;
      const pendingIncome = pendingTrans.filter((t: any) => t.type === "income");
      const pendingExpense = pendingTrans.filter((t: any) => t.type === "expense");
      if (pendingIncome.length > 0) {
        ctx += `📥 A RECEBER:\n`;
        pendingIncome.forEach((t: any) => {
          ctx += `- ${t.description || "Sem descrição"}: ${fmt(t.amount)} (vence ${t.due_date})\n`;
        });
      }
      if (pendingExpense.length > 0) {
        ctx += `📤 A PAGAR:\n`;
        pendingExpense.forEach((t: any) => {
          ctx += `- ${t.description || "Sem descrição"}: ${fmt(t.amount)} (vence ${t.due_date})\n`;
        });
      }
      ctx += "\n";
    }

    // Installments summary per card for current month
    if (parcelasMes.length > 0) {
      ctx += `═══ PARCELAS DO MÊS (${mesAtual}) ═══\n`;
      parcelasMes.slice(0, 30).forEach((p: any) => {
        const compra = (p as any).compras_cartao;
        const desc = compra?.descricao || "Compra";
        const respId = compra?.responsavel_id;
        const resp = respId ? respMap[respId] : null;
        const respNome = resp ? (resp.apelido || resp.nome) : "Titular";
        ctx += `- ${desc}: ${fmt(p.valor)} (${p.numero_parcela}/${p.total_parcelas}) | ${respNome}\n`;
      });
      ctx += "\n";
    }

    // Recent goal movements
    if (movMetas.length > 0) {
      ctx += `═══ MOVIMENTAÇÕES DE METAS RECENTES ═══\n`;
      movMetas.slice(0, 10).forEach((m: any) => {
        const metaNome = m.meta?.titulo || "Meta";
        const tipo = m.tipo === "deposito" ? "⬆️ Depósito" : "⬇️ Retirada";
        ctx += `- ${tipo} ${fmt(m.valor)} em "${metaNome}" (${new Date(m.created_at).toLocaleDateString("pt-BR")})\n`;
      });
      ctx += "\n";
    }

    // Recent investment movements
    if (movInvest.length > 0) {
      ctx += `═══ MOVIMENTAÇÕES DE INVESTIMENTOS RECENTES ═══\n`;
      movInvest.slice(0, 10).forEach((m: any) => {
        const invNome = m.investimento?.nome || "Investimento";
        const tipoLabel = m.tipo === "aporte" ? "⬆️ Aporte" : m.tipo === "resgate" ? "⬇️ Resgate" : "💹 Rendimento";
        ctx += `- ${tipoLabel} ${fmt(m.valor)} em "${invNome}" (${m.data})\n`;
      });
      ctx += "\n";
    }

    // Last 15 transactions
    const ultimas = recentTrans.slice(0, 15);
    if (ultimas.length > 0) {
      ctx += `═══ ÚLTIMAS TRANSAÇÕES ═══\n`;
      ultimas.forEach((t: any) => {
        const tipo = t.type === "income" ? "📈" : "📉";
        const cat = t.category_id ? catMap[t.category_id] || "" : "";
        const status = t.status === "completed" ? "✅" : "⏳";
        ctx += `${tipo} ${t.date} | ${t.description || "Sem descrição"} | ${fmt(t.amount)}${cat ? ` | ${cat}` : ""} | ${status}\n`;
      });
    }

    const systemPrompt = `Você é o **Fina**, assistente financeiro pessoal inteligente do sistema Finanças Pessoais.

═══════════════════════════════════
COMO O SISTEMA FUNCIONA
═══════════════════════════════════

O sistema gerencia as finanças pessoais do usuário com os seguintes módulos:

1. **BANCOS**: Contas bancárias com saldo inicial. O saldo atual é calculado, não armazenado.
2. **TRANSAÇÕES**: Receitas e despesas com status "completed" (efetivada) ou "pending" (pendente/agendada).
3. **CARTÕES DE CRÉDITO**: Com limite, dia de fechamento e vencimento. As compras geram parcelas mensais.
4. **RESPONSÁVEIS**: Pessoas vinculadas aos cartões. O "titular" (is_titular=true) é o dono da conta. "Terceiros" são pessoas que usam o cartão do titular e devem reembolsá-lo.
5. **METAS DE ECONOMIA**: Objetivos de poupança. Depósitos e retiradas em metas geram transações com categorias especiais ("Depósito em Meta", "Retirada de Meta") que NÃO contam como receita/despesa real.
6. **INVESTIMENTOS**: Ativos financeiros (poupança, CDB, ações, etc.) com aportes, resgates e rendimentos.
7. **ORÇAMENTOS**: Limites de gasto por categoria por mês.
8. **ACERTOS DE FATURA**: Quando terceiros pagam ao titular o que devem do cartão.

═══════════════════════════════════
REGRAS DE CÁLCULO (CRÍTICO - SIGA EXATAMENTE)
═══════════════════════════════════

• **Saldo Inicial** = soma dos saldos iniciais de todos os bancos ativos (ou saldo_inicial do perfil se não tem bancos)
• **Saldo Disponível** = Saldo Inicial + TODAS receitas completed − TODAS despesas completed (histórico COMPLETO, excluindo categorias de meta)
  → Este é o dinheiro "livre" disponível para gastar. Mínimo = 0.
• **Patrimônio Total** = Saldo Disponível + Total em Metas (ativas, não concluídas) + Total em Investimentos
  → Toda a riqueza do usuário.
• **Saldo Estimado do Mês** = Saldo Disponível + A Receber no mês − A Pagar no mês − Fatura do cartão (apenas titular)
  → Projeção de quanto sobrará no fim do mês.

**Cartões de Crédito:**
• Fatura do mês = soma das parcelas não pagas do mês de referência
• Fatura Titular = parcelas de compras onde o responsável é titular (ou sem responsável)
• Fatura Terceiros = parcelas de compras onde o responsável NÃO é titular
• Limite Usado = soma de TODAS as parcelas não pagas (não apenas do mês)
• Limite Disponível = Limite Total − Limite Usado

**Transações:**
• status "completed" = dinheiro já entrou/saiu da conta
• status "pending" = agendado, ainda vai acontecer
• Transações com categorias "Depósito em Meta" ou "Retirada de Meta" são movimentações internas e NÃO devem ser contadas como receita/despesa real

**Acertos de Fatura:**
• Quando um terceiro paga o que deve ao titular
• valor_devido = quanto o terceiro deve
• valor_pago = quanto já pagou
• Pendente = valor_devido − valor_pago

═══════════════════════════════════
REGRAS DE RESPOSTA
═══════════════════════════════════

- Responda APENAS com base nos dados fornecidos abaixo. NUNCA invente valores.
- Quando o usuário perguntar "meu saldo", "quanto tenho", use o Saldo Disponível.
- Quando perguntar "meu patrimônio", use o Patrimônio Total.
- Quando perguntar "quanto vou ter no fim do mês", use o Saldo Estimado.
- Use emojis para facilitar a leitura.
- Seja objetivo e direto.
- Se não houver dados suficientes, informe isso.
- Valores sempre em R$ (reais).
- Quando relevante, dê dicas e insights financeiros.
- Responda sempre em português brasileiro.
- NÃO use markdown complexo (sem tabelas markdown, sem blocos de código). Apenas texto, emojis e listas simples.
- Quando listar gastos por categoria, exclua categorias de meta dos totais.

${ctx}`;

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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function sendTelegramTyping(token: string, chatId: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

async function findUserByChatId(supabase: any, chatId: string): Promise<string | null> {
  const { data: config } = await supabase
    .from("telegram_config")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .eq("ativo", true)
    .maybeSingle();
  return config?.user_id || null;
}

// ─── /despesas handler ───

async function handleDespesas(supabase: any, botToken: string, chatId: string, text: string) {
  const parts = text.trim().split(/\s+/);
  let meses = 3;
  if (parts.length > 1) {
    const parsed = parseInt(parts[1]);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) meses = parsed;
  }

  const userId = await findUserByChatId(supabase, chatId);
  if (!userId) {
    await sendTelegramMessage(botToken, chatId, "❌ Conta não vinculada.\n\nEnvie /start para obter um código de vinculação.");
    return;
  }

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() + meses, 0);
  const inicioStr = inicioMes.toISOString().split("T")[0];
  const fimStr = fimPeriodo.toISOString().split("T")[0];

  const { data: parcelas } = await supabase
    .from("parcelas_cartao")
    .select("valor, numero_parcela, total_parcelas, mes_referencia, tipo_recorrencia, compra_id, compras_cartao(descricao, user_id, cartoes(nome))")
    .eq("paga", false).eq("ativo", true)
    .gte("mes_referencia", inicioStr).lte("mes_referencia", fimStr);

  const { data: transacoes } = await supabase
    .from("transactions")
    .select("description, amount, due_date, date, numero_parcela, total_parcelas")
    .eq("user_id", userId).eq("type", "expense").eq("status", "pendente")
    .gte("due_date", inicioStr).lte("due_date", fimStr);

  interface DespesaItem { descricao: string; valor: number; info: string; }
  const porMes: Record<string, DespesaItem[]> = {};

  if (parcelas) {
    for (const p of parcelas) {
      const compra = p.compras_cartao as any;
      if (!compra || compra.user_id !== userId) continue;
      const mesKey = p.mes_referencia.substring(0, 7);
      if (!porMes[mesKey]) porMes[mesKey] = [];
      let info = "";
      if (compra.cartoes?.nome) info = `(${compra.cartoes.nome})`;
      if (p.total_parcelas > 1) info = `(${p.numero_parcela}/${p.total_parcelas})`;
      if (p.tipo_recorrencia === "recorrente") info = "(recorrente)";
      porMes[mesKey].push({ descricao: compra.descricao || "Sem descrição", valor: Number(p.valor), info });
    }
  }

  if (transacoes) {
    for (const t of transacoes) {
      const dueDate = t.due_date || t.date;
      if (!dueDate) continue;
      const mesKey = dueDate.substring(0, 7);
      if (!porMes[mesKey]) porMes[mesKey] = [];
      let info = "";
      if (t.total_parcelas && t.total_parcelas > 1) info = `(${t.numero_parcela || 1}/${t.total_parcelas})`;
      porMes[mesKey].push({ descricao: t.description || "Sem descrição", valor: Number(t.amount), info });
    }
  }

  const mesesOrdenados = Object.keys(porMes).sort();
  if (mesesOrdenados.length === 0) {
    await sendTelegramMessage(botToken, chatId, `📋 *Despesas Futuras (${meses} ${meses === 1 ? "mês" : "meses"})*\n\nNenhuma despesa encontrada no período.`);
    return;
  }

  let totalGeral = 0;
  const secoes: string[] = [];
  for (const mesKey of mesesOrdenados) {
    const [ano, mesNum] = mesKey.split("-");
    const nomeMes = MONTH_NAMES[parseInt(mesNum) - 1];
    const itens = porMes[mesKey];
    let subtotal = 0;
    const MAX_ITENS = 50;
    const linhas: string[] = [];
    for (const item of itens.slice(0, MAX_ITENS)) {
      subtotal += item.valor;
      linhas.push(`  • ${item.descricao} - ${formatBRL(item.valor)}${item.info ? ` ${item.info}` : ""}`);
    }
    for (let i = MAX_ITENS; i < itens.length; i++) subtotal += itens[i].valor;
    if (itens.length > MAX_ITENS) linhas.push(`  _...e mais ${itens.length - MAX_ITENS} itens_`);
    linhas.push(`  *Subtotal: ${formatBRL(subtotal)}*`);
    totalGeral += subtotal;
    secoes.push(`📅 *${nomeMes}/${ano}*\n${linhas.join("\n")}`);
  }

  const header = `📋 *Despesas Futuras (${meses} ${meses === 1 ? "mês" : "meses"})*\n\n`;
  const footer = `\n\n💰 *Total geral: ${formatBRL(totalGeral)}*`;
  const mensagem = header + secoes.join("\n\n") + footer;

  if (mensagem.length <= 4000) {
    await sendTelegramMessage(botToken, chatId, mensagem);
  } else {
    await sendTelegramMessage(botToken, chatId, header + "_(mensagem dividida por ser muito longa)_");
    for (const s of secoes) await sendTelegramMessage(botToken, chatId, s.length > 4000 ? s.substring(0, 4000) : s);
    await sendTelegramMessage(botToken, chatId, footer);
  }
}

// ─── AI pergunta handler ───

async function handlePergunta(supabase: any, botToken: string, chatId: string, text: string) {
  const userId = await findUserByChatId(supabase, chatId);
  if (!userId) {
    await sendTelegramMessage(botToken, chatId, "❌ Conta não vinculada.\n\nEnvie /start para obter um código de vinculação.");
    return;
  }

  await sendTelegramTyping(botToken, chatId);

  const hoje = new Date();
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;

  // Fetch all data in parallel
  const [
    { data: transactions },
    { data: cartoes },
    { data: parcelas },
    { data: bancos },
    { data: metas },
    { data: investimentos },
    { data: profile },
    { data: categories },
    { data: orcamentos },
  ] = await Promise.all([
    supabase.from("transactions")
      .select("description, amount, type, status, date, due_date, category_id, banco_id, numero_parcela, total_parcelas, is_recurring")
      .eq("user_id", userId).order("date", { ascending: false }).limit(100),
    supabase.from("cartoes")
      .select("nome, limite, dia_fechamento, dia_vencimento, bandeira")
      .eq("user_id", userId),
    supabase.from("parcelas_cartao")
      .select("valor, numero_parcela, total_parcelas, mes_referencia, paga, tipo_recorrencia, compras_cartao(descricao, valor_total, cartoes(nome))")
      .eq("paga", false).eq("ativo", true).gte("mes_referencia", inicioMes).limit(100),
    supabase.from("bancos")
      .select("nome, saldo_inicial, tipo_conta")
      .eq("user_id", userId).eq("ativo", true),
    supabase.from("metas")
      .select("titulo, valor_alvo, valor_atual, data_limite, concluida")
      .eq("user_id", userId),
    supabase.from("investimentos")
      .select("nome, tipo, valor_inicial, valor_atual, rentabilidade_anual, instituicao, data_vencimento")
      .eq("user_id", userId).eq("ativo", true),
    supabase.from("profiles")
      .select("saldo_inicial, full_name")
      .eq("user_id", userId).maybeSingle(),
    supabase.from("categories")
      .select("id, name, type")
      .eq("user_id", userId),
    supabase.from("orcamentos")
      .select("category_id, valor_limite")
      .eq("user_id", userId).eq("mes_referencia", inicioMes),
  ]);

  // Category map
  const catMap: Record<string, string> = {};
  if (categories) for (const c of categories) catMap[c.id] = c.name;

  // Build context
  const ctx: string[] = [`Data atual: ${hoje.toLocaleDateString("pt-BR")}`];
  if (profile) {
    ctx.push(`Nome: ${profile.full_name || "Não informado"}`);
    ctx.push(`Saldo inicial: ${formatBRL(profile.saldo_inicial || 0)}`);
  }

  if (bancos?.length) {
    ctx.push("\n--- CONTAS BANCÁRIAS ---");
    for (const b of bancos) ctx.push(`• ${b.nome} (${b.tipo_conta || "conta"}): Saldo inicial ${formatBRL(b.saldo_inicial)}`);
  }
  if (cartoes?.length) {
    ctx.push("\n--- CARTÕES ---");
    for (const c of cartoes) ctx.push(`• ${c.nome} (${c.bandeira || ""}): Limite ${formatBRL(c.limite)}, fecha dia ${c.dia_fechamento}, vence dia ${c.dia_vencimento}`);
  }
  if (transactions?.length) {
    ctx.push(`\n--- ÚLTIMAS ${transactions.length} TRANSAÇÕES ---`);
    for (const t of transactions) {
      const cat = t.category_id ? catMap[t.category_id] || "" : "";
      ctx.push(`• ${t.date} | ${t.type === "income" ? "RECEITA" : "DESPESA"} | ${t.description || "Sem desc"} | ${formatBRL(t.amount)}${cat ? ` [${cat}]` : ""}${t.status !== "pago" ? ` (${t.status})` : ""}`);
    }
  }
  if (parcelas?.length) {
    ctx.push("\n--- PARCELAS PENDENTES ---");
    for (const p of parcelas) {
      const compra = p.compras_cartao as any;
      if (!compra) continue;
      ctx.push(`• ${compra.descricao} - ${formatBRL(p.valor)} (${p.numero_parcela}/${p.total_parcelas}) - Ref: ${p.mes_referencia} - Cartão: ${compra.cartoes?.nome || ""}`);
    }
  }
  if (metas?.length) {
    ctx.push("\n--- METAS ---");
    for (const m of metas) {
      const pct = m.valor_alvo > 0 ? ((m.valor_atual / m.valor_alvo) * 100).toFixed(1) : "0";
      ctx.push(`• ${m.titulo}: ${formatBRL(m.valor_atual)}/${formatBRL(m.valor_alvo)} (${pct}%)${m.concluida ? " ✅" : ""}${m.data_limite ? ` Prazo: ${m.data_limite}` : ""}`);
    }
  }
  if (investimentos?.length) {
    ctx.push("\n--- INVESTIMENTOS ---");
    for (const i of investimentos) ctx.push(`• ${i.nome} (${i.tipo}): Atual ${formatBRL(i.valor_atual)}, Inicial ${formatBRL(i.valor_inicial)}${i.rentabilidade_anual ? `, ${i.rentabilidade_anual}% a.a.` : ""}${i.instituicao ? ` - ${i.instituicao}` : ""}`);
  }
  if (orcamentos?.length) {
    ctx.push("\n--- ORÇAMENTOS DO MÊS ---");
    for (const o of orcamentos) ctx.push(`• ${catMap[o.category_id] || "Categoria"}: Limite ${formatBRL(o.valor_limite)}`);
  }

  const systemPrompt = `Você é um assistente financeiro pessoal integrado ao sistema de finanças do usuário.
Responda APENAS com base nos dados fornecidos. Nunca invente valores.
Se não houver dados suficientes, diga claramente.
Responda em português do Brasil, de forma clara e concisa.
Use emojis para visual. Formate valores em R$.
Não use Markdown complexo - apenas texto simples, emojis e quebras de linha.
Máximo 3000 caracteres.`;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await sendTelegramMessage(botToken, chatId, "❌ Serviço de IA não configurado.");
      return;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Dados financeiros:\n${ctx.join("\n")}\n\nPergunta: ${text}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) { await sendTelegramMessage(botToken, chatId, "⏳ Muitas requisições. Tente novamente em alguns segundos."); return; }
      if (status === 402) { await sendTelegramMessage(botToken, chatId, "❌ Créditos de IA esgotados."); return; }
      console.error("AI error:", status, await aiResponse.text());
      await sendTelegramMessage(botToken, chatId, "❌ Erro ao processar sua pergunta.");
      return;
    }

    const aiData = await aiResponse.json();
    const resposta = aiData.choices?.[0]?.message?.content || "Não consegui gerar uma resposta.";

    if (resposta.length <= 4000) {
      await sendTelegramMessage(botToken, chatId, resposta);
    } else {
      let remaining = resposta;
      while (remaining.length > 0) {
        if (remaining.length <= 4000) { await sendTelegramMessage(botToken, chatId, remaining); break; }
        let splitAt = remaining.lastIndexOf("\n", 4000);
        if (splitAt < 1000) splitAt = 4000;
        await sendTelegramMessage(botToken, chatId, remaining.substring(0, splitAt));
        remaining = remaining.substring(splitAt).trimStart();
      }
    }
  } catch (error) {
    console.error("handlePergunta error:", error);
    await sendTelegramMessage(botToken, chatId, "❌ Erro ao processar sua pergunta. Tente novamente.");
  }
}

// ─── Main handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();

    // Handle test message action
    if (body.action === "test" && body.user_id) {
      const { data: config } = await supabase
        .from("telegram_config")
        .select("telegram_chat_id")
        .eq("user_id", body.user_id)
        .eq("ativo", true)
        .maybeSingle();

      if (!config) {
        return new Response(JSON.stringify({ error: "Telegram não vinculado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.telegram_chat_id,
          text: "🧪 *Alerta de Teste*\n\nEsta é uma mensagem de teste do sistema de notificações financeiras.\n\n✅ Se você recebeu esta mensagem, a integração está funcionando corretamente!",
          parse_mode: "Markdown",
        }),
      });
      const result = await res.json();
      return new Response(JSON.stringify({ success: result.ok, result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle setup-webhook action
    if (body.action === "setup-webhook") {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const result = await res.json();
      console.log("setWebhook result:", result);
      return new Response(JSON.stringify({ success: result.ok, result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle Telegram webhook update
    if (body.message) {
      const chatId = String(body.message.chat.id);
      const text = body.message.text || "";

      if (text.startsWith("/start")) {
        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from("telegram_config").delete().eq("telegram_chat_id", chatId).eq("ativo", false);
        await supabase.from("telegram_config").insert({ telegram_chat_id: chatId, codigo_vinculacao: codigo, ativo: false });
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🔗 *Código de Vinculação*\n\nSeu código: \`${codigo}\`\n\nCole este código na página de Configurações de Notificações do sistema para vincular sua conta.`,
            parse_mode: "Markdown",
          }),
        });
      } else if (text.startsWith("/despesas")) {
        await handleDespesas(supabase, TELEGRAM_BOT_TOKEN, chatId, text);
      } else if (text.startsWith("/")) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❓ Comando não reconhecido.\n\nComandos disponíveis:\n/start - Vincular conta\n/despesas - Ver despesas futuras\n\nOu envie qualquer pergunta sobre suas finanças!");
      } else if (text.trim().length > 0) {
        await handlePergunta(supabase, TELEGRAM_BOT_TOKEN, chatId, text);
      }

      return new Response(JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle linking request
    if (body.action === "link") {
      const { codigo, user_id } = body;
      if (!codigo || !user_id) {
        return new Response(JSON.stringify({ error: "Código e user_id são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: pending } = await supabase
        .from("telegram_config").select("*")
        .eq("codigo_vinculacao", codigo.toUpperCase()).eq("ativo", false).maybeSingle();

      if (!pending) {
        return new Response(JSON.stringify({ error: "Código inválido ou expirado. Envie /start novamente no bot." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabase.from("telegram_config").delete().eq("user_id", user_id);
      const { error } = await supabase.from("telegram_config")
        .update({ user_id, ativo: true, codigo_vinculacao: null }).eq("id", pending.id);
      if (error) throw error;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: pending.telegram_chat_id,
          text: "✅ Conta vinculada com sucesso! Você receberá notificações financeiras por aqui.",
        }),
      });

      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle unlink request
    if (body.action === "unlink") {
      const { user_id } = body;
      const { data: config } = await supabase.from("telegram_config")
        .select("telegram_chat_id").eq("user_id", user_id).maybeSingle();

      if (config) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: config.telegram_chat_id, text: "🔌 Conta desvinculada. Você não receberá mais notificações." }),
        });
      }

      await supabase.from("telegram_config").delete().eq("user_id", user_id);
      await supabase.from("preferencias_telegram").delete().eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Action not recognized" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

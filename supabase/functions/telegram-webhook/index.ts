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

async function handleDespesas(
  supabase: any,
  botToken: string,
  chatId: string,
  text: string,
) {
  // Parse months from command
  const parts = text.trim().split(/\s+/);
  let meses = 3;
  if (parts.length > 1) {
    const parsed = parseInt(parts[1]);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) meses = parsed;
  }

  // Find user by chat_id
  const { data: config } = await supabase
    .from("telegram_config")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .eq("ativo", true)
    .maybeSingle();

  if (!config?.user_id) {
    await sendTelegramMessage(botToken, chatId,
      "❌ Conta não vinculada.\n\nEnvie /start para obter um código de vinculação.");
    return;
  }

  const userId = config.user_id;
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() + meses, 0);
  const inicioStr = inicioMes.toISOString().split("T")[0];
  const fimStr = fimPeriodo.toISOString().split("T")[0];

  // Fetch unpaid card installments
  const { data: parcelas } = await supabase
    .from("parcelas_cartao")
    .select("valor, numero_parcela, total_parcelas, mes_referencia, tipo_recorrencia, compra_id, compras_cartao(descricao, user_id, cartoes(nome))")
    .eq("paga", false)
    .eq("ativo", true)
    .gte("mes_referencia", inicioStr)
    .lte("mes_referencia", fimStr);

  // Fetch pending expense transactions
  const { data: transacoes } = await supabase
    .from("transactions")
    .select("description, amount, due_date, date, numero_parcela, total_parcelas")
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("status", "pendente")
    .gte("due_date", inicioStr)
    .lte("due_date", fimStr);

  // Build items grouped by month key (YYYY-MM)
  interface DespesaItem {
    descricao: string;
    valor: number;
    info: string;
  }
  const porMes: Record<string, DespesaItem[]> = {};

  // Process card installments (filter by user_id from join)
  if (parcelas) {
    for (const p of parcelas) {
      const compra = p.compras_cartao as any;
      if (!compra || compra.user_id !== userId) continue;
      const mesKey = p.mes_referencia.substring(0, 7); // YYYY-MM
      if (!porMes[mesKey]) porMes[mesKey] = [];
      let info = "";
      if (compra.cartoes?.nome) info = `(${compra.cartoes.nome})`;
      if (p.total_parcelas > 1) info = `(${p.numero_parcela}/${p.total_parcelas})`;
      if (p.tipo_recorrencia === "recorrente") info = "(recorrente)";
      porMes[mesKey].push({
        descricao: compra.descricao || "Sem descrição",
        valor: Number(p.valor),
        info,
      });
    }
  }

  // Process pending transactions
  if (transacoes) {
    for (const t of transacoes) {
      const dueDate = t.due_date || t.date;
      if (!dueDate) continue;
      const mesKey = dueDate.substring(0, 7);
      if (!porMes[mesKey]) porMes[mesKey] = [];
      let info = "";
      if (t.total_parcelas && t.total_parcelas > 1) {
        info = `(${t.numero_parcela || 1}/${t.total_parcelas})`;
      }
      porMes[mesKey].push({
        descricao: t.description || "Sem descrição",
        valor: Number(t.amount),
        info,
      });
    }
  }

  const mesesOrdenados = Object.keys(porMes).sort();

  if (mesesOrdenados.length === 0) {
    await sendTelegramMessage(botToken, chatId,
      `📋 *Despesas Futuras (${meses} ${meses === 1 ? "mês" : "meses"})*\n\nNenhuma despesa encontrada no período.`);
    return;
  }

  // Build message
  let totalGeral = 0;
  const secoes: string[] = [];

  for (const mesKey of mesesOrdenados) {
    const [ano, mesNum] = mesKey.split("-");
    const nomeMes = MONTH_NAMES[parseInt(mesNum) - 1];
    const itens = porMes[mesKey];
    let subtotal = 0;

    const MAX_ITENS = 50;
    const linhas: string[] = [];
    const exibir = itens.slice(0, MAX_ITENS);
    for (const item of exibir) {
      subtotal += item.valor;
      const infoStr = item.info ? ` ${item.info}` : "";
      linhas.push(`  • ${item.descricao} - ${formatBRL(item.valor)}${infoStr}`);
    }
    // Count remaining for subtotal
    for (let i = MAX_ITENS; i < itens.length; i++) {
      subtotal += itens[i].valor;
    }
    if (itens.length > MAX_ITENS) {
      linhas.push(`  _...e mais ${itens.length - MAX_ITENS} itens_`);
    }
    linhas.push(`  *Subtotal: ${formatBRL(subtotal)}*`);
    totalGeral += subtotal;

    secoes.push(`📅 *${nomeMes}/${ano}*\n${linhas.join("\n")}`);
  }

  const header = `📋 *Despesas Futuras (${meses} ${meses === 1 ? "mês" : "meses"})*\n\n`;
  const footer = `\n\n💰 *Total geral: ${formatBRL(totalGeral)}*`;
  const corpo = secoes.join("\n\n");
  const mensagemCompleta = header + corpo + footer;

  // Split if too long
  if (mensagemCompleta.length <= 4000) {
    await sendTelegramMessage(botToken, chatId, mensagemCompleta);
  } else {
    // Send header
    await sendTelegramMessage(botToken, chatId, header + "_(mensagem dividida por ser muito longa)_");
    // Send each section
    for (const secao of secoes) {
      if (secao.length > 4000) {
        await sendTelegramMessage(botToken, chatId, secao.substring(0, 4000));
      } else {
        await sendTelegramMessage(botToken, chatId, secao);
      }
    }
    // Send footer
    await sendTelegramMessage(botToken, chatId, footer);
  }
}

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
        return new Response(
          JSON.stringify({ error: "Telegram não vinculado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: config.telegram_chat_id,
            text: "🧪 *Alerta de Teste*\n\nEsta é uma mensagem de teste do sistema de notificações financeiras.\n\n✅ Se você recebeu esta mensagem, a integração está funcionando corretamente!",
            parse_mode: "Markdown",
          }),
        }
      );
      const result = await res.json();
      return new Response(
        JSON.stringify({ success: result.ok, result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle setup-webhook action from frontend
    if (body.action === "setup-webhook") {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl }),
        }
      );
      const result = await res.json();
      console.log("setWebhook result:", result);
      return new Response(
        JSON.stringify({ success: result.ok, result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle Telegram webhook update
    if (body.message) {
      const chatId = String(body.message.chat.id);
      const text = body.message.text || "";

      if (text.startsWith("/start")) {
        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Delete any existing pending config for this chat
        await supabase
          .from("telegram_config")
          .delete()
          .eq("telegram_chat_id", chatId)
          .eq("ativo", false);

        // Insert new pending config (user_id is null until linked)
        await supabase.from("telegram_config").insert({
          telegram_chat_id: chatId,
          codigo_vinculacao: codigo,
          ativo: false,
        });

        // Send welcome message with the code
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `🔗 *Código de Vinculação*\n\nSeu código: \`${codigo}\`\n\nCole este código na página de Configurações de Notificações do sistema para vincular sua conta.`,
              parse_mode: "Markdown",
            }),
          }
        );
      } else if (text.startsWith("/despesas")) {
        await handleDespesas(supabase, TELEGRAM_BOT_TOKEN, chatId, text);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle linking request from frontend
    if (body.action === "link") {
      const { codigo, user_id } = body;
      if (!codigo || !user_id) {
        return new Response(
          JSON.stringify({ error: "Código e user_id são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find pending config with this code
      const { data: pending } = await supabase
        .from("telegram_config")
        .select("*")
        .eq("codigo_vinculacao", codigo.toUpperCase())
        .eq("ativo", false)
        .maybeSingle();

      if (!pending) {
        return new Response(
          JSON.stringify({ error: "Código inválido ou expirado. Envie /start novamente no bot." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete any existing active config for this user
      await supabase.from("telegram_config").delete().eq("user_id", user_id);

      // Update the pending config with the real user_id
      const { error } = await supabase
        .from("telegram_config")
        .update({
          user_id,
          ativo: true,
          codigo_vinculacao: null,
        })
        .eq("id", pending.id);

      if (error) throw error;

      // Send confirmation to Telegram
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: pending.telegram_chat_id,
            text: "✅ Conta vinculada com sucesso! Você receberá notificações financeiras por aqui.",
          }),
        }
      );

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle unlink request
    if (body.action === "unlink") {
      const { user_id } = body;

      const { data: config } = await supabase
        .from("telegram_config")
        .select("telegram_chat_id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (config) {
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: config.telegram_chat_id,
              text: "🔌 Conta desvinculada. Você não receberá mais notificações.",
            }),
          }
        );
      }

      await supabase.from("telegram_config").delete().eq("user_id", user_id);
      await supabase.from("preferencias_telegram").delete().eq("user_id", user_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Action not recognized" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

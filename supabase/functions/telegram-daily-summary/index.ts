import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Get all active Telegram configs
    const { data: configs } = await supabase
      .from("telegram_config")
      .select("user_id, telegram_chat_id")
      .eq("ativo", true);

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum usuário com Telegram ativo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let enviados = 0;

    for (const config of configs) {
      // Get user's Telegram preferences (only enabled ones)
      const { data: prefs } = await supabase
        .from("preferencias_telegram")
        .select("tipo_alerta")
        .eq("user_id", config.user_id)
        .eq("ativo", true);

      if (!prefs || prefs.length === 0) continue;

      const tiposAtivos = prefs.map((p: any) => p.tipo_alerta);

      // Build summary sections
      const secoes: string[] = [];

      // Check transactions due today or overdue
      const hoje = new Date().toISOString().split("T")[0];
      
      if (tiposAtivos.some((t: string) => t.startsWith("transacao_"))) {
        const { data: transacoes } = await supabase
          .from("transactions")
          .select("description, amount, due_date, type, status")
          .eq("user_id", config.user_id)
          .eq("status", "pendente")
          .lte("due_date", hoje);

        if (transacoes && transacoes.length > 0) {
          const linhas = transacoes.slice(0, 5).map((t: any) => {
            const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(t.amount);
            return `  • ${t.description || "Sem descrição"}: ${valor}`;
          });
          secoes.push(`📋 *Contas pendentes:*\n${linhas.join("\n")}`);
        }
      }

      // Check metas progress
      if (tiposAtivos.some((t: string) => t.startsWith("meta_"))) {
        const { data: metas } = await supabase
          .from("metas")
          .select("titulo, valor_atual, valor_alvo")
          .eq("user_id", config.user_id)
          .eq("concluida", false);

        if (metas && metas.length > 0) {
          const linhas = metas.slice(0, 3).map((m: any) => {
            const pct = m.valor_alvo > 0 ? Math.round((m.valor_atual / m.valor_alvo) * 100) : 0;
            return `  • ${m.titulo}: ${pct}%`;
          });
          secoes.push(`🎯 *Metas em andamento:*\n${linhas.join("\n")}`);
        }
      }

      if (secoes.length === 0) continue;

      const mensagem = `📊 *Resumo Diário*\n\n${secoes.join("\n\n")}\n\n_Enviado automaticamente pelo seu sistema financeiro._`;

      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: config.telegram_chat_id,
            text: mensagem,
            parse_mode: "Markdown",
          }),
        }
      );

      enviados++;
    }

    return new Response(
      JSON.stringify({ success: true, enviados }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daily summary error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

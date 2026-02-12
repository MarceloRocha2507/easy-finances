import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMOJI_MAP: Record<string, string> = {
  danger: "🔴",
  warning: "⚠️",
  info: "ℹ️",
  success: "✅",
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

    const { user_id, alertas } = await req.json();

    if (!user_id || !alertas || !Array.isArray(alertas) || alertas.length === 0) {
      return new Response(
        JSON.stringify({ error: "user_id e alertas são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's Telegram config
    const { data: config } = await supabase
      .from("telegram_config")
      .select("telegram_chat_id, ativo")
      .eq("user_id", user_id)
      .eq("ativo", true)
      .maybeSingle();

    if (!config) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Telegram não configurado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's Telegram notification preferences
    const { data: prefs } = await supabase
      .from("preferencias_telegram")
      .select("tipo_alerta, ativo")
      .eq("user_id", user_id);

    const prefsMap: Record<string, boolean> = {};
    (prefs || []).forEach((p: any) => {
      prefsMap[p.tipo_alerta] = p.ativo;
    });

    // Filter alerts based on preferences
    const alertasFiltrados = alertas.filter((a: any) => {
      return prefsMap[a.tipo_alerta] === true;
    });

    if (alertasFiltrados.length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Nenhum alerta habilitado para Telegram" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message
    const linhas = alertasFiltrados.map((a: any) => {
      const emoji = EMOJI_MAP[a.tipo] || "📌";
      return `${emoji} ${a.mensagem}`;
    });

    const mensagem = `📊 *Alerta Financeiro*\n\n${linhas.join("\n")}`;

    // Send to Telegram
    const response = await fetch(
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

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, sent: alertasFiltrados.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Telegram send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

    const body = await req.json();

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

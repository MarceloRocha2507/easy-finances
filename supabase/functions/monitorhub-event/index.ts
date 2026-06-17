// Recebe eventos do frontend autenticado e encaminha ao MonitorHub.
// O token do MonitorHub vive só no servidor — o cliente NUNCA o vê.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEvento } from "../_shared/monitorhub.ts";

interface EventBody {
  event: "transacao_criada" | "fatura_paga";
  value?: number;
  payload?: Record<string, unknown>;
}

function isValidBody(b: unknown): b is EventBody {
  if (!b || typeof b !== "object") return false;
  const e = (b as EventBody).event;
  return e === "transacao_criada" || e === "fatura_paga";
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!isValidBody(body)) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Envia o evento (fire-and-forget interno)
    await enviarEvento(body.event, body.value, {
      user_id: userRes.user.id,
      ...(body.payload ?? {}),
    });

    // Para eventos financeiros, atualiza também a métrica de saldo do usuário.
    if (body.refreshSaldo !== false) {
      const saldo = await computarSaldoUsuario(supabase, userRes.user.id);
      await enviarMetrica(`saldo_${userRes.user.id}`, saldo, "BRL");
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[monitorhub-event] erro:", err);
    // Não derruba o sistema: responde 200 para o cliente nunca falhar por causa do hub.
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

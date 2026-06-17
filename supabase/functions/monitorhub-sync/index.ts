// Job agendado (a cada 5 min). Calcula métricas globais e envia ao MonitorHub.
// Sem autenticação de usuário: usa SERVICE_ROLE_KEY e filtra por
// user_id = MONITORHUB_OWNER_USER_ID (definido como secret).

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarMetricas } from "../_shared/monitorhub.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ownerId = Deno.env.get("MONITORHUB_OWNER_USER_ID");
    if (!ownerId) {
      throw new Error("MONITORHUB_OWNER_USER_ID não configurado");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Saldo acumulado (todas as datas):
    //    soma(income completed) - soma(expense completed)
    const baseFilter = supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", ownerId)
      .eq("desconsiderada", false)
      .eq("status", "completed");

    const { data: completedTx, error: errCompleted } = await baseFilter;
    if (errCompleted) throw errCompleted;

    let saldo = 0;
    for (const t of (completedTx ?? []) as Array<{ amount: number | null; type: string }>) {
      const v = Number(t.amount) || 0;
      if (t.type === "income") saldo += v;
      else if (t.type === "expense") saldo -= v;
    }

    // 2) Total a pagar = expense pending dentro do mês corrente
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
      .toISOString()
      .slice(0, 10);

    const { data: pendentes, error: errTx } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", ownerId)
      .eq("type", "expense")
      .eq("status", "pending")
      .eq("desconsiderada", false)
      .gte("date", inicio)
      .lt("date", fim);
    if (errTx) throw errTx;

    const totalAPagar = (pendentes ?? []).reduce(
      (s, t: { amount: number | null }) => s + (Number(t.amount) || 0),
      0
    );

    const saldoFinal = Number(saldo.toFixed(2));
    const totalAPagarFinal = Number(totalAPagar.toFixed(2));

    console.log("[monitorhub-sync] saldo:", saldoFinal);
    console.log("[monitorhub-sync] total_a_pagar:", totalAPagarFinal);

    await enviarMetricas([
      { key: "saldo", value: saldoFinal, unit: "BRL" },
      { key: "total_a_pagar", value: totalAPagarFinal, unit: "BRL" },
    ]);

    return new Response(
      JSON.stringify({ ok: true, saldo: saldoFinal, total_a_pagar: totalAPagarFinal }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[monitorhub-sync] erro:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

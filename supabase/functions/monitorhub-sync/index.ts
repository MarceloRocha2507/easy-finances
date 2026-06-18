// Job (cron ou manual). Reproduz o "Saldo Real" do app e envia ao MonitorHub.
// Lê toggles e owner_user_id de public.monitorhub_config.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  enviarMetricas,
  getConfig,
  logMonitorhub,
  type Metrica,
} from "../_shared/monitorhub.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const finalize = async (status: "ok" | "error", error?: string, detail?: string) => {
    await admin
      .from("monitorhub_config")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: status,
        last_sync_error: error ?? null,
      })
      .eq("singleton", true);
    await logMonitorhub("sync", status, detail, error);
  };

  try {
    const cfg = await getConfig();
    if (!cfg || !cfg.enabled) {
      await finalize("ok", undefined, "integration_disabled");
      return new Response(JSON.stringify({ ok: true, skipped: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerId =
      cfg.owner_user_id ?? Deno.env.get("MONITORHUB_OWNER_USER_ID") ?? null;
    if (!ownerId) throw new Error("owner_user_id não configurado");

    // 1) Saldo inicial dos bancos ativos; fallback profile
    const { data: bancos, error: errBancos } = await admin
      .from("bancos").select("saldo_inicial").eq("user_id", ownerId).eq("ativo", true);
    if (errBancos) throw errBancos;
    const saldoInicialBancos = (bancos ?? []).reduce(
      (s, b: { saldo_inicial: number | null }) => s + (Number(b.saldo_inicial) || 0), 0);
    let saldoInicial = saldoInicialBancos;
    if (saldoInicialBancos === 0) {
      const { data: profile } = await admin
        .from("profiles").select("saldo_inicial").eq("user_id", ownerId).maybeSingle();
      saldoInicial = Number(profile?.saldo_inicial) || 0;
    }

    // 2) Transações completed (todas as datas)
    const { data: completedTx, error: errCompleted } = await admin
      .from("transactions").select("amount, type")
      .eq("user_id", ownerId).eq("status", "completed").eq("desconsiderada", false)
      .is("deleted_at", null).limit(10000);
    if (errCompleted) throw errCompleted;
    let income = 0, expense = 0;
    for (const t of (completedTx ?? []) as Array<{ amount: number | null; type: string }>) {
      const v = Number(t.amount) || 0;
      if (t.type === "income") income += v;
      else if (t.type === "expense") expense += v;
    }
    const saldo = Number((saldoInicial + income - expense).toFixed(2));

    // 3) Total a pagar — expense pending no mês corrente
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString().slice(0, 10);
    const { data: pendentes, error: errPend } = await admin
      .from("transactions").select("amount")
      .eq("user_id", ownerId).eq("type", "expense").eq("status", "pending")
      .eq("desconsiderada", false).is("deleted_at", null)
      .gte("due_date", inicio).lt("due_date", fim);
    if (errPend) throw errPend;
    const totalAPagar = Number((pendentes ?? []).reduce(
      (s, t: { amount: number | null }) => s + (Number(t.amount) || 0), 0).toFixed(2));

    console.log("[monitorhub-sync] saldo:", saldo, "total_a_pagar:", totalAPagar);

    const metricas: Metrica[] = [];
    if (cfg.send_saldo) metricas.push({ key: "saldo", value: saldo, unit: "BRL" });
    if (cfg.send_total_a_pagar) metricas.push({ key: "total_a_pagar", value: totalAPagar, unit: "BRL" });

    if (metricas.length > 0) await enviarMetricas(metricas);

    await finalize("ok", undefined, `saldo=${saldo}; total_a_pagar=${totalAPagar}`);

    return new Response(
      JSON.stringify({ ok: true, saldo, total_a_pagar: totalAPagar }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[monitorhub-sync] erro:", msg);
    await finalize("error", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

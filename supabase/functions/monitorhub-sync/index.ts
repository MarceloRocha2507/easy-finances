// Job agendado (a cada 5 min). Calcula métricas globais e envia ao MonitorHub.
// Reproduz o "Saldo Real" do app (useCompleteStats):
//   saldoReal = saldoInicial(bancos ativos ou fallback profile)
//             + soma(income completed, desconsiderada=false)
//             - soma(expense completed, desconsiderada=false)
// Compras no cartão NÃO entram (estão em compras_cartao/parcelas_cartao).
// Apenas a transação de pagamento de fatura (categoria 'Fatura do Cartão')
// reduz o saldo, e ela já é contabilizada como expense completed.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarMetricas } from "../_shared/monitorhub.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ownerId = Deno.env.get("MONITORHUB_OWNER_USER_ID");
    if (!ownerId) throw new Error("MONITORHUB_OWNER_USER_ID não configurado");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Saldo inicial: soma de bancos ativos; fallback para profiles.saldo_inicial
    const { data: bancos, error: errBancos } = await supabase
      .from("bancos")
      .select("saldo_inicial")
      .eq("user_id", ownerId)
      .eq("ativo", true);
    if (errBancos) throw errBancos;

    const saldoInicialBancos = (bancos ?? []).reduce(
      (s, b: { saldo_inicial: number | null }) => s + (Number(b.saldo_inicial) || 0),
      0
    );

    let saldoInicial = saldoInicialBancos;
    if (saldoInicialBancos === 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("saldo_inicial")
        .eq("user_id", ownerId)
        .maybeSingle();
      saldoInicial = Number(profile?.saldo_inicial) || 0;
    }

    // 2) Transações completed acumuladas (todas as datas), desconsiderada=false,
    //    e não deletadas. Pagamento de fatura ('Fatura do Cartão') já é um
    //    expense normal aqui — reproduzindo a lógica do app.
    const { data: completedTx, error: errCompleted } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", ownerId)
      .eq("status", "completed")
      .eq("desconsiderada", false)
      .is("deleted_at", null)
      .limit(10000);
    if (errCompleted) throw errCompleted;

    let income = 0;
    let expense = 0;
    for (const t of (completedTx ?? []) as Array<{ amount: number | null; type: string }>) {
      const v = Number(t.amount) || 0;
      if (t.type === "income") income += v;
      else if (t.type === "expense") expense += v;
    }

    const saldo = Number((saldoInicial + income - expense).toFixed(2));

    // 3) Total a pagar = expense pending no mês corrente (due_date),
    //    desconsiderada=false, não deletado. Espelha o card "A Pagar".
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString().slice(0, 10);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
      .toISOString().slice(0, 10);

    const { data: pendentes, error: errPend } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", ownerId)
      .eq("type", "expense")
      .eq("status", "pending")
      .eq("desconsiderada", false)
      .is("deleted_at", null)
      .gte("due_date", inicio)
      .lt("due_date", fim);
    if (errPend) throw errPend;

    const totalAPagar = Number(
      (pendentes ?? []).reduce(
        (s, t: { amount: number | null }) => s + (Number(t.amount) || 0),
        0
      ).toFixed(2)
    );

    console.log("[monitorhub-sync] saldoInicial:", saldoInicial);
    console.log("[monitorhub-sync] income(completed):", income);
    console.log("[monitorhub-sync] expense(completed):", expense);
    console.log("[monitorhub-sync] saldo (Saldo Real):", saldo);
    console.log("[monitorhub-sync] total_a_pagar:", totalAPagar);

    await enviarMetricas([
      { key: "saldo", value: saldo, unit: "BRL" },
      { key: "total_a_pagar", value: totalAPagar, unit: "BRL" },
    ]);

    return new Response(
      JSON.stringify({ ok: true, saldo, total_a_pagar: totalAPagar, saldoInicial }),
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

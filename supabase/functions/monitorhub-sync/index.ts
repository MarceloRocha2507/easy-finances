// Job agendado (a cada 5 min). Calcula métricas globais e envia ao MonitorHub.
// Sem autenticação de usuário: usa SERVICE_ROLE_KEY para somar todos os dados.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarMetricas } from "../_shared/monitorhub.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Saldo global = soma de saldo_atual em bancos ativos
    const { data: bancos, error: errBancos } = await supabase
      .from("bancos")
      .select("saldo_atual")
      .eq("ativo", true);
    if (errBancos) throw errBancos;
    const saldoGlobal = (bancos ?? []).reduce(
      (s, b: { saldo_atual: number | null }) => s + (Number(b.saldo_atual) || 0),
      0
    );

    // 2) Total a pagar do mês = transações expense pending (data dentro do mês corrente)
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
      .eq("type", "expense")
      .eq("status", "pending")
      .eq("desconsiderada", false)
      .is("deleted_at", null)
      .gte("date", inicio)
      .lt("date", fim);
    if (errTx) throw errTx;
    const totalAPagarTx = (pendentes ?? []).reduce(
      (s, t: { amount: number | null }) => s + (Number(t.amount) || 0),
      0
    );

    // + parcelas de cartão do mês ainda não pagas
    const mesRef = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const { data: parcelas, error: errPar } = await supabase
      .from("parcelas_cartao")
      .select("valor, ativo, paga, mes_referencia")
      .eq("ativo", true)
      .eq("paga", false)
      .eq("mes_referencia", mesRef);
    if (errPar) throw errPar;
    const totalAPagarCartao = (parcelas ?? []).reduce(
      (s, p: { valor: number | null }) => s + (Number(p.valor) || 0),
      0
    );

    const totalAPagar = totalAPagarTx + totalAPagarCartao;

    await enviarMetricas([
      { key: "saldo", value: Number(saldoGlobal.toFixed(2)), unit: "BRL" },
      { key: "total_a_pagar", value: Number(totalAPagar.toFixed(2)), unit: "BRL" },
    ]);

    return new Response(
      JSON.stringify({ ok: true, saldo: saldoGlobal, total_a_pagar: totalAPagar }),
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

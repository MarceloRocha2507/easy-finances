// Cálculo determinístico da fatura PicPay.
// Regra simples: somam-se apenas as compras NORMAIS (não riscadas, não créditos).
// Itens riscados/tachados e créditos/estornos são descartados.
// Pagamento de Fatura é subtraído.

import type { CompraExtraida } from "@/components/cartoes/RevisarComprasLoteDialog";

export interface BreakdownItem {
  compra: CompraExtraida;
  valor: number;
}

export interface PagamentoFaturaItem extends BreakdownItem {
  status: "aplicado" | "ignorado"; // ignorado = quitou a fatura anterior
  motivo?: string;
}

export interface FaturaPicpayBreakdown {
  regra1_avista: { itens: BreakdownItem[]; total: number };
  regra2_parcelas: { itens: BreakdownItem[]; total: number };
  regra3_fin_iof: { itens: BreakdownItem[]; total: number };
  regra5_pagamentos: { itens: PagamentoFaturaItem[]; total: number };
  ignorados: { descartados: CompraExtraida[] };
  total_calculado: number;
}

const eq = (a: number, b: number, tol = 0.02) => Math.abs(a - b) < tol;

function valorLinha(c: CompraExtraida): number {
  return typeof c.valor === "number" ? c.valor : 0;
}

function isFin(c: CompraExtraida): boolean {
  const linha = (c.linha_original || "").toLowerCase();
  const nome = (c.estabelecimento || "").toLowerCase();
  return /\bfin\b/.test(linha) || /\bfin\b/.test(nome);
}

function temSufixoParcela(c: CompraExtraida): boolean {
  const txt = `${c.linha_original || ""} ${c.estabelecimento || ""}`.toLowerCase();
  return /parc\s*\d{1,2}\s*\/\s*\d{1,2}|\b\d{1,2}\s*\/\s*\d{1,2}\b/.test(txt);
}

export function calcularFaturaPicpay(
  compras: CompraExtraida[],
  saldoAnterior: number,
  pagamentoManual = 0,
): FaturaPicpayBreakdown {
  const regra1: BreakdownItem[] = [];
  const regra2: BreakdownItem[] = [];
  const regra3: BreakdownItem[] = [];
  const pagamentos: PagamentoFaturaItem[] = [];
  const descartados: CompraExtraida[] = [];

  for (const c of compras) {
    const v = valorLinha(c);
    const tipo = c.tipo || "compra";
    const sinal = c.sinal || "debito";

    // R5 — pagamento de fatura (verificado antes do guard de crédito)
    if (tipo === "pagamento_fatura") {
      pagamentos.push({ compra: c, valor: v, status: "aplicado" });
      continue;
    }

    // Riscado/tachado ou explicitamente ignorado → descarta
    if (c.riscada === true || c.ignorar === true) {
      descartados.push(c);
      continue;
    }

    // Crédito/estorno → descarta
    if (sinal === "credito") {
      descartados.push(c);
      continue;
    }

    // R3 — IOF e Fin (1ª parcela de novo parcelamento PicPay)
    if (tipo === "iof") {
      regra3.push({ compra: c, valor: v });
      continue;
    }
    if (isFin(c) && (c.parcelas || 1) > 1) {
      regra3.push({ compra: c, valor: v });
      continue;
    }

    // R2 — parcelas de compras anteriores
    if ((c.valor_eh_parcela === true || temSufixoParcela(c)) && (c.parcelas || 1) > 1) {
      regra2.push({ compra: c, valor: v });
      continue;
    }

    // R1 — compras à vista
    regra1.push({ compra: c, valor: v });
  }

  // Regra 5 — tratamento por saldo anterior
  let totalPagamentos = 0;
  if (pagamentos.length > 0) {
    if (eq(saldoAnterior, 0) && pagamentos.length >= 2) {
      // Ignora o maior pagamento (quitou a fatura anterior)
      const sorted = [...pagamentos].sort((a, b) => b.valor - a.valor);
      const maior = sorted[0];
      maior.status = "ignorado";
      maior.motivo = "Quitação da fatura anterior (saldo anterior = R$ 0,00)";
      for (const p of pagamentos) {
        if (p !== maior) totalPagamentos += p.valor;
      }
    } else {
      for (const p of pagamentos) totalPagamentos += p.valor;
    }
  }

  const sum = (arr: BreakdownItem[]) => arr.reduce((s, i) => s + i.valor, 0);
  const t1 = sum(regra1);
  const t2 = sum(regra2);
  const t3 = sum(regra3);

  // Pagamento manual complementa quando a IA não extraiu os pagamentos_fatura.
  const totalPagamentosEfetivo = totalPagamentos > 0 ? totalPagamentos : pagamentoManual;

  return {
    regra1_avista: { itens: regra1, total: t1 },
    regra2_parcelas: { itens: regra2, total: t2 },
    regra3_fin_iof: { itens: regra3, total: t3 },
    regra5_pagamentos: { itens: pagamentos, total: totalPagamentosEfetivo },
    ignorados: { descartados },
    total_calculado: t1 + t2 + t3 - totalPagamentosEfetivo,
  };
}

export function formatBRL(v: number): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}R$ ${Math.abs(v).toFixed(2).replace(".", ",")}`;
}

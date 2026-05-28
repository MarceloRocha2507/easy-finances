// Cálculo determinístico da fatura PicPay segundo as 5 regras documentadas.
// Recebe as compras já extraídas pela IA (com riscada/ignorar/tipo) + saldo da
// fatura anterior (vindo do Resumo) e devolve o breakdown por regra + total.

import type { CompraExtraida } from "@/components/cartoes/RevisarComprasLoteDialog";

export interface BreakdownItem {
  compra: CompraExtraida;
  valor: number; // valor que efetivamente entra no subtotal (cheio, parcela, IOF etc.)
}

export interface PagamentoFaturaItem extends BreakdownItem {
  status: "aplicado" | "ignorado"; // ignorado = quitou a fatura anterior
  motivo?: string;
}

export interface FaturaPicpayBreakdown {
  regra1_avista: { itens: BreakdownItem[]; total: number };
  regra2_parcelas: { itens: BreakdownItem[]; total: number };
  regra3_fin_iof: { itens: BreakdownItem[]; total: number };
  regra4_riscadas_sem_credito: { itens: BreakdownItem[]; total: number };
  regra5_pagamentos: { itens: PagamentoFaturaItem[]; total: number };
  ignorados: { riscadasComCredito: CompraExtraida[]; creditosParcelamento: CompraExtraida[] };
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
): FaturaPicpayBreakdown {
  // PRÉ-PROCESSAMENTO: parear créditos "Credito Parcelamento Compra" com sua compra
  // original pelo valor, para os casos em que a IA não detectou o tachado visualmente
  // e o servidor não pôde marcar ignorar=true.
  const efetivamenteIgnorar = new Set<CompraExtraida>();
  const creditosSemIgnorar = compras.filter(
    (c) =>
      !c.ignorar &&
      (c.sinal || "debito") === "credito" &&
      (c.tipo === "estorno_parcelamento" ||
        /credito\s*parcelamento\s*compra/i.test(c.linha_original || c.estabelecimento || "")),
  );
  for (const credito of creditosSemIgnorar) {
    if (efetivamenteIgnorar.has(credito)) continue;
    const compraOriginal = compras.find(
      (c) =>
        !c.ignorar &&
        !efetivamenteIgnorar.has(c) &&
        (c.sinal || "debito") !== "credito" &&
        c.tipo !== "iof" &&
        c.tipo !== "pagamento_fatura" &&
        !isFin(c) &&
        Math.abs(valorLinha(c) - valorLinha(credito)) < 0.02,
    );
    if (compraOriginal) {
      efetivamenteIgnorar.add(compraOriginal);
      efetivamenteIgnorar.add(credito);
    }
  }

  const regra1: BreakdownItem[] = [];
  const regra2: BreakdownItem[] = [];
  const regra3: BreakdownItem[] = [];
  const regra4: BreakdownItem[] = [];
  const pagamentos: PagamentoFaturaItem[] = [];
  const riscadasComCredito: CompraExtraida[] = [];
  const creditosParcelamento: CompraExtraida[] = [];

  for (const c of compras) {
    const v = valorLinha(c);
    const tipo = c.tipo || "compra";
    const sinal = c.sinal || "debito";

    // Itens ignorados (regras 3a/3b): marcados pelo servidor ou pelo pré-processamento acima
    if (c.ignorar === true || efetivamenteIgnorar.has(c)) {
      if (tipo === "estorno_parcelamento" || sinal === "credito") {
        creditosParcelamento.push(c);
      } else {
        riscadasComCredito.push(c);
      }
      continue;
    }

    // R5 — pagamento de fatura
    if (tipo === "pagamento_fatura") {
      pagamentos.push({ compra: c, valor: v, status: "aplicado" });
      continue;
    }

    // Guard: créditos que escaparam do ignorar=true (trio-detection falhou) não devem
    // inflacionar R1/R2/R3. Crédito de parcelamento que não foi pareado → descarta silenciosamente.
    if (sinal === "credito") {
      creditosParcelamento.push(c);
      continue;
    }

    // R4 — riscada SEM crédito correspondente
    if (c.riscada === true) {
      regra4.push({ compra: c, valor: v });
      continue;
    }

    // R3 — Fin (1ª parcela) e IOFs de parcelamentos novos
    if (tipo === "iof") {
      regra3.push({ compra: c, valor: v });
      continue;
    }
    if (isFin(c) && (c.parcelas || 1) > 1) {
      regra3.push({ compra: c, valor: v });
      continue;
    }

    // R2 — parcelas de compras anteriores (tem sufixo parcXX/YY e parcela > 1 ou valor_eh_parcela)
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
      // Ordena por valor desc; ignora o maior (quitou fatura anterior).
      const sorted = [...pagamentos].sort((a, b) => b.valor - a.valor);
      const maior = sorted[0];
      maior.status = "ignorado";
      maior.motivo = "Quitação da fatura anterior (saldo anterior = R$ 0,00)";
      for (const p of pagamentos) {
        if (p === maior) continue;
        totalPagamentos += p.valor;
      }
    } else {
      // Único pagamento, ou saldo anterior > 0: todos entram como crédito da fatura atual.
      for (const p of pagamentos) totalPagamentos += p.valor;
    }
  }

  const sum = (arr: BreakdownItem[]) => arr.reduce((s, i) => s + i.valor, 0);
  const t1 = sum(regra1);
  const t2 = sum(regra2);
  const t3 = sum(regra3);
  const t4 = sum(regra4);

  return {
    regra1_avista: { itens: regra1, total: t1 },
    regra2_parcelas: { itens: regra2, total: t2 },
    regra3_fin_iof: { itens: regra3, total: t3 },
    regra4_riscadas_sem_credito: { itens: regra4, total: t4 },
    regra5_pagamentos: { itens: pagamentos, total: totalPagamentos },
    ignorados: { riscadasComCredito, creditosParcelamento },
    total_calculado: t1 + t2 + t3 + t4 - totalPagamentos,
  };
}

export function formatBRL(v: number): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}R$ ${Math.abs(v).toFixed(2).replace(".", ",")}`;
}

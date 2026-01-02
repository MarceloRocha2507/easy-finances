import { supabase } from "@/integrations/supabase/client";

/* ======================================================
   TIPOS (LEGADO)
====================================================== */

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
};

/* ======================================================
   TIPOS (NOVO - PARCELAMENTO)
====================================================== */

export type CompraCartao = {
  id: string;
  cartao_id: string;
  descricao: string;
  valor_total: number;
  parcelas: number;
  categoria_id?: string | null;
  created_at?: string;
};

export type ParcelaFatura = {
  id: string;
  compra_id: string;
  valor: number;
  numero_parcela: number;
  total_parcelas: number;
  mes_referencia: string;
  paga?: boolean | null;
  descricao: string;
  categoria_id?: string | null;
  categoria_nome?: string | null;
  categoria_cor?: string | null;
  categoria_icone?: string | null;
  created_at?: string;
};

/* ======================================================
   LEGADO (transactions) — NÃO MEXE
====================================================== */

export async function listarGastosDoCartao(
  cartaoId: string
): Promise<Transaction[]> {
  const { data, error } = await (supabase as any)
    .from("transactions")
    .select("id, description, amount, created_at")
    .eq("cartao_id", cartaoId)
    .eq("tipo_pagamento", "CARTAO")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function criarCompraNoCartao(data: {
  description: string;
  amount: number;
  cartao_id: string;
}) {
  const { error } = await (supabase as any).from("transactions").insert({
    description: data.description,
    amount: data.amount,
    tipo_pagamento: "CARTAO",
    cartao_id: data.cartao_id,
    type: "EXPENSE",
  });

  if (error) throw error;
}

export async function atualizarTransacao(
  id: string,
  dados: Partial<Transaction>
) {
  const { error } = await (supabase as any)
    .from("transactions")
    .update(dados)
    .eq("id", id);

  if (error) throw error;
}

export async function excluirTransacao(id: string) {
  const { error } = await (supabase as any)
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ======================================================
   NOVO PADRÃO — PARCELAMENTO REAL
====================================================== */

function toDateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function firstDayOfMonth(date: Date) {
  return toDateOnly(new Date(date.getFullYear(), date.getMonth(), 1));
}

function calcularMesReferencia(
  diaFechamento: number,
  dataCompra = new Date()
) {
  const ano = dataCompra.getFullYear();
  const mes = dataCompra.getMonth();
  const dia = dataCompra.getDate();

  if (dia <= diaFechamento) return new Date(ano, mes, 1);
  return new Date(ano, mes + 1, 1);
}

/* ======================================================
   CRIAR COMPRA PARCELADA
====================================================== */

export async function criarCompraParcelada(data: {
  cartaoId: string;
  descricao: string;
  valorTotal: number;
  parcelas: number;
  diaFechamento: number;
  categoriaId?: string | null;
}) {
  const {
    cartaoId,
    descricao,
    valorTotal,
    parcelas,
    diaFechamento,
    categoriaId,
  } = data;

  const { data: compraRaw, error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .insert({
      cartao_id: cartaoId,
      descricao,
      valor_total: valorTotal,
      parcelas,
      categoria_id: categoriaId || null,
    })
    .select("id, cartao_id, descricao, valor_total, parcelas")
    .single();

  if (compraError) throw compraError;
  if (!compraRaw?.id) throw new Error("Compra não retornou ID");

  const primeiraFatura = calcularMesReferencia(diaFechamento);
  const valorParcela = Number((valorTotal / parcelas).toFixed(2));

  const parcelasPayload = Array.from({ length: parcelas }, (_, index) => {
    const mesReferencia = new Date(
      primeiraFatura.getFullYear(),
      primeiraFatura.getMonth() + index,
      1
    );

    return {
      compra_id: compraRaw.id,
      numero_parcela: index + 1,
      total_parcelas: parcelas,
      valor: valorParcela,
      mes_referencia: firstDayOfMonth(mesReferencia),
      paga: false,
    };
  });

  const { error: parcelasError } = await (supabase as any)
    .from("parcelas_cartao")
    .insert(parcelasPayload);

  if (parcelasError) throw parcelasError;
}

/* ======================================================
   LISTAR PARCELAS DA FATURA (COM CATEGORIA)
====================================================== */

export async function listarParcelasDaFatura(
  cartaoId: string,
  mesReferencia: Date
): Promise<ParcelaFatura[]> {
  const inicio = new Date(
    mesReferencia.getFullYear(),
    mesReferencia.getMonth(),
    1
  );
  const fim = new Date(
    mesReferencia.getFullYear(),
    mesReferencia.getMonth() + 1,
    1
  );

  const inicioStr = firstDayOfMonth(inicio);
  const fimStr = firstDayOfMonth(fim);

  const { data, error } = await (supabase as any)
    .from("parcelas_cartao")
    .select(
      `
      id,
      compra_id,
      valor,
      numero_parcela,
      total_parcelas,
      mes_referencia,
      paga,
      created_at,
      compras_cartao!inner (
        id,
        cartao_id,
        descricao,
        categoria_id,
        categorias (
          id,
          nome,
          cor,
          icone
        )
      )
    `
    )
    .eq("compras_cartao.cartao_id", cartaoId)
    .gte("mes_referencia", inicioStr)
    .lt("mes_referencia", fimStr)
    .order("mes_referencia", { ascending: true })
    .order("numero_parcela", { ascending: true });

  if (error) throw error;

  return (
    data?.map((r: any) => ({
      id: String(r.id),
      compra_id: String(r.compra_id),
      valor: Number(r.valor ?? 0),
      numero_parcela: Number(r.numero_parcela ?? 1),
      total_parcelas: Number(r.total_parcelas ?? 1),
      mes_referencia: String(r.mes_referencia ?? ""),
      paga: r.paga ?? false,
      created_at: r.created_at,
      descricao: r.compras_cartao?.descricao ?? "Sem descrição",
      categoria_id: r.compras_cartao?.categoria_id ?? null,
      categoria_nome: r.compras_cartao?.categorias?.nome ?? null,
      categoria_cor: r.compras_cartao?.categorias?.cor ?? null,
      categoria_icone: r.compras_cartao?.categorias?.icone ?? null,
    })) ?? []
  );
}

/* ======================================================
   BUSCAR COMPRA POR ID
====================================================== */

export async function buscarCompraPorId(compraId: string) {
  const { data, error } = await (supabase as any)
    .from("compras_cartao")
    .select(
      `
      id,
      cartao_id,
      descricao,
      valor_total,
      parcelas,
      categoria_id,
      created_at
    `
    )
    .eq("id", compraId)
    .single();

  if (error) throw error;
  return data;
}

/* ======================================================
   ATUALIZAR COMPRA (descrição e categoria)
====================================================== */

export async function atualizarCompraCartao(
  compraId: string,
  dados: {
    descricao?: string;
    categoria_id?: string | null;
  }
): Promise<void> {
  const { error } = await (supabase as any)
    .from("compras_cartao")
    .update(dados)
    .eq("id", compraId);

  if (error) throw error;
}

/* ======================================================
   ATUALIZAR VALOR DA COMPRA (recalcula parcelas)
====================================================== */

export async function atualizarValorCompra(
  compraId: string,
  novoValorTotal: number
): Promise<void> {
  const { data: compra, error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .select("parcelas")
    .eq("id", compraId)
    .single();

  if (compraError) throw compraError;

  const numParcelas = compra.parcelas || 1;
  const novoValorParcela = Number((novoValorTotal / numParcelas).toFixed(2));

  const { error: updateCompraError } = await (supabase as any)
    .from("compras_cartao")
    .update({ valor_total: novoValorTotal })
    .eq("id", compraId);

  if (updateCompraError) throw updateCompraError;

  const { error: updateParcelasError } = await (supabase as any)
    .from("parcelas_cartao")
    .update({ valor: novoValorParcela })
    .eq("compra_id", compraId)
    .eq("paga", false);

  if (updateParcelasError) throw updateParcelasError;
}

/* ======================================================
   EXCLUIR COMPRA (PAI)
====================================================== */

export async function excluirCompraCartao(compraId: string) {
  const { error } = await (supabase as any)
    .from("compras_cartao")
    .delete()
    .eq("id", compraId);

  if (error) throw error;
}

/* ======================================================
   MARCAR PARCELA COMO PAGA
====================================================== */

export async function marcarParcelaComoPaga(
  parcelaId: string,
  paga: boolean
) {
  const { error } = await (supabase as any)
    .from("parcelas_cartao")
    .update({ paga })
    .eq("id", parcelaId);

  if (error) throw error;
}

/* ======================================================
   PAGAR FATURA INTEIRA
====================================================== */

export async function pagarFaturaDoMes(
  cartaoId: string,
  mesReferencia: Date
) {
  const ano = mesReferencia.getFullYear();
  const mes = mesReferencia.getMonth();

  const inicio = new Date(ano, mes, 1);
  const fim = new Date(ano, mes + 1, 1);

  const inicioStr = inicio.toISOString().slice(0, 10);
  const fimStr = fim.toISOString().slice(0, 10);

  const { data: compras, error: comprasError } = await (supabase as any)
    .from("compras_cartao")
    .select("id")
    .eq("cartao_id", cartaoId);

  if (comprasError) throw comprasError;

  const compraIds = (compras ?? []).map((c: any) => c.id);

  if (compraIds.length === 0) return;

  const { error } = await (supabase as any)
    .from("parcelas_cartao")
    .update({ paga: true })
    .in("compra_id", compraIds)
    .gte("mes_referencia", inicioStr)
    .lt("mes_referencia", fimStr)
    .eq("paga", false);

  if (error) throw error;
}
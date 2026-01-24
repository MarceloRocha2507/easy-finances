import { supabase } from "@/integrations/supabase/client";
import { AtualizarValorCompraSchema } from "@/lib/validations";
import { calcularMesFaturaCartao } from "@/lib/dateUtils";

/* ======================================================
   TIPOS
====================================================== */

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
};

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
  tipo_recorrencia?: string;
  ativo?: boolean;
};

/* ======================================================
   HELPERS
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

/* ======================================================
   LISTAR GASTOS DO CARTÃO
====================================================== */

export async function listarGastosDoCartao(
  cartaoId: string
): Promise<Transaction[]> {
  try {
    // 1. Buscar compras do cartão
    const { data: compras, error: comprasError } = await (supabase as any)
      .from("compras_cartao")
      .select("id, descricao")
      .eq("cartao_id", cartaoId);

    if (comprasError || !compras?.length) {
      return [];
    }

    const compraIds = compras.map((c: any) => c.id);
    const compraMap = Object.fromEntries(compras.map((c: any) => [c.id, c.descricao]));

    // 2. Buscar parcelas do mês atual
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

    const { data: parcelas, error: parcelasError } = await (supabase as any)
      .from("parcelas_cartao")
      .select("id, compra_id, valor, created_at")
      .in("compra_id", compraIds)
      .gte("mes_referencia", inicioMes.toISOString().slice(0, 10))
      .lt("mes_referencia", fimMes.toISOString().slice(0, 10));

    if (parcelasError) {
      console.log("Erro ao buscar parcelas:", parcelasError.message);
      return [];
    }

    return (parcelas ?? []).map((p: any) => ({
      id: p.id,
      description: compraMap[p.compra_id] || "Sem descrição",
      amount: Number(p.valor) || 0,
      created_at: p.created_at,
    }));
  } catch (err) {
    console.log("Erro ao listar gastos:", err);
    return [];
  }
}

/* ======================================================
   CALCULAR TOTAL GASTO DO CARTÃO NO MÊS
====================================================== */

export async function calcularTotalGastoCartao(cartaoId: string): Promise<number> {
  try {
    // 1. Buscar compras do cartão
    const { data: compras, error: comprasError } = await (supabase as any)
      .from("compras_cartao")
      .select("id")
      .eq("cartao_id", cartaoId);

    if (comprasError || !compras?.length) {
      return 0;
    }

    const compraIds = compras.map((c: any) => c.id);

    // 2. Buscar parcelas do mês atual
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

    const { data: parcelas, error: parcelasError } = await (supabase as any)
      .from("parcelas_cartao")
      .select("valor")
      .in("compra_id", compraIds)
      .gte("mes_referencia", inicioMes.toISOString().slice(0, 10))
      .lt("mes_referencia", fimMes.toISOString().slice(0, 10));

    if (parcelasError) {
      console.log("Erro ao calcular total:", parcelasError.message);
      return 0;
    }

    return (parcelas ?? []).reduce((sum: number, p: any) => sum + (Number(p.valor) || 0), 0);
  } catch (err) {
    console.log("Erro ao calcular total:", err);
    return 0;
  }
}

/* ======================================================
   CRIAR COMPRA NO CARTÃO (LEGADO)
====================================================== */

export async function criarCompraNoCartao(data: {
  description: string;
  amount: number;
  cartao_id: string;
}) {
  const { data: cartao } = await (supabase as any)
    .from("cartoes")
    .select("dia_fechamento")
    .eq("id", data.cartao_id)
    .single();

  await criarCompraParcelada({
    cartaoId: data.cartao_id,
    descricao: data.description,
    valorTotal: Math.abs(data.amount),
    parcelas: 1,
    diaFechamento: cartao?.dia_fechamento || 1,
  });
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
  // Obter usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Usuário não autenticado");

  const {
    cartaoId,
    descricao,
    valorTotal,
    parcelas,
    diaFechamento,
  } = data;

  // Criar compra COM user_id
  const { data: compraRaw, error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .insert({
      cartao_id: cartaoId,
      descricao,
      valor_total: valorTotal,
      parcelas,
      user_id: user.id,
    })
    .select("id, cartao_id, descricao, valor_total, parcelas")
    .single();

  if (compraError) throw compraError;
  if (!compraRaw?.id) throw new Error("Compra não retornou ID");

  // Usar função centralizada para calcular mês da fatura
  const primeiraFatura = calcularMesFaturaCartao(new Date(), diaFechamento);
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

  if (parcelasError && parcelasError.code !== "23505") throw parcelasError;
}

/* ======================================================
   LISTAR PARCELAS DA FATURA
====================================================== */

export async function listarParcelasDaFatura(
  cartaoId: string,
  mesReferencia: Date
): Promise<ParcelaFatura[]> {
  try {
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

    // 1. Buscar compras do cartão
    const { data: compras, error: comprasError } = await (supabase as any)
      .from("compras_cartao")
      .select("id, descricao")
      .eq("cartao_id", cartaoId);

    if (comprasError || !compras?.length) {
      return [];
    }

    const compraIds = compras.map((c: any) => c.id);
    const compraMap = Object.fromEntries(
      compras.map((c: any) => [c.id, { descricao: c.descricao }])
    );

    // 2. Buscar parcelas do mês (apenas ativas)
    const { data: parcelas, error: parcelasError } = await (supabase as any)
      .from("parcelas_cartao")
      .select("id, compra_id, valor, numero_parcela, total_parcelas, mes_referencia, paga, created_at, tipo_recorrencia, ativo")
      .in("compra_id", compraIds)
      .gte("mes_referencia", inicioStr)
      .lt("mes_referencia", fimStr)
      .eq("ativo", true)
      .order("numero_parcela", { ascending: true });

    if (parcelasError) {
      console.log("Erro ao buscar parcelas:", parcelasError.message);
      return [];
    }

    return (parcelas ?? []).map((r: any) => {
      const compra = compraMap[r.compra_id] || {};
      return {
        id: String(r.id),
        compra_id: String(r.compra_id),
        valor: Number(r.valor ?? 0),
        numero_parcela: Number(r.numero_parcela ?? 1),
        total_parcelas: Number(r.total_parcelas ?? 1),
        mes_referencia: String(r.mes_referencia ?? ""),
        paga: r.paga ?? false,
        created_at: r.created_at,
        descricao: compra.descricao ?? "Sem descrição",
        categoria_id: null,
        categoria_nome: null,
        categoria_cor: null,
        categoria_icone: null,
        tipo_recorrencia: r.tipo_recorrencia ?? "normal",
        ativo: r.ativo ?? true,
      };
    });
  } catch (err) {
    console.log("Erro ao listar parcelas:", err);
    return [];
  }
}

/* ======================================================
   BUSCAR COMPRA POR ID
====================================================== */

export async function buscarCompraPorId(compraId: string) {
  const { data, error } = await (supabase as any)
    .from("compras_cartao")
    .select("id, cartao_id, descricao, valor_total, parcelas, created_at")
    .eq("id", compraId)
    .single();

  if (error) throw error;
  return data;
}

/* ======================================================
   ATUALIZAR COMPRA
====================================================== */

export async function atualizarCompraCartao(
  compraId: string,
  dados: { descricao?: string }
): Promise<void> {
  const { error } = await (supabase as any)
    .from("compras_cartao")
    .update({ descricao: dados.descricao })
    .eq("id", compraId);

  if (error) throw error;
}

/* ======================================================
   ATUALIZAR VALOR DA COMPRA
====================================================== */

export async function atualizarValorCompra(
  compraId: string,
  novoValorTotal: number
): Promise<void> {
  // Validate input
  const validationResult = AtualizarValorCompraSchema.safeParse({
    compraId,
    novoValorTotal,
  });

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const { compraId: validCompraId, novoValorTotal: validValor } = validationResult.data;

  const { data: compra, error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .select("parcelas")
    .eq("id", validCompraId)
    .single();

  if (compraError) throw compraError;

  const numParcelas = compra.parcelas || 1;
  const novoValorParcela = Number((validValor / numParcelas).toFixed(2));

  const { error: updateCompraError } = await (supabase as any)
    .from("compras_cartao")
    .update({ valor_total: validValor })
    .eq("id", validCompraId);

  if (updateCompraError) throw updateCompraError;

  const { error: updateParcelasError } = await (supabase as any)
    .from("parcelas_cartao")
    .update({ valor: novoValorParcela })
    .eq("compra_id", validCompraId)
    .eq("paga", false);

  if (updateParcelasError) throw updateParcelasError;
}

/* ======================================================
   EXCLUIR COMPRA
====================================================== */

export async function excluirCompraCartao(compraId: string) {
  // Primeiro excluir as parcelas
  await (supabase as any)
    .from("parcelas_cartao")
    .delete()
    .eq("compra_id", compraId);

  // Depois excluir a compra
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

/* ======================================================
   LEGADO - TRANSACTIONS
====================================================== */

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
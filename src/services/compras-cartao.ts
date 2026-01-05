import { supabase } from "@/integrations/supabase/client";

/* ======================================================
   TIPOS
====================================================== */

export type ParcelaFatura = {
  id: string;
  compra_id: string;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  mes_referencia: string;
  paga: boolean;
  descricao: string;
  data_compra: string;

  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  responsavel_apelido?: string | null;

  categoria_id?: string | null;
  categoria_nome?: string | null;
  categoria_cor?: string | null;
  categoria_icone?: string | null;
};

export type CompraCartaoInput = {
  cartaoId: string;
  descricao: string;
  valorTotal: number;
  parcelas: number;
  parcelaInicial: number;
  mesFatura: Date;
  tipoLancamento: "unica" | "parcelada" | "fixa";
  dataCompra: Date;
  categoriaId?: string;
  responsavelId: string;
};

export type ResumoResponsavel = {
  responsavel_id: string;
  responsavel_nome: string;
  responsavel_apelido: string | null;
  is_titular: boolean;
  total: number;
  qtd_compras: number;
  percentual: number;
};

/* ======================================================
   CRIAR COMPRA
====================================================== */

export async function criarCompraCartao(input: CompraCartaoInput): Promise<void> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Usuário não autenticado");

  const { data: compra, error } = await supabase
    .from("compras_cartao")
    .insert({
      user_id: data.user.id,
      cartao_id: input.cartaoId,
      descricao: input.descricao,
      valor_total: input.valorTotal,
      parcelas: input.parcelas,
      parcela_inicial: input.parcelaInicial,
      tipo_lancamento: input.tipoLancamento,
      mes_inicio: input.mesFatura.toISOString().split("T")[0],
      data_compra: input.dataCompra.toISOString().split("T")[0],
      categoria_id: input.categoriaId ?? null,
      responsavel_id: input.responsavelId,
    })
    .select("id")
    .single();

  if (error || !compra) throw error;

  const valorParcela = input.valorTotal / input.parcelas;
  const parcelasCriar = [];

  for (let i = input.parcelaInicial; i <= input.parcelas; i++) {
    const mesRef = new Date(input.mesFatura.getFullYear(), input.mesFatura.getMonth() + (i - input.parcelaInicial), 1);

    parcelasCriar.push({
      compra_id: compra.id,
      numero_parcela: i,
      total_parcelas: input.parcelas,
      valor: valorParcela,
      mes_referencia: mesRef.toISOString().split("T")[0],
      paga: false,
      tipo_recorrencia: input.tipoLancamento === "fixa" ? "fixa" : "normal",
    });
  }

  const { error: parcelasError } = await supabase.from("parcelas_cartao").insert(parcelasCriar);

  if (parcelasError) throw parcelasError;
}

/* ======================================================
   LISTAR PARCELAS DA FATURA
====================================================== */

export async function listarParcelasDaFatura(cartaoId: string, mesReferencia: Date): Promise<ParcelaFatura[]> {
  const mesStr = `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: parcelas, error } = await supabase
    .from("parcelas_cartao")
    .select(
      `
      id,
      compra_id,
      numero_parcela,
      valor,
      mes_referencia,
      paga,
      compra:compras_cartao (
        descricao,
        parcelas,
        data_compra,
        categoria:categories(id, name, color, icon),
        responsavel:responsaveis(id, nome, apelido)
      )
    `,
    )
    .eq("mes_referencia", mesStr);

  if (error || !parcelas) return [];

  const { data: compras } = await supabase.from("compras_cartao").select("id").eq("cartao_id", cartaoId);

  const ids = new Set((compras || []).map((c) => c.id));

  return parcelas
    .filter((p: any) => ids.has(p.compra_id))
    .map((p: any) => ({
      id: p.id,
      compra_id: p.compra_id,
      numero_parcela: p.numero_parcela,
      total_parcelas: p.compra?.parcelas ?? 1,
      valor: p.valor,
      mes_referencia: p.mes_referencia,
      paga: p.paga,
      descricao: p.compra?.descricao ?? "",
      data_compra: p.compra?.data_compra ?? "",

      responsavel_id: p.compra?.responsavel?.id ?? null,
      responsavel_nome: p.compra?.responsavel?.nome ?? null,
      responsavel_apelido: p.compra?.responsavel?.apelido ?? null,

      categoria_id: p.compra?.categoria?.id ?? null,
      categoria_nome: p.compra?.categoria?.name ?? null,
      categoria_cor: p.compra?.categoria?.color ?? null,
      categoria_icone: p.compra?.categoria?.icon ?? null,
    }));
}

/* ======================================================
   EDITAR COMPRA (VERSÃO FINAL SEGURA)
====================================================== */

export async function editarCompra(
  compraId: string,
  dados: {
    descricao?: string;
    valorTotal?: number;
    parcelas?: number;
    categoriaId?: string;
    responsavelId?: string;
    mesFatura?: Date;
    parcelaInicial?: number;
  },
): Promise<void> {
  const { data: compra, error } = await supabase
    .from("compras_cartao")
    .select("parcelas, valor_total, parcela_inicial, mes_inicio")
    .eq("id", compraId)
    .single();

  if (error || !compra) throw new Error("Compra não encontrada");

  const totalParcelas = dados.parcelas ?? compra.parcelas;
  const parcelaInicial = dados.parcelaInicial ?? compra.parcela_inicial;
  const valorTotal = dados.valorTotal ?? compra.valor_total;
  const mesInicio = dados.mesFatura ?? new Date(compra.mes_inicio);

  await supabase
    .from("compras_cartao")
    .update({
      descricao: dados.descricao,
      valor_total: valorTotal,
      parcelas: totalParcelas,
      parcela_inicial: parcelaInicial,
      mes_inicio: mesInicio.toISOString().split("T")[0],
      categoria_id: dados.categoriaId ?? null,
      responsavel_id: dados.responsavelId ?? null,
    })
    .eq("id", compraId);

  const { data: parcelasNaoPagas } = await supabase
    .from("parcelas_cartao")
    .select("id, numero_parcela")
    .eq("compra_id", compraId)
    .eq("paga", false);

  if (!parcelasNaoPagas || parcelasNaoPagas.length === 0) return;

  const valorParcela = Number((valorTotal / totalParcelas).toFixed(2));

  const updates = parcelasNaoPagas.map((p: any) => {
    const offset = p.numero_parcela - parcelaInicial;
    const mesRef = new Date(mesInicio.getFullYear(), mesInicio.getMonth() + offset, 1);

    return {
      id: p.id,
      valor: valorParcela,
      total_parcelas: totalParcelas,
      mes_referencia: mesRef.toISOString().split("T")[0],
    };
  });

  const { error: parcelasError } = await supabase.from("parcelas_cartao").upsert(updates);

  if (parcelasError) throw parcelasError;
}

/* ======================================================
   EXCLUIR COMPRA
====================================================== */

export async function excluirCompra(compraId: string): Promise<void> {
  await supabase.from("parcelas_cartao").delete().eq("compra_id", compraId);
  await supabase.from("compras_cartao").delete().eq("id", compraId);
}

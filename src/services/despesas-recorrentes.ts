import { supabase } from "@/integrations/supabase/client";
import { addDays, addMonths, addWeeks, addYears, format, isAfter, parseISO, startOfDay } from "date-fns";
import { calcularMesFaturaCartao, formatarDataISO } from "@/lib/dateUtils";

/* ================================================================
   TIPOS
================================================================ */

export type FrequenciaRecorrencia =
  | "diaria"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "bimestral"
  | "trimestral"
  | "semestral"
  | "anual";

export type MetodoPagamentoRecorrencia =
  | "dinheiro"
  | "pix"
  | "debito"
  | "conta"
  | "cartao_credito";

export interface DespesaRecorrente {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  valor: number;
  moeda: string;
  category_id: string | null;
  subcategoria_id: string | null;
  frequencia: FrequenciaRecorrencia;
  intervalo: number;
  data_inicio: string;
  data_fim: string | null;
  metodo_pagamento: MetodoPagamentoRecorrencia;
  banco_id: string | null;
  cartao_id: string | null;
  responsavel_id: string | null;
  status: "ativa" | "pausada" | "cancelada";
  dia_lembrete: number | null;
  observacoes: string | null;
  link_cancelamento: string | null;
  vinculo_automatico: boolean;
  horizonte_geracao_meses: number;
  origem_migracao: "manual" | "assinatura" | "transaction_recorrente";
  ultima_geracao_ate: string | null;
  created_at: string;
  updated_at: string;
}

export type DespesaRecorrenteInput = Omit<
  DespesaRecorrente,
  "id" | "user_id" | "created_at" | "updated_at" | "ultima_geracao_ate" | "origem_migracao"
> & { origem_migracao?: DespesaRecorrente["origem_migracao"] };

/* ================================================================
   CÁLCULO DE DATAS
================================================================ */

export function proximaDataOcorrencia(
  atual: Date,
  frequencia: FrequenciaRecorrencia,
  intervalo: number
): Date {
  const n = Math.max(1, intervalo || 1);
  switch (frequencia) {
    case "diaria":
      return addDays(atual, n);
    case "semanal":
      return addWeeks(atual, n);
    case "quinzenal":
      return addDays(atual, 15 * n);
    case "mensal":
      return addMonths(atual, n);
    case "bimestral":
      return addMonths(atual, 2 * n);
    case "trimestral":
      return addMonths(atual, 3 * n);
    case "semestral":
      return addMonths(atual, 6 * n);
    case "anual":
      return addYears(atual, n);
    default:
      return addMonths(atual, n);
  }
}

export function calcularDatasOcorrencias(
  dataInicio: Date,
  dataFim: Date | null,
  ate: Date,
  frequencia: FrequenciaRecorrencia,
  intervalo: number
): Date[] {
  const limite = dataFim && dataFim < ate ? dataFim : ate;
  const datas: Date[] = [];
  let cursor = startOfDay(dataInicio);
  let guard = 0;
  while (cursor <= limite && guard < 500) {
    datas.push(cursor);
    cursor = proximaDataOcorrencia(cursor, frequencia, intervalo);
    guard++;
  }
  return datas;
}

/* ================================================================
   HELPERS
================================================================ */

async function getOrCreateFaturaCategoryId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "Fatura do Cartão")
    .maybeSingle();
  if (data?.id) return data.id;

  const { data: created } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: "Fatura do Cartão",
      icon: "credit-card",
      color: "#8b5cf6",
      type: "expense",
      is_default: true,
    })
    .select("id")
    .single();
  return created?.id ?? null;
}

async function getCartaoFechamento(cartaoId: string): Promise<number> {
  const { data } = await supabase
    .from("cartoes")
    .select("dia_fechamento")
    .eq("id", cartaoId)
    .maybeSingle();
  return (data as any)?.dia_fechamento ?? 1;
}

/* ================================================================
   GERAÇÃO DE OCORRÊNCIAS
================================================================ */

/**
 * Gera ocorrências (transactions ou compras_cartao) para uma recorrência
 * dentro da janela [data_inicio, ate]. Idempotente: pula datas onde já existe
 * ocorrência com a mesma recorrencia_id.
 */
export async function gerarOcorrenciasParaRecorrencia(
  recorrencia: DespesaRecorrente,
  ate: Date
): Promise<{ criadas: number }> {
  if (recorrencia.status !== "ativa") return { criadas: 0 };

  const dataInicio = parseISO(recorrencia.data_inicio);
  const dataFim = recorrencia.data_fim ? parseISO(recorrencia.data_fim) : null;
  const datas = calcularDatasOcorrencias(
    dataInicio,
    dataFim,
    ate,
    recorrencia.frequencia,
    recorrencia.intervalo
  );

  if (datas.length === 0) return { criadas: 0 };

  const isCartao = recorrencia.metodo_pagamento === "cartao_credito" && !!recorrencia.cartao_id;

  // Buscar ocorrências já existentes para essa recorrência (para idempotência)
  if (isCartao) {
    const { data: existentes } = await supabase
      .from("compras_cartao")
      .select("data_compra")
      .eq("recorrencia_id", recorrencia.id);
    const jaTem = new Set(((existentes || []) as any[]).map((c) => c.data_compra));

    const diaFechamento = await getCartaoFechamento(recorrencia.cartao_id!);
    const faturaCategoryId = await getOrCreateFaturaCategoryId(recorrencia.user_id);

    let criadas = 0;
    for (const data of datas) {
      const dataISO = formatarDataISO(data);
      if (jaTem.has(dataISO)) continue;

      const mesFatura = calcularMesFaturaCartao(data, diaFechamento);
      const { data: compra, error } = await (supabase as any)
        .from("compras_cartao")
        .insert({
          user_id: recorrencia.user_id,
          cartao_id: recorrencia.cartao_id,
          descricao: recorrencia.nome,
          valor_total: recorrencia.valor,
          parcelas: 1,
          parcela_inicial: 1,
          tipo_lancamento: "unica",
          mes_inicio: formatarDataISO(mesFatura),
          data_compra: dataISO,
          categoria_id: faturaCategoryId,
          subcategoria_id: recorrencia.subcategoria_id || recorrencia.category_id || null,
          responsavel_id: recorrencia.responsavel_id,
          nome_fatura: recorrencia.nome,
          observacao: recorrencia.observacoes,
          recorrencia_id: recorrencia.id,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Erro criando compra recorrente:", error);
        continue;
      }

      await (supabase as any).from("parcelas_cartao").insert({
        compra_id: compra.id,
        numero_parcela: 1,
        total_parcelas: 1,
        valor: recorrencia.valor,
        mes_referencia: formatarDataISO(mesFatura),
        paga: false,
        tipo_recorrencia: "normal",
      });

      criadas++;
    }

    await supabase
      .from("despesas_recorrentes")
      .update({ ultima_geracao_ate: formatarDataISO(ate) })
      .eq("id", recorrencia.id);

    return { criadas };
  }

  // Caminho não-cartão: cria transactions
  const { data: existentes } = await supabase
    .from("transactions")
    .select("due_date,date")
    .eq("recorrencia_id", recorrencia.id)
    .is("deleted_at", null);
  const jaTem = new Set(
    ((existentes || []) as any[]).map((t) => t.due_date || t.date)
  );

  const rows: any[] = [];
  for (const data of datas) {
    const dataISO = formatarDataISO(data);
    if (jaTem.has(dataISO)) continue;
    rows.push({
      user_id: recorrencia.user_id,
      type: "expense",
      status: "pending",
      amount: recorrencia.valor,
      description: recorrencia.nome,
      category_id: recorrencia.category_id,
      date: dataISO,
      due_date: dataISO,
      banco_id: recorrencia.banco_id,
      tipo_lancamento: "recorrente",
      recorrencia_id: recorrencia.id,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("transactions").insert(rows);
    if (error) throw error;
  }

  await supabase
    .from("despesas_recorrentes")
    .update({ ultima_geracao_ate: formatarDataISO(ate) })
    .eq("id", recorrencia.id);

  return { criadas: rows.length };
}

/**
 * Remove ocorrências futuras não pagas (>= hoje) vinculadas à recorrência.
 * Usado ao editar/pausar/cancelar/excluir a recorrência.
 */
export async function removerOcorrenciasFuturasPendentes(
  recorrencia: Pick<DespesaRecorrente, "id" | "metodo_pagamento">
): Promise<void> {
  const hojeISO = formatarDataISO(new Date());

  if (recorrencia.metodo_pagamento === "cartao_credito") {
    // Buscar compras futuras (data_compra >= hoje) desta recorrência
    const { data: compras } = await supabase
      .from("compras_cartao")
      .select("id")
      .eq("recorrencia_id", recorrencia.id)
      .gte("data_compra", hojeISO);
    const ids = ((compras || []) as any[]).map((c) => c.id);
    if (ids.length === 0) return;

    // Só remover se nenhuma parcela estiver paga
    const { data: parcelasPagas } = await supabase
      .from("parcelas_cartao")
      .select("compra_id")
      .in("compra_id", ids)
      .eq("paga", true);
    const naoRemover = new Set(((parcelasPagas || []) as any[]).map((p) => p.compra_id));
    const removiveis = ids.filter((id) => !naoRemover.has(id));
    if (removiveis.length === 0) return;

    await supabase.from("parcelas_cartao").delete().in("compra_id", removiveis);
    await supabase.from("compras_cartao").delete().in("id", removiveis);
    return;
  }

  // Transactions: remover pendentes com due_date/date >= hoje
  await supabase
    .from("transactions")
    .delete()
    .eq("recorrencia_id", recorrencia.id)
    .eq("status", "pending")
    .gte("date", hojeISO);
}

/**
 * Regenera ocorrências futuras: primeiro apaga as pendentes futuras, depois
 * gera novamente com o modelo atual. Preserva o histórico já pago.
 */
export async function regenerarFuturasComNovoModelo(
  recorrencia: DespesaRecorrente
): Promise<void> {
  await removerOcorrenciasFuturasPendentes(recorrencia);
  const horizonte = addMonths(new Date(), recorrencia.horizonte_geracao_meses || 12);
  await gerarOcorrenciasParaRecorrencia(recorrencia, horizonte);
}

/**
 * Estende o horizonte de geração se necessário. Chamado periodicamente pelo hook.
 */
export async function estenderHorizonteSeNecessario(
  recorrencia: DespesaRecorrente
): Promise<void> {
  if (recorrencia.status !== "ativa") return;
  const hoje = new Date();
  const horizonte = addMonths(hoje, recorrencia.horizonte_geracao_meses || 12);
  const ultima = recorrencia.ultima_geracao_ate
    ? parseISO(recorrencia.ultima_geracao_ate)
    : null;
  // Se já geramos além de "hoje + horizonte - 1 mês", não precisa estender
  const marco = addMonths(horizonte, -1);
  if (ultima && isAfter(ultima, marco)) return;
  await gerarOcorrenciasParaRecorrencia(recorrencia, horizonte);
}

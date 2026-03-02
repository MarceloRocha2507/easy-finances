import { supabase } from "@/integrations/supabase/client";

const TOLERANCIA_VALOR = 0.50;

const mesesPorFrequencia: Record<string, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

/** Remove acentos e lowercase */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export interface CorrespondenciaAssinatura {
  assinaturaId: string;
  assinaturaNome: string;
  valorAssinatura: number;
  valorCompra: number;
  exata: boolean; // true = valor dentro da tolerância
}

/**
 * Verifica se uma compra de cartão corresponde a alguma assinatura ativa.
 * Retorna lista de correspondências encontradas (pode ser 0, 1 ou mais).
 */
export async function verificarCorrespondencia(
  descricao: string,
  valor: number,
  mesReferencia: string, // "YYYY-MM" do mês da fatura
  userId: string
): Promise<CorrespondenciaAssinatura[]> {
  // Buscar assinaturas ativas do usuário
  const { data: assinaturas, error } = await (supabase as any)
    .from("assinaturas")
    .select("id, nome, valor, proxima_cobranca, frequencia, compra_cartao_id")
    .eq("user_id", userId)
    .eq("status", "ativa")
    .is("compra_cartao_id", null); // Apenas não vinculadas

  if (error || !assinaturas) return [];

  const descNorm = normalizar(descricao);
  const [anoRef, mesRef] = mesReferencia.split("-").map(Number);

  const correspondencias: CorrespondenciaAssinatura[] = [];

  for (const a of assinaturas as any[]) {
    const nomeNorm = normalizar(a.nome);

    // 1. Verificar se descrição contém o nome da assinatura
    if (!descNorm.includes(nomeNorm) && !nomeNorm.includes(descNorm)) continue;

    // 2. Verificar período (mês/ano da proxima_cobranca bate com mesReferencia)
    const [anoCobranca, mesCobranca] = (a.proxima_cobranca as string).split("-").map(Number);
    if (anoCobranca !== anoRef || mesCobranca !== mesRef) continue;

    // 3. Verificar valor
    const diff = Math.abs(Number(a.valor) - valor);
    const exata = diff <= TOLERANCIA_VALOR;

    correspondencias.push({
      assinaturaId: a.id,
      assinaturaNome: a.nome,
      valorAssinatura: Number(a.valor),
      valorCompra: valor,
      exata,
    });
  }

  return correspondencias;
}

/**
 * Vincula uma assinatura a uma compra de cartão e avança a próxima cobrança.
 */
export async function vincularAssinatura(
  assinaturaId: string,
  compraCartaoId: string,
  cartaoId: string,
  dataPagamento: string, // "YYYY-MM-DD"
  valorCobrado: number,
  frequencia: string
): Promise<void> {
  // Buscar proxima_cobranca atual
  const { data: assinatura } = await (supabase as any)
    .from("assinaturas")
    .select("proxima_cobranca")
    .eq("id", assinaturaId)
    .single();

  if (!assinatura) return;

  // Calcular próxima cobrança
  const meses = mesesPorFrequencia[frequencia] || 1;
  const novaData = new Date((assinatura as any).proxima_cobranca + "T12:00:00");
  novaData.setMonth(novaData.getMonth() + meses);
  const novaCobranca = novaData.toISOString().split("T")[0];

  const { error } = await (supabase as any)
    .from("assinaturas")
    .update({
      compra_cartao_id: compraCartaoId,
      cartao_id_pagamento: cartaoId,
      data_pagamento: dataPagamento,
      valor_cobrado: valorCobrado,
      vinculo_automatico: true,
      proxima_cobranca: novaCobranca,
    })
    .eq("id", assinaturaId);

  if (error) throw error;
}

/**
 * Após criar uma compra de cartão, tenta vincular automaticamente a uma assinatura.
 * Retorna a correspondência vinculada (se houver match exato), ou null.
 */
export async function tentarVincularAutomaticamente(
  compraId: string,
  cartaoId: string,
  descricao: string,
  valorParcela: number,
  dataCompra: string, // "YYYY-MM-DD"
  mesReferencia: string, // "YYYY-MM"
  userId: string
): Promise<CorrespondenciaAssinatura | null> {
  const correspondencias = await verificarCorrespondencia(
    descricao,
    valorParcela,
    mesReferencia,
    userId
  );

  // Apenas vincular automaticamente se houver exatamente 1 match exato
  const exatas = correspondencias.filter((c) => c.exata);
  if (exatas.length !== 1) return null;

  const match = exatas[0];

  // Buscar frequência da assinatura
  const { data: assinatura } = await (supabase as any)
    .from("assinaturas")
    .select("frequencia")
    .eq("id", match.assinaturaId)
    .single();

  if (!assinatura) return null;

  await vincularAssinatura(
    match.assinaturaId,
    compraId,
    cartaoId,
    dataCompra,
    match.valorCompra,
    (assinatura as any).frequencia
  );

  return match;
}

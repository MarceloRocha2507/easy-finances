import { supabase } from "@/integrations/supabase/client";
import { 
  calcularMesReferenciaParcela, 
  formatarDataISO 
} from "@/lib/dateUtils";

export type TipoLancamento = "unica" | "parcelada" | "fixa";

export interface CriarCompraParams {
  cartaoId: string;
  descricao: string;
  valorTotal: number;
  tipoLancamento: TipoLancamento;
  mesInicio: Date;
  parcelas?: number;
  parcelaInicial?: number;
  categoriaId?: string;
  mesesFuturos?: number;
}

interface CompraInsert {
  cartao_id: string;
  descricao: string;
  valor_total: number;
  parcelas: number;
  user_id: string;
  tipo_lancamento: string;
  mes_inicio: string;
  parcela_inicial: number;
  ativo: boolean;
  categoria_id?: string;
}

interface ParcelaInsert {
  compra_id: string;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  mes_referencia: string;
  paga: boolean;
  tipo_recorrencia: string;
  ativo: boolean;
}

/**
 * Cria uma nova compra no cartão com suas respectivas parcelas
 */
export async function criarCompra(params: CriarCompraParams): Promise<void> {
  const {
    cartaoId,
    descricao,
    valorTotal,
    tipoLancamento,
    mesInicio,
    parcelas = 1,
    parcelaInicial = 1,
    categoriaId,
    mesesFuturos = 12,
  } = params;

  // Validações
  if (!descricao.trim()) {
    throw new Error("Descrição é obrigatória");
  }

  if (valorTotal <= 0) {
    throw new Error("Valor deve ser maior que zero");
  }

  if (tipoLancamento === "parcelada" && parcelas < 2) {
    throw new Error("Compra parcelada deve ter pelo menos 2 parcelas");
  }

  if (parcelaInicial < 1 || parcelaInicial > parcelas) {
    throw new Error("Parcela inicial inválida");
  }

  // Obtém o usuário atual
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Usuário não autenticado");
  }
  const userId = userData.user.id;

  // Determina quantidade de parcelas baseado no tipo
  let totalParcelas: number;
  let parcelasACriar: number;
  let tipoRecorrencia: string;

  switch (tipoLancamento) {
    case "unica":
      totalParcelas = 1;
      parcelasACriar = 1;
      tipoRecorrencia = "normal";
      break;
    case "parcelada":
      totalParcelas = parcelas;
      parcelasACriar = parcelas - parcelaInicial + 1;
      tipoRecorrencia = "normal";
      break;
    case "fixa":
      totalParcelas = mesesFuturos;
      parcelasACriar = mesesFuturos;
      tipoRecorrencia = "fixa";
      break;
    default:
      throw new Error("Tipo de lançamento inválido");
  }

  // Calcula valor por parcela
  const valorParcela = Number((valorTotal / totalParcelas).toFixed(2));

  // Monta objeto da compra
  const compraData: CompraInsert = {
    cartao_id: cartaoId,
    descricao: descricao.trim(),
    valor_total: valorTotal,
    parcelas: totalParcelas,
    user_id: userId,
    tipo_lancamento: tipoLancamento,
    mes_inicio: formatarDataISO(mesInicio),
    parcela_inicial: parcelaInicial,
    ativo: true,
  };

  if (categoriaId) {
    compraData.categoria_id = categoriaId;
  }

  // Insere a compra
  const { data: compra, error: compraError } = await supabase
    .from("compras_cartao")
    .insert(compraData)
    .select("id")
    .single();

  if (compraError) {
    console.error("Erro ao criar compra:", compraError);
    throw new Error("Não foi possível registrar a compra");
  }

  // Gera as parcelas
  const parcelasData: ParcelaInsert[] = [];

  if (tipoLancamento === "unica") {
    // Compra única - apenas 1 parcela
    parcelasData.push({
      compra_id: compra.id,
      numero_parcela: 1,
      total_parcelas: 1,
      valor: valorTotal,
      mes_referencia: formatarDataISO(mesInicio),
      paga: false,
      tipo_recorrencia: "normal",
      ativo: true,
    });
  } else if (tipoLancamento === "parcelada") {
    // Compra parcelada - cria parcelas a partir da parcela inicial
    for (let i = parcelaInicial; i <= totalParcelas; i++) {
      const mesReferencia = calcularMesReferenciaParcela(mesInicio, i, parcelaInicial);
      parcelasData.push({
        compra_id: compra.id,
        numero_parcela: i,
        total_parcelas: totalParcelas,
        valor: valorParcela,
        mes_referencia: formatarDataISO(mesReferencia),
        paga: false,
        tipo_recorrencia: "normal",
        ativo: true,
      });
    }
  } else if (tipoLancamento === "fixa") {
    // Despesa fixa - cria parcelas para os próximos N meses
    for (let i = 1; i <= mesesFuturos; i++) {
      const mesReferencia = calcularMesReferenciaParcela(mesInicio, i, 1);
      parcelasData.push({
        compra_id: compra.id,
        numero_parcela: i,
        total_parcelas: mesesFuturos,
        valor: valorTotal, // Fixa mensal usa o valor total por mês
        mes_referencia: formatarDataISO(mesReferencia),
        paga: false,
        tipo_recorrencia: "fixa",
        ativo: true,
      });
    }
  }

  // Insere as parcelas
  const { error: parcelasError } = await supabase
    .from("parcelas_cartao")
    .insert(parcelasData);

  if (parcelasError) {
    console.error("Erro ao criar parcelas:", parcelasError);
    // Remove a compra em caso de erro nas parcelas
    await supabase.from("compras_cartao").delete().eq("id", compra.id);
    throw new Error("Não foi possível registrar as parcelas");
  }
}

/**
 * Encerra uma despesa fixa, removendo parcelas futuras não pagas
 */
export async function encerrarDespesaFixa(compraId: string): Promise<void> {
  // Marca a compra como inativa
  const { error: compraError } = await supabase
    .from("compras_cartao")
    .update({ ativo: false })
    .eq("id", compraId);

  if (compraError) {
    throw new Error("Não foi possível encerrar a despesa fixa");
  }

  // Remove parcelas futuras não pagas
  const hoje = formatarDataISO(new Date());
  const { error: parcelasError } = await supabase
    .from("parcelas_cartao")
    .update({ ativo: false })
    .eq("compra_id", compraId)
    .eq("paga", false)
    .gte("mes_referencia", hoje);

  if (parcelasError) {
    console.error("Erro ao desativar parcelas:", parcelasError);
  }
}

/**
 * Gera mais parcelas para despesas fixas ativas
 * Útil para expandir o horizonte de planejamento
 */
export async function gerarProximasParcelasFixas(
  compraId: string,
  mesesAdicionais: number = 6
): Promise<void> {
  // Busca a compra
  const { data: compra, error: compraError } = await supabase
    .from("compras_cartao")
    .select("*")
    .eq("id", compraId)
    .eq("tipo_lancamento", "fixa")
    .eq("ativo", true)
    .single();

  if (compraError || !compra) {
    throw new Error("Compra fixa não encontrada");
  }

  // Busca a última parcela
  const { data: ultimaParcela, error: parcelaError } = await supabase
    .from("parcelas_cartao")
    .select("numero_parcela, mes_referencia")
    .eq("compra_id", compraId)
    .eq("ativo", true)
    .order("numero_parcela", { ascending: false })
    .limit(1)
    .single();

  if (parcelaError) {
    throw new Error("Erro ao buscar parcelas");
  }

  const ultimoNumero = ultimaParcela?.numero_parcela || 0;
  const ultimoMes = ultimaParcela?.mes_referencia 
    ? new Date(ultimaParcela.mes_referencia) 
    : new Date(compra.mes_inicio);

  // Gera novas parcelas
  const novasParcelas: ParcelaInsert[] = [];
  for (let i = 1; i <= mesesAdicionais; i++) {
    const mesReferencia = calcularMesReferenciaParcela(ultimoMes, i + 1, 1);
    novasParcelas.push({
      compra_id: compraId,
      numero_parcela: ultimoNumero + i,
      total_parcelas: ultimoNumero + mesesAdicionais,
      valor: Number(compra.valor_total),
      mes_referencia: formatarDataISO(mesReferencia),
      paga: false,
      tipo_recorrencia: "fixa",
      ativo: true,
    });
  }

  const { error: insertError } = await supabase
    .from("parcelas_cartao")
    .insert(novasParcelas);

  if (insertError) {
    throw new Error("Erro ao gerar novas parcelas");
  }

  // Atualiza total de parcelas na compra
  await supabase
    .from("compras_cartao")
    .update({ parcelas: ultimoNumero + mesesAdicionais })
    .eq("id", compraId);
}

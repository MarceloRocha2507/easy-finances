import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ======================================================
   TIPOS
====================================================== */

export type Cartao = {
  id: string;
  nome: string;
  bandeira: string | null;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  cor: string;
  banco_id: string | null;
  user_id?: string;
  created_at?: string;
};

export type CartaoComResumo = Cartao & {
  // Limite comprometido = todas as parcelas não pagas
  limiteUsado: number;
  limiteDisponivel: number;
  percentualUsado: number;
  // Fatura do mês = apenas parcelas do mês selecionado
  faturaAtual: number;
  // Compatibilidade com código antigo
  faturaDoMes?: number;
  // Lógica para exibir próxima fatura quando atual está paga
  faturaAtualPaga: boolean;
  proximaFatura: number;
  mesExibicao: Date;
  faturaExibida: number;
};

/* ======================================================
   FUNÇÕES DE SERVIÇO
====================================================== */

/**
 * Listar cartões
 */
export async function listarCartoes(): Promise<Cartao[]> {
  const { data, error } = await (supabase as any)
    .from("cartoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Cartao[];
}

/**
 * Calcula o mês da fatura ativa baseado no dia de fechamento do cartão.
 * Se hoje >= dia_fechamento, a fatura ativa é do mês atual.
 * Se hoje < dia_fechamento, a fatura ativa é do mês anterior.
 */
function calcularMesFaturaAtiva(diaFechamento: number, hoje: Date = new Date()): Date {
  const diaAtual = hoje.getDate();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  if (diaAtual >= diaFechamento) {
    // Já passou o fechamento, fatura ativa é do mês atual
    return new Date(anoAtual, mesAtual, 1);
  } else {
    // Ainda não fechou, fatura ativa é do mês anterior
    return new Date(anoAtual, mesAtual - 1, 1);
  }
}

/**
 * Buscar cartões com resumo de limite e fatura
 */
export async function listarCartoesComResumo(
  mesReferencia?: Date
): Promise<CartaoComResumo[]> {
  const hoje = new Date();
  
  // 1. Buscar cartões
  const { data: cartoes, error: cartoesError } = await (supabase as any)
    .from("cartoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (cartoesError) throw cartoesError;
  if (!cartoes || cartoes.length === 0) return [];

  const cartaoIds = (cartoes as Cartao[]).map((c) => c.id);

  // 2. Buscar o responsável titular (EU)
  const { data: titularData } = await (supabase as any)
    .from("responsaveis")
    .select("id")
    .eq("is_titular", true)
    .single();

  const titularId = titularData?.id || null;

  // 3. Buscar TODAS as compras dos cartões
  const { data: compras, error: comprasError } = await (supabase as any)
    .from("compras_cartao")
    .select("id, cartao_id, valor_total, responsavel_id")
    .in("cartao_id", cartaoIds);

  if (comprasError) {
    console.error("Erro ao buscar compras:", comprasError);
  }

  const compraIds = (compras || []).map((c: any) => c.id);

  // 4. Buscar TODAS as parcelas (para calcular limite e faturas por mês)
  let todasParcelas: any[] = [];
  if (compraIds.length > 0) {
    const { data: parcelas, error: parcelasError } = await (supabase as any)
      .from("parcelas_cartao")
      .select("id, compra_id, valor, paga, mes_referencia")
      .in("compra_id", compraIds);

    if (parcelasError) {
      console.error("Erro ao buscar parcelas:", parcelasError);
    }
    todasParcelas = parcelas || [];
  }

  // 5. Criar mapa de compra -> cartão e compra -> responsável
  const compraCartaoMap: Record<string, string> = {};
  const compraResponsavelMap: Record<string, string | null> = {};
  (compras || []).forEach((c: any) => {
    compraCartaoMap[c.id] = c.cartao_id;
    compraResponsavelMap[c.id] = c.responsavel_id;
  });

  // 6. Processar cada cartão individualmente (cada um tem seu dia de fechamento)
  return (cartoes as Cartao[]).map((cartao) => {
    // Usar mesReferencia se fornecido, senão calcular baseado no fechamento
    const mesFaturaAtiva = mesReferencia 
      ? new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1)
      : calcularMesFaturaAtiva(cartao.dia_fechamento, hoje);
    
    const mesProximo = new Date(mesFaturaAtiva.getFullYear(), mesFaturaAtiva.getMonth() + 1, 1);

    // Filtrar parcelas deste cartão
    const parcelasDoCartao = todasParcelas.filter(
      (p: any) => compraCartaoMap[p.compra_id] === cartao.id
    );

    // Calcular limite usado (todas as parcelas não pagas)
    const limiteUsado = parcelasDoCartao
      .filter((p: any) => !p.paga)
      .reduce((sum: number, p: any) => sum + (Number(p.valor) || 0), 0);

    // Filtrar parcelas do mês da fatura ativa
    const inicioMesStr = `${mesFaturaAtiva.getFullYear()}-${String(mesFaturaAtiva.getMonth() + 1).padStart(2, "0")}`;
    const parcelasDoMes = parcelasDoCartao.filter((p: any) => {
      const [ano, mes] = p.mes_referencia.split("-").map(Number);
      return ano === mesFaturaAtiva.getFullYear() && mes === mesFaturaAtiva.getMonth() + 1;
    });

    // Filtrar parcelas do próximo mês
    const parcelasProximoMes = parcelasDoCartao.filter((p: any) => {
      const [ano, mes] = p.mes_referencia.split("-").map(Number);
      return ano === mesProximo.getFullYear() && mes === mesProximo.getMonth() + 1;
    });

    // Calcular totais do mês ativo
    const faturaAtual = parcelasDoMes.reduce(
      (sum: number, p: any) => sum + (Number(p.valor) || 0), 0
    );
    
    const faturaNaoPaga = parcelasDoMes
      .filter((p: any) => !p.paga)
      .reduce((sum: number, p: any) => sum + (Number(p.valor) || 0), 0);

    const faturaTitular = parcelasDoMes
      .filter((p: any) => {
        const respId = compraResponsavelMap[p.compra_id];
        return respId === titularId || respId === null;
      })
      .reduce((sum: number, p: any) => sum + (Number(p.valor) || 0), 0);

    // Calcular totais do próximo mês
    const proximaFatura = parcelasProximoMes.reduce(
      (sum: number, p: any) => sum + (Number(p.valor) || 0), 0
    );

    const proximaFaturaTitular = parcelasProximoMes
      .filter((p: any) => {
        const respId = compraResponsavelMap[p.compra_id];
        return respId === titularId || respId === null;
      })
      .reduce((sum: number, p: any) => sum + (Number(p.valor) || 0), 0);

    // Verificar se a fatura do mês está toda paga
    const temParcelas = parcelasDoMes.length > 0;
    const faturaAtualPaga = !temParcelas || faturaNaoPaga === 0;

    // Determinar qual mês exibir: avançar se a fatura ativa está paga/vazia
    const mesExibicao = faturaAtualPaga
      ? mesProximo
      : mesFaturaAtiva;

    // Valor a exibir: apenas do titular (EU)
    const faturaExibida = faturaAtualPaga ? proximaFaturaTitular : faturaTitular;

    const limiteDisponivel = Math.max(cartao.limite - limiteUsado, 0);
    const percentualUsado = cartao.limite > 0 ? (limiteUsado / cartao.limite) * 100 : 0;

    return {
      ...cartao,
      limiteUsado,
      limiteDisponivel,
      percentualUsado,
      faturaAtual,
      faturaDoMes: faturaAtual,
      faturaAtualPaga,
      proximaFatura,
      mesExibicao,
      faturaExibida,
    };
  });
}

/**
 * Verificar se já existe um cartão com o mesmo nome
 */
export async function verificarCartaoDuplicado(nome: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data, error } = await (supabase as any)
    .from("cartoes")
    .select("id")
    .eq("user_id", user.id)
    .ilike("nome", nome.trim())
    .limit(1);

  if (error) return false;

  return data && data.length > 0;
}

/**
 * Criar cartão
 */
export async function criarCartao(
  cartao: Omit<Cartao, "id" | "user_id" | "created_at">
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Usuário não autenticado");

  // Verificar duplicado
  const duplicado = await verificarCartaoDuplicado(cartao.nome);
  if (duplicado) {
    throw new Error("Já existe um cartão com este nome");
  }

  const { error } = await (supabase as any)
    .from("cartoes")
    .insert({
      ...cartao,
      user_id: user.id,
    });

  if (error) throw error;
}

/**
 * Atualizar cartão
 */
export async function atualizarCartao(
  id: string,
  dados: Partial<Cartao>
) {
  const { error } = await (supabase as any)
    .from("cartoes")
    .update(dados)
    .eq("id", id);

  if (error) throw error;
}

/**
 * Excluir cartão
 */
export async function excluirCartao(id: string) {
  // Primeiro excluir compras e parcelas relacionadas
  const { data: compras } = await (supabase as any)
    .from("compras_cartao")
    .select("id")
    .eq("cartao_id", id);

  if (compras && compras.length > 0) {
    const compraIds = compras.map((c: any) => c.id);
    
    // Excluir parcelas
    await (supabase as any)
      .from("parcelas_cartao")
      .delete()
      .in("compra_id", compraIds);

    // Excluir compras
    await (supabase as any)
      .from("compras_cartao")
      .delete()
      .eq("cartao_id", id);
  }

  // Excluir cartão
  const { error } = await (supabase as any)
    .from("cartoes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ======================================================
   HOOKS
====================================================== */

export type ResponsavelPrevisao = {
  id: string;
  nome: string;
  apelido: string | null;
  is_titular: boolean;
};

/**
 * Buscar previsão de faturas por responsável
 */
export async function buscarPrevisaoPorResponsavel(
  mesBase: Date,
  mesesFuturos: number = 4
): Promise<{
  responsaveis: ResponsavelPrevisao[];
  previsao: Record<string, Record<string, number>>;
}> {
  // 1. Buscar responsáveis ativos
  const { data: responsaveis, error: respError } = await (supabase as any)
    .from("responsaveis")
    .select("id, nome, apelido, is_titular")
    .eq("ativo", true)
    .order("is_titular", { ascending: false });

  if (respError) throw respError;
  if (!responsaveis || responsaveis.length === 0) {
    return { responsaveis: [], previsao: {} };
  }

  // 2. Buscar todas as compras com responsável
  const { data: compras } = await (supabase as any)
    .from("compras_cartao")
    .select("id, responsavel_id");

  if (!compras || compras.length === 0) {
    return { responsaveis, previsao: {} };
  }

  const compraIds = compras.map((c: any) => c.id);
  const compraResponsavelMap: Record<string, string> = {};
  compras.forEach((c: any) => {
    if (c.responsavel_id) {
      compraResponsavelMap[c.id] = c.responsavel_id;
    }
  });

  // 3. Definir período (usar formato YYYY-MM-DD)
  const ano = mesBase.getFullYear();
  const mes = mesBase.getMonth();
  const inicioStr = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  
  const fimAno = mes + mesesFuturos > 12 ? ano + 1 : ano;
  const fimMes = ((mes + mesesFuturos) % 12) || 12;
  const fimStr = `${fimAno}-${String(fimMes + 1).padStart(2, "0")}-01`;

  // 4. Buscar parcelas no período
  const { data: parcelas } = await (supabase as any)
    .from("parcelas_cartao")
    .select("compra_id, valor, mes_referencia")
    .in("compra_id", compraIds)
    .gte("mes_referencia", inicioStr)
    .lt("mes_referencia", fimStr);

  // 5. Inicializar resultado por responsável
  const previsao: Record<string, Record<string, number>> = {};
  
  responsaveis.forEach((r: any) => {
    previsao[r.id] = {};
    for (let i = 0; i < mesesFuturos; i++) {
      const d = new Date(ano, mes + i, 1);
      const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      previsao[r.id][mesKey] = 0;
    }
  });

  // 6. Somar parcelas por responsável e mês (corrigindo timezone)
  (parcelas || []).forEach((p: any) => {
    const responsavelId = compraResponsavelMap[p.compra_id];
    if (responsavelId && previsao[responsavelId]) {
      // Usar UTC para evitar problemas de timezone
      const [anoP, mesP] = p.mes_referencia.split("-").map(Number);
      const mesKey = `${anoP}-${String(mesP).padStart(2, "0")}`;
      if (previsao[responsavelId][mesKey] !== undefined) {
        previsao[responsavelId][mesKey] += Number(p.valor) || 0;
      }
    }
  });

  return { responsaveis, previsao };
}

/**
 * Hook para previsão por responsável
 */
export function usePrevisaoPorResponsavel(mesBase?: Date) {
  const mes = mesBase || new Date();
  const mesKey = `${mes.getFullYear()}-${mes.getMonth()}`;

  return useQuery({
    queryKey: ["previsao-responsavel", mesKey],
    queryFn: () => buscarPrevisaoPorResponsavel(mes, 4),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para listar cartões com resumo
 */
export function useCartoes(mesReferencia?: Date) {
  const mes = mesReferencia || new Date();
  const mesKey = `${mes.getFullYear()}-${mes.getMonth()}`;

  return useQuery({
    queryKey: ["cartoes", mesKey],
    queryFn: () => listarCartoesComResumo(mes),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para criar cartão
 */
export function useCriarCartao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarCartao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartoes"] });
    },
  });
}

/**
 * Hook para atualizar cartão
 */
export function useAtualizarCartao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<Cartao> }) =>
      atualizarCartao(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartoes"] });
    },
  });
}

/**
 * Hook para excluir cartão
 */
export function useExcluirCartao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: excluirCartao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartoes"] });
    },
  });
}
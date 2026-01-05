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
 * Buscar cartões com resumo de limite e fatura
 */
export async function listarCartoesComResumo(
  mesReferencia?: Date
): Promise<CartaoComResumo[]> {
  const mes = mesReferencia || new Date();
  
  // 1. Buscar cartões
  const { data: cartoes, error: cartoesError } = await (supabase as any)
    .from("cartoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (cartoesError) throw cartoesError;
  if (!cartoes || cartoes.length === 0) return [];

  const cartaoIds = (cartoes as Cartao[]).map((c) => c.id);

  // 2. Buscar TODAS as compras dos cartões
  const { data: compras, error: comprasError } = await (supabase as any)
    .from("compras_cartao")
    .select("id, cartao_id, valor_total")
    .in("cartao_id", cartaoIds);

  if (comprasError) {
    console.error("Erro ao buscar compras:", comprasError);
  }

  const compraIds = (compras || []).map((c: any) => c.id);

  // 3. Buscar TODAS as parcelas não pagas (comprometem o limite)
  let todasParcelasNaoPagas: any[] = [];
  if (compraIds.length > 0) {
    const { data: parcelas, error: parcelasError } = await (supabase as any)
      .from("parcelas_cartao")
      .select("id, compra_id, valor, paga, mes_referencia")
      .in("compra_id", compraIds)
      .eq("paga", false);

    if (parcelasError) {
      console.error("Erro ao buscar parcelas não pagas:", parcelasError);
    }
    todasParcelasNaoPagas = parcelas || [];
  }

  // 4. Buscar parcelas do mês atual (para a fatura)
  const inicioMes = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const fimMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
  const inicioStr = inicioMes.toISOString().slice(0, 10);
  const fimStr = fimMes.toISOString().slice(0, 10);

  let parcelasDoMes: any[] = [];
  if (compraIds.length > 0) {
    const { data: parcelas, error: parcelasError } = await (supabase as any)
      .from("parcelas_cartao")
      .select("id, compra_id, valor, paga, mes_referencia")
      .in("compra_id", compraIds)
      .gte("mes_referencia", inicioStr)
      .lt("mes_referencia", fimStr);

    if (parcelasError) {
      console.error("Erro ao buscar parcelas do mês:", parcelasError);
    }
    parcelasDoMes = parcelas || [];
  }

  // 5. Criar mapa de compra -> cartão
  const compraCartaoMap: Record<string, string> = {};
  (compras || []).forEach((c: any) => {
    compraCartaoMap[c.id] = c.cartao_id;
  });

  // 6. Calcular totais por cartão
  const limiteUsadoPorCartao: Record<string, number> = {};
  const faturaMesPorCartao: Record<string, number> = {};

  // Inicializar
  (cartoes as Cartao[]).forEach((c) => {
    limiteUsadoPorCartao[c.id] = 0;
    faturaMesPorCartao[c.id] = 0;
  });

  // Somar parcelas não pagas (limite usado)
  todasParcelasNaoPagas.forEach((p: any) => {
    const cartaoId = compraCartaoMap[p.compra_id];
    if (cartaoId) {
      limiteUsadoPorCartao[cartaoId] += Number(p.valor) || 0;
    }
  });

  // Somar parcelas do mês (fatura atual)
  parcelasDoMes.forEach((p: any) => {
    const cartaoId = compraCartaoMap[p.compra_id];
    if (cartaoId) {
      faturaMesPorCartao[cartaoId] += Number(p.valor) || 0;
    }
  });

  // 7. Montar resultado
  return (cartoes as Cartao[]).map((cartao) => {
    const limiteUsado = limiteUsadoPorCartao[cartao.id] || 0;
    const limiteDisponivel = Math.max(cartao.limite - limiteUsado, 0);
    const percentualUsado = cartao.limite > 0 ? (limiteUsado / cartao.limite) * 100 : 0;
    const faturaAtual = faturaMesPorCartao[cartao.id] || 0;

    return {
      ...cartao,
      limiteUsado,
      limiteDisponivel,
      percentualUsado,
      faturaAtual,
      faturaDoMes: faturaAtual, // Alias para compatibilidade
    };
  });
}

/**
 * Criar cartão
 */
export async function criarCartao(
  cartao: Omit<Cartao, "id" | "user_id" | "created_at">
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Usuário não autenticado");

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
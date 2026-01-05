import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ======================================================
   TIPOS
====================================================== */

export type StatusAcerto = "pendente" | "parcial" | "quitado";

export type AcertoFatura = {
  id: string;
  user_id: string;
  cartao_id: string;
  responsavel_id: string;
  mes_referencia: string;
  valor_devido: number;
  valor_pago: number;
  data_acerto: string | null;
  status: StatusAcerto;
  observacao: string | null;
  created_at: string;
  // Joins
  responsavel?: {
    id: string;
    nome: string;
    apelido: string | null;
  };
  cartao?: {
    id: string;
    nome: string;
  };
};

export type NovoAcerto = {
  cartao_id: string;
  responsavel_id: string;
  mes_referencia: Date;
  valor_devido: number;
  valor_pago: number;
  observacao?: string;
};

export type RegistrarPagamento = {
  acerto_id?: string;
  cartao_id: string;
  responsavel_id: string;
  mes_referencia: Date;
  valor_pago: number;
  observacao?: string;
};

/* ======================================================
   HELPERS
====================================================== */

function formatarMesReferencia(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/* ======================================================
   FUNÇÕES DE SERVIÇO
====================================================== */

/**
 * Listar acertos de um cartão em um mês
 */
export async function listarAcertosPorMes(
  cartaoId: string,
  mesReferencia: Date
): Promise<AcertoFatura[]> {
  const mesStr = formatarMesReferencia(mesReferencia);

  const { data, error } = await (supabase as any)
    .from("acertos_fatura")
    .select(`
      *,
      responsavel:responsaveis(id, nome, apelido)
    `)
    .eq("cartao_id", cartaoId)
    .eq("mes_referencia", mesStr)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Listar todos os acertos de um responsável
 */
export async function listarAcertosPorResponsavel(
  responsavelId: string
): Promise<AcertoFatura[]> {
  const { data, error } = await (supabase as any)
    .from("acertos_fatura")
    .select(`
      *,
      cartao:cartoes(id, nome),
      responsavel:responsaveis(id, nome, apelido)
    `)
    .eq("responsavel_id", responsavelId)
    .order("mes_referencia", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Buscar ou criar acerto para um responsável/mês
 */
export async function buscarOuCriarAcerto(
  cartaoId: string,
  responsavelId: string,
  mesReferencia: Date,
  valorDevido: number
): Promise<AcertoFatura> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const mesStr = formatarMesReferencia(mesReferencia);

  // Tentar buscar existente
  const { data: existente } = await (supabase as any)
    .from("acertos_fatura")
    .select("*")
    .eq("cartao_id", cartaoId)
    .eq("responsavel_id", responsavelId)
    .eq("mes_referencia", mesStr)
    .single();

  if (existente) {
    // Atualizar valor devido se mudou
    if (existente.valor_devido !== valorDevido) {
      const { data, error } = await (supabase as any)
        .from("acertos_fatura")
        .update({ valor_devido: valorDevido })
        .eq("id", existente.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
    return existente;
  }

  // Criar novo
  const { data, error } = await (supabase as any)
    .from("acertos_fatura")
    .insert({
      user_id: user.id,
      cartao_id: cartaoId,
      responsavel_id: responsavelId,
      mes_referencia: mesStr,
      valor_devido: valorDevido,
      valor_pago: 0,
      status: "pendente",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Registrar pagamento (acerto)
 */
export async function registrarPagamento(dados: RegistrarPagamento): Promise<AcertoFatura> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const mesStr = formatarMesReferencia(dados.mes_referencia);

  // Buscar acerto existente
  const { data: existente } = await (supabase as any)
    .from("acertos_fatura")
    .select("*")
    .eq("cartao_id", dados.cartao_id)
    .eq("responsavel_id", dados.responsavel_id)
    .eq("mes_referencia", mesStr)
    .single();

  if (existente) {
    // Atualizar valor pago
    const novoValorPago = existente.valor_pago + dados.valor_pago;
    
    const { data, error } = await (supabase as any)
      .from("acertos_fatura")
      .update({
        valor_pago: novoValorPago,
        observacao: dados.observacao || existente.observacao,
      })
      .eq("id", existente.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Criar novo acerto com pagamento
  const { data, error } = await (supabase as any)
    .from("acertos_fatura")
    .insert({
      user_id: user.id,
      cartao_id: dados.cartao_id,
      responsavel_id: dados.responsavel_id,
      mes_referencia: mesStr,
      valor_devido: dados.valor_pago, // Se não tinha acerto, o devido é o que foi pago
      valor_pago: dados.valor_pago,
      observacao: dados.observacao,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Quitar acerto completamente
 */
export async function quitarAcerto(acertoId: string, observacao?: string): Promise<AcertoFatura> {
  const { data: acerto } = await (supabase as any)
    .from("acertos_fatura")
    .select("*")
    .eq("id", acertoId)
    .single();

  if (!acerto) throw new Error("Acerto não encontrado");

  const { data, error } = await (supabase as any)
    .from("acertos_fatura")
    .update({
      valor_pago: acerto.valor_devido,
      observacao: observacao || acerto.observacao,
    })
    .eq("id", acertoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Resetar acerto (voltar para pendente)
 */
export async function resetarAcerto(acertoId: string): Promise<AcertoFatura> {
  const { data, error } = await (supabase as any)
    .from("acertos_fatura")
    .update({
      valor_pago: 0,
      data_acerto: null,
    })
    .eq("id", acertoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ======================================================
   HOOKS
====================================================== */

/**
 * Hook para listar acertos de um cartão/mês
 */
export function useAcertosMes(cartaoId: string | null, mesReferencia: Date) {
  const mesKey = formatarMesReferencia(mesReferencia);

  return useQuery({
    queryKey: ["acertos", cartaoId, mesKey],
    queryFn: () => listarAcertosPorMes(cartaoId!, mesReferencia),
    enabled: !!cartaoId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para registrar pagamento
 */
export function useRegistrarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registrarPagamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acertos"] });
    },
  });
}

/**
 * Hook para quitar acerto
 */
export function useQuitarAcerto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, observacao }: { id: string; observacao?: string }) =>
      quitarAcerto(id, observacao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acertos"] });
    },
  });
}
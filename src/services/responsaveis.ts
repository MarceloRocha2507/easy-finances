import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ======================================================
   TIPOS
====================================================== */

export type Responsavel = {
  id: string;
  user_id: string;
  nome: string;
  apelido: string | null;
  telefone: string | null;
  is_titular: boolean;
  ativo: boolean;
  created_at: string;
};

export type NovoResponsavel = {
  nome: string;
  apelido?: string;
  telefone?: string;
};

export type AtualizarResponsavel = Partial<NovoResponsavel> & {
  ativo?: boolean;
};

/* ======================================================
   FUNÇÕES DE SERVIÇO
====================================================== */

/**
 * Listar todos os responsáveis do usuário
 */
export async function listarResponsaveis(): Promise<Responsavel[]> {
  const { data, error } = await (supabase as any)
    .from("responsaveis")
    .select("*")
    .eq("ativo", true)
    .order("is_titular", { ascending: false })
    .order("nome", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Listar todos os responsáveis (incluindo inativos)
 */
export async function listarTodosResponsaveis(): Promise<Responsavel[]> {
  const { data, error } = await (supabase as any)
    .from("responsaveis")
    .select("*")
    .order("is_titular", { ascending: false })
    .order("nome", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Buscar responsável por ID
 */
export async function buscarResponsavel(id: string): Promise<Responsavel | null> {
  const { data, error } = await (supabase as any)
    .from("responsaveis")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

/**
 * Buscar responsável titular (o próprio usuário)
 */
export async function buscarResponsavelTitular(): Promise<Responsavel | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await (supabase as any)
    .from("responsaveis")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_titular", true)
    .single();

  if (error) {
    // Se não existe, criar
    if (error.code === "PGRST116") {
      return criarResponsavelTitular();
    }
    throw error;
  }
  return data;
}

/**
 * Criar responsável titular (chamado automaticamente se não existir)
 */
async function criarResponsavelTitular(): Promise<Responsavel> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await (supabase as any)
    .from("responsaveis")
    .insert({
      user_id: user.id,
      nome: "Eu",
      apelido: "Eu",
      is_titular: true,
      ativo: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Criar novo responsável
 */
export async function criarResponsavel(dados: NovoResponsavel): Promise<Responsavel> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await (supabase as any)
    .from("responsaveis")
    .insert({
      user_id: user.id,
      nome: dados.nome,
      apelido: dados.apelido || null,
      telefone: dados.telefone || null,
      is_titular: false,
      ativo: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Atualizar responsável
 */
export async function atualizarResponsavel(
  id: string,
  dados: AtualizarResponsavel
): Promise<Responsavel> {
  const { data, error } = await (supabase as any)
    .from("responsaveis")
    .update({
      ...dados,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Desativar responsável (soft delete)
 */
export async function desativarResponsavel(id: string): Promise<void> {
  // Verificar se é titular
  const responsavel = await buscarResponsavel(id);
  if (responsavel?.is_titular) {
    throw new Error("Não é possível desativar o responsável titular");
  }

  // Verificar se tem compras vinculadas
  const { count } = await (supabase as any)
    .from("compras_cartao")
    .select("*", { count: "exact", head: true })
    .eq("responsavel_id", id);

  if (count && count > 0) {
    // Apenas desativar, não excluir
    await atualizarResponsavel(id, { ativo: false });
  } else {
    // Pode excluir de verdade
    const { error } = await (supabase as any)
      .from("responsaveis")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}

/**
 * Reativar responsável
 */
export async function reativarResponsavel(id: string): Promise<void> {
  await atualizarResponsavel(id, { ativo: true });
}

/* ======================================================
   HOOKS
====================================================== */

/**
 * Hook para listar responsáveis ativos
 */
export function useResponsaveis() {
  return useQuery({
    queryKey: ["responsaveis"],
    queryFn: listarResponsaveis,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para listar todos os responsáveis
 */
export function useTodosResponsaveis() {
  return useQuery({
    queryKey: ["responsaveis", "todos"],
    queryFn: listarTodosResponsaveis,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para buscar responsável titular
 */
export function useResponsavelTitular() {
  return useQuery({
    queryKey: ["responsaveis", "titular"],
    queryFn: buscarResponsavelTitular,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook para criar responsável
 */
export function useCriarResponsavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarResponsavel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
    },
  });
}

/**
 * Hook para atualizar responsável
 */
export function useAtualizarResponsavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: AtualizarResponsavel }) =>
      atualizarResponsavel(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
    },
  });
}

/**
 * Hook para desativar responsável
 */
export function useDesativarResponsavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: desativarResponsavel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
    },
  });
}
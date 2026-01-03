import { supabase } from "@/integrations/supabase/client";

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

/**
 * Listar cartões
 */
export async function listarCartoes(): Promise<Cartao[]> {
  const { data, error } = await supabase
    .from("cartoes" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as unknown as Cartao[];
}

/**
 * Criar cartão
 */
export async function criarCartao(
  cartao: Omit<Cartao, "id" | "user_id" | "created_at">
) {
  // Pegar o user_id do usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await supabase
    .from("cartoes" as any)
    .insert({
      ...cartao,
      user_id: user.id,  // <-- ISSO QUE ESTAVA FALTANDO!
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
  const { error } = await supabase
    .from("cartoes" as any)
    .update(dados)
    .eq("id", id);

  if (error) throw error;
}

/**
 * Excluir cartão
 */
export async function excluirCartao(id: string) {
  const { error } = await supabase
    .from("cartoes" as any)
    .delete()
    .eq("id", id);

  if (error) throw error;
}
import { supabase } from "@/integrations/supabase/client";

/* ======================================================
   TIPOS
====================================================== */

export type Categoria = {
  id: string;
  user_id: string;
  nome: string;
  cor: string;
  icone: string;
  created_at?: string;
};

/* ======================================================
   LISTAR CATEGORIAS
====================================================== */

export async function listarCategorias(): Promise<Categoria[]> {
  const { data, error } = await (supabase as any)
    .from("categorias")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Categoria[];
}

/* ======================================================
   CRIAR CATEGORIA
====================================================== */

export async function criarCategoria(dados: {
  nome: string;
  cor?: string;
  icone?: string;
}): Promise<Categoria> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await (supabase as any)
    .from("categorias")
    .insert({
      user_id: user.id,
      nome: dados.nome,
      cor: dados.cor ?? "#6366f1",
      icone: dados.icone ?? "tag",
    })
    .select()
    .single();

  if (error) throw error;
  return data as Categoria;
}

/* ======================================================
   ATUALIZAR CATEGORIA
====================================================== */

export async function atualizarCategoria(
  id: string,
  dados: Partial<Pick<Categoria, "nome" | "cor" | "icone">>
): Promise<void> {
  const { error } = await (supabase as any)
    .from("categorias")
    .update(dados)
    .eq("id", id);

  if (error) throw error;
}

/* ======================================================
   EXCLUIR CATEGORIA
====================================================== */

export async function excluirCategoria(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("categorias")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
import { supabase } from "@/integrations/supabase/client";

/* ======================================================
   TIPOS
====================================================== */

export type Tag = {
  id: string;
  user_id: string;
  nome: string;
  cor: string;
  created_at?: string;
};

/* ======================================================
   LISTAR TAGS
====================================================== */

export async function listarTags(): Promise<Tag[]> {
  const { data, error } = await (supabase as any)
    .from("tags")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Tag[];
}

/* ======================================================
   CRIAR TAG
====================================================== */

export async function criarTag(dados: {
  nome: string;
  cor?: string;
}): Promise<Tag> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await (supabase as any)
    .from("tags")
    .insert({
      user_id: user.id,
      nome: dados.nome,
      cor: dados.cor ?? "#8b5cf6",
    })
    .select()
    .single();

  if (error) throw error;
  return data as Tag;
}

/* ======================================================
   ATUALIZAR TAG
====================================================== */

export async function atualizarTag(
  id: string,
  dados: Partial<Pick<Tag, "nome" | "cor">>
): Promise<void> {
  const { error } = await (supabase as any)
    .from("tags")
    .update(dados)
    .eq("id", id);

  if (error) throw error;
}

/* ======================================================
   EXCLUIR TAG
====================================================== */

export async function excluirTag(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("tags")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ======================================================
   TAGS DE UMA COMPRA
====================================================== */

export async function listarTagsDaCompra(compraId: string): Promise<Tag[]> {
  const { data, error } = await (supabase as any)
    .from("compra_tags")
    .select(`
      tag_id,
      tags (
        id,
        user_id,
        nome,
        cor,
        created_at
      )
    `)
    .eq("compra_id", compraId);

  if (error) throw error;

  return (data ?? []).map((item: any) => item.tags).filter(Boolean) as Tag[];
}

/* ======================================================
   ADICIONAR TAG À COMPRA
====================================================== */

export async function adicionarTagNaCompra(
  compraId: string,
  tagId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from("compra_tags")
    .insert({
      compra_id: compraId,
      tag_id: tagId,
    });

  // Ignora erro de duplicata
  if (error && !error.message.includes("duplicate")) throw error;
}

/* ======================================================
   REMOVER TAG DA COMPRA
====================================================== */

export async function removerTagDaCompra(
  compraId: string,
  tagId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from("compra_tags")
    .delete()
    .eq("compra_id", compraId)
    .eq("tag_id", tagId);

  if (error) throw error;
}

/* ======================================================
   SINCRONIZAR TAGS DA COMPRA
====================================================== */

export async function sincronizarTagsDaCompra(
  compraId: string,
  tagIds: string[]
): Promise<void> {
  // Remove todas as tags existentes
  await (supabase as any)
    .from("compra_tags")
    .delete()
    .eq("compra_id", compraId);

  // Adiciona as novas tags
  if (tagIds.length > 0) {
    const payload = tagIds.map((tagId) => ({
      compra_id: compraId,
      tag_id: tagId,
    }));

    const { error } = await (supabase as any)
      .from("compra_tags")
      .insert(payload);

    if (error) throw error;
  }
}
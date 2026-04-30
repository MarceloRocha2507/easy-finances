import { supabase } from "@/integrations/supabase/client";

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  category: "Cartões" | "Transações" | "Compras no Cartão" | "Categorias" | "Responsáveis" | "Bancos";
  type: string;
  url?: string;
  amount?: number;
  date?: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const searchTerm = `%${query}%`;
  const results: SearchResult[] = [];

  try {
    // 1. Search in Cartões
    const { data: cartoes } = await supabase
      .from("cartoes")
      .select("id, nome, bandeira")
      .ilike("nome", searchTerm)
      .limit(5);

    if (cartoes) {
      cartoes.forEach((c) => {
        results.push({
          id: c.id,
          title: c.nome,
          subtitle: c.bandeira || undefined,
          category: "Cartões",
          type: "cartao",
          url: `/cartoes/${c.id}/despesas`,
        });
      });
    }

    // 2. Search in Transactions (Despesas/Recebimentos)
    const { data: transacoes } = await supabase
      .from("transactions")
      .select("id, description, amount, date, type")
      .ilike("description", searchTerm)
      .order("date", { ascending: false })
      .limit(10);

    if (transacoes) {
      transacoes.forEach((t) => {
        results.push({
          id: t.id,
          title: t.description,
          subtitle: t.type === "expense" ? "Despesa" : "Receita",
          category: "Transações",
          type: "transacao",
          amount: t.amount,
          date: t.date,
          url: "/transactions", // We might want a more specific URL if possible
        });
      });
    }

    // 3. Search in Compras no Cartão
    const { data: compras } = await supabase
      .from("compras_cartao")
      .select("id, descricao, valor_total, data_compra, cartao_id")
      .ilike("descricao", searchTerm)
      .order("data_compra", { ascending: false })
      .limit(10);

    if (compras) {
      compras.forEach((c) => {
        results.push({
          id: c.id,
          title: c.descricao,
          subtitle: "Compra no Cartão",
          category: "Compras no Cartão",
          type: "compra_cartao",
          amount: c.valor_total,
          date: c.data_compra,
          url: `/cartoes/${c.cartao_id}/despesas`,
        });
      });
    }

    // 4. Search in Categories
    const { data: categorias } = await supabase
      .from("categories")
      .select("id, name")
      .ilike("name", searchTerm)
      .limit(5);

    if (categorias) {
      categorias.forEach((cat) => {
        results.push({
          id: cat.id,
          title: cat.name,
          category: "Categorias",
          type: "categoria",
          url: "/categories",
        });
      });
    }

    // 5. Search in Responsaveis
    const { data: responsaveis } = await supabase
      .from("responsaveis")
      .select("id, nome, apelido")
      .or(`nome.ilike.${searchTerm},apelido.ilike.${searchTerm}`)
      .limit(5);

    if (responsaveis) {
      responsaveis.forEach((r) => {
        results.push({
          id: r.id,
          title: r.nome,
          subtitle: r.apelido || undefined,
          category: "Responsáveis",
          type: "responsavel",
          url: "/cartoes/responsaveis",
        });
      });
    }

    // 6. Search in Bancos
    const { data: bancos } = await supabase
      .from("bancos")
      .select("id, nome")
      .ilike("nome", searchTerm)
      .limit(5);

    if (bancos) {
      bancos.forEach((b) => {
        results.push({
          id: b.id,
          title: b.nome,
          category: "Bancos",
          type: "banco",
          url: "/cartoes/bancos",
        });
      });
    }

  } catch (error) {
    console.error("Error in global search:", error);
  }

  return results;
}

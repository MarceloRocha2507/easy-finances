import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AlertaOrcamento = {
  id: string;
  tipo: "warning" | "danger" | "info" | "success";
  titulo: string;
  mensagem: string;
  icone: string;
  categoria: "orcamento";
};

function firstDayOfMonth(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function lastDayOfMonth(date: Date): string {
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const yyyy = nextMonth.getFullYear();
  const mm = String(nextMonth.getMonth() + 1).padStart(2, "0");
  const dd = String(nextMonth.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useAlertasOrcamento() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["alertas-orcamento", user?.id],
    queryFn: async (): Promise<AlertaOrcamento[]> => {
      const alertas: AlertaOrcamento[] = [];
      const mes = new Date();
      const inicioMes = firstDayOfMonth(mes);
      const fimMes = lastDayOfMonth(mes);

      // 1. Buscar orçamentos
      const { data: orcamentos, error: orcError } = await (supabase as any)
        .from("orcamentos")
        .select(`
          id, category_id, valor_limite,
          categories(id, name, icon, color)
        `)
        .eq("user_id", user?.id)
        .eq("mes_referencia", inicioMes);

      if (orcError) {
        console.error("Erro ao buscar orçamentos:", orcError);
        return [];
      }

      if (!orcamentos || orcamentos.length === 0) {
        return [];
      }

      // 2. Buscar gastos por categoria (transações)
      const { data: transacoes } = await supabase
        .from("transactions")
        .select("amount, category_id")
        .eq("type", "expense")
        .gte("date", inicioMes)
        .lte("date", fimMes);

      const gastosPorCategoria: Record<string, number> = {};
      (transacoes || []).forEach((t: any) => {
        const catId = t.category_id || "";
        gastosPorCategoria[catId] = (gastosPorCategoria[catId] || 0) + Number(t.amount);
      });

      // 3. Buscar parcelas do cartão do mês e somar por categoria
      const { data: parcelasCartao } = await (supabase as any)
        .from("parcelas_cartao")
        .select(`
          valor,
          ativo,
          compra:compras_cartao(categoria_id)
        `)
        .gte("mes_referencia", inicioMes)
        .lte("mes_referencia", fimMes)
        .eq("ativo", true);

      (parcelasCartao || []).forEach((p: any) => {
        const valor = Number(p.valor) || 0;
        const catId = p.compra?.categoria_id || "";
        if (catId) {
          gastosPorCategoria[catId] = (gastosPorCategoria[catId] || 0) + valor;
        }
      });

      // 4. Verificar cada orçamento
      (orcamentos || []).forEach((o: any) => {
        const limite = Number(o.valor_limite) || 0;
        const gasto = gastosPorCategoria[o.category_id] || 0;
        const percentual = limite > 0 ? (gasto / limite) * 100 : 0;
        const categoriaNome = o.categories?.name || "Categoria";

        // Orçamento excedido (≥100%)
        if (percentual >= 100) {
          const excedido = gasto - limite;
          alertas.push({
            id: `orcamento-excedido-${o.id}`,
            tipo: "danger",
            titulo: "Orçamento estourado!",
            mensagem: `${categoriaNome} excedeu o limite em R$ ${excedido.toFixed(2)} (${percentual.toFixed(0)}%).`,
            icone: "alert-octagon",
            categoria: "orcamento",
          });
        }
        // Orçamento em alerta (80-99%)
        else if (percentual >= 80) {
          const disponivel = limite - gasto;
          alertas.push({
            id: `orcamento-alerta-${o.id}`,
            tipo: "warning",
            titulo: "Orçamento quase no limite",
            mensagem: `${categoriaNome} está em ${percentual.toFixed(0)}%. Restam R$ ${disponivel.toFixed(2)}.`,
            icone: "alert-triangle",
            categoria: "orcamento",
          });
        }
      });

      return alertas;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

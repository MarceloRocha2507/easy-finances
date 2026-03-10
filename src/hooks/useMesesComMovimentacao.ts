import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useMesesComMovimentacao() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["meses-com-movimentacao", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch distinct months from transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("date")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      // Fetch distinct months from compras_cartao
      const { data: compras } = await supabase
        .from("compras_cartao")
        .select("mes_inicio")
        .eq("user_id", user.id)
        .eq("ativo", true);

      // Fetch distinct months from parcelas via compras
      const { data: parcelas } = await supabase
        .from("parcelas_cartao")
        .select("mes_referencia, compra_id")
        .eq("ativo", true);

      const mesesSet = new Set<string>();

      // Always include current month
      const hoje = new Date();
      const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
      mesesSet.add(mesAtual);

      // Add transaction months
      transactions?.forEach((t) => {
        if (t.date) {
          const d = new Date(t.date);
          mesesSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
      });

      // Add compras months
      compras?.forEach((c) => {
        if (c.mes_inicio) {
          const d = new Date(c.mes_inicio);
          mesesSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
      });

      // Add parcelas months
      parcelas?.forEach((p) => {
        if (p.mes_referencia) {
          const d = new Date(p.mes_referencia);
          mesesSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
      });

      // Sort ascending
      return Array.from(mesesSet).sort();
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

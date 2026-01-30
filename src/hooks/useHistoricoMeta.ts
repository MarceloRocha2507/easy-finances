import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MovimentacaoMeta {
  id: string;
  tipo: 'deposito' | 'retirada';
  valor: number;
  data: Date;
  descricao: string | null;
  categoria: string | null;
}

export function useHistoricoMeta(metaId: string, metaTitulo: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["historico-meta", metaId, metaTitulo],
    queryFn: async () => {
      if (!user) return [];

      // Buscar transações relacionadas à meta pela descrição
      // Depósitos são expense (saída do saldo disponível)
      // Retiradas são income (entrada no saldo disponível)
      const { data, error } = await supabase
        .from("transactions")
        .select(`*, category:categories(name)`)
        .eq("user_id", user.id)
        .or(`description.ilike.%Depósito na meta: ${metaTitulo}%,description.ilike.%Retirada da meta: ${metaTitulo}%`)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Mapear para o formato de movimentação
      return (data || []).map(tx => ({
        id: tx.id,
        // Depósito na meta = expense (dinheiro sai do saldo disponível)
        // Retirada da meta = income (dinheiro volta ao saldo disponível)
        tipo: tx.type === 'expense' ? 'deposito' : 'retirada' as 'deposito' | 'retirada',
        valor: tx.amount,
        data: new Date(tx.date),
        descricao: tx.description,
        categoria: tx.category?.name || null,
      }));
    },
    enabled: !!user && !!metaId && !!metaTitulo,
  });
}

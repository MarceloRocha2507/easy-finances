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
  motivo: string | null;
  saldo_resultante: number | null;
}

export function useHistoricoMeta(metaId: string, metaTitulo: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["historico-meta", metaId, metaTitulo],
    queryFn: async (): Promise<MovimentacaoMeta[]> => {
      if (!user) return [];

      // 1. Buscar da nova tabela movimentacoes_meta
      const { data: movimentacoes, error: movError } = await (supabase as any)
        .from("movimentacoes_meta")
        .select("*")
        .eq("user_id", user.id)
        .eq("meta_id", metaId)
        .order("created_at", { ascending: false });

      if (movError) throw movError;

      const novasMovimentacoes: MovimentacaoMeta[] = (movimentacoes || []).map((m: any) => ({
        id: m.id,
        tipo: m.tipo as 'deposito' | 'retirada',
        valor: Number(m.valor),
        data: new Date(m.created_at),
        descricao: null,
        categoria: null,
        motivo: m.motivo,
        saldo_resultante: Number(m.saldo_resultante),
      }));

      // 2. Fallback: buscar transações antigas (anteriores à nova tabela)
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select(`*, category:categories(name)`)
        .eq("user_id", user.id)
        .or(`description.ilike.%Depósito na meta: ${metaTitulo}%,description.ilike.%Retirada da meta: ${metaTitulo}%`)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (txError) throw txError;

      // Filtrar transações antigas que não têm correspondente na nova tabela
      // (comparando por data/valor aproximado)
      const novasIds = new Set(novasMovimentacoes.map(m => m.data.getTime()));
      
      const legacyMovimentacoes: MovimentacaoMeta[] = (txData || [])
        .filter(tx => {
          // Se já temos movimentações novas, só incluir transações mais antigas
          if (novasMovimentacoes.length === 0) return true;
          const oldestNew = Math.min(...novasMovimentacoes.map(m => m.data.getTime()));
          return new Date(tx.created_at).getTime() < oldestNew;
        })
        .map(tx => ({
          id: tx.id,
          tipo: tx.type === 'expense' ? 'deposito' : 'retirada' as 'deposito' | 'retirada',
          valor: tx.amount,
          data: new Date(tx.date),
          descricao: tx.description,
          categoria: tx.category?.name || null,
          motivo: null,
          saldo_resultante: null,
        }));

      return [...novasMovimentacoes, ...legacyMovimentacoes];
    },
    enabled: !!user && !!metaId && !!metaTitulo,
  });
}

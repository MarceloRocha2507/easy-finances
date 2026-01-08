import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useSaldoInicial } from '@/hooks/useSaldoInicial';
import { useMetas } from '@/hooks/useMetas';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export function useProfileStats() {
  const { user } = useAuth();
  const { data: transactions } = useTransactions();
  const { data: categories } = useCategories();
  const { saldoInicial } = useSaldoInicial();
  const { data: metas } = useMetas();

  // Buscar cartões
  const { data: cartoes } = useQuery({
    queryKey: ['cartoes-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('cartoes')
        .select('id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Buscar informações do plano
  const { data: profile } = useQuery({
    queryKey: ['profile-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('tipo_plano, data_expiracao, ativo')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calcular estatísticas
  const now = new Date();
  const mesInicio = format(startOfMonth(now), 'yyyy-MM-dd');
  const mesFim = format(endOfMonth(now), 'yyyy-MM-dd');

  const transacoesMes = transactions?.filter(t => 
    t.date >= mesInicio && t.date <= mesFim
  ) || [];

  const receitasMes = transacoesMes
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const despesasMes = transacoesMes
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalReceitas = transactions?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalDespesas = transactions?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const saldoAtual = (saldoInicial || 0) + totalReceitas - totalDespesas;

  const metasConcluidas = metas?.filter(m => m.concluida).length || 0;
  const metasEmAndamento = metas?.filter(m => !m.concluida).length || 0;

  return {
    totalTransacoes: transactions?.length || 0,
    totalCategorias: categories?.length || 0,
    totalCartoes: cartoes?.length || 0,
    receitasMes,
    despesasMes,
    saldoAtual,
    metasConcluidas,
    metasEmAndamento,
    totalMetas: (metas?.length || 0),
    plano: {
      tipo: profile?.tipo_plano || 'mensal',
      dataExpiracao: profile?.data_expiracao,
      ativo: profile?.ativo ?? true,
    },
    membroDesde: user?.created_at,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useSaldoInicial() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['saldo-inicial', user?.id],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('saldo_inicial')
        .eq('user_id', user!.id)
        .single();
      
      if (error) throw error;
      return Number(data?.saldo_inicial) || 0;
    },
    enabled: !!user,
  });

  const { mutateAsync: atualizarSaldo, isPending: isUpdating } = useMutation({
    mutationFn: async (novoSaldo: number) => {
      const valorArredondado = parseFloat(novoSaldo.toFixed(2));
      const { error } = await supabase
        .from('profiles')
        .update({ saldo_inicial: valorArredondado })
        .eq('user_id', user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saldo-inicial'] });
      queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
      toast.success('Saldo inicial atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar saldo inicial');
    },
  });

  return { 
    saldoInicial: data ?? 0,
    isLoading, 
    atualizarSaldo, 
    isUpdating,
  };
}

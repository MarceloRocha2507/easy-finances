import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SaldoInicialData {
  saldoInicial: number;
  saldoInicialGuardado: number;
}

export function useSaldoInicial() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['saldo-inicial', user?.id],
    queryFn: async (): Promise<SaldoInicialData> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('saldo_inicial, saldo_inicial_guardado')
        .eq('user_id', user!.id)
        .single();
      
      if (error) throw error;
      return {
        saldoInicial: Number(data?.saldo_inicial) || 0,
        saldoInicialGuardado: Number(data?.saldo_inicial_guardado) || 0,
      };
    },
    enabled: !!user,
  });

  const { mutateAsync: atualizarSaldo, isPending: isUpdating } = useMutation({
    mutationFn: async (novoSaldo: number) => {
      const { error } = await supabase
        .from('profiles')
        .update({ saldo_inicial: novoSaldo })
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

  const { mutateAsync: atualizarSaldoGuardado, isPending: isUpdatingGuardado } = useMutation({
    mutationFn: async (novoSaldo: number) => {
      const { error } = await supabase
        .from('profiles')
        .update({ saldo_inicial_guardado: novoSaldo })
        .eq('user_id', user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saldo-inicial'] });
      queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
      toast.success('Saldo inicial guardado atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar saldo inicial guardado');
    },
  });

  return { 
    saldoInicial: data?.saldoInicial ?? 0,
    saldoInicialGuardado: data?.saldoInicialGuardado ?? 0,
    isLoading, 
    atualizarSaldo, 
    isUpdating,
    atualizarSaldoGuardado,
    isUpdatingGuardado,
  };
}

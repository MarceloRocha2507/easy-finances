import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useAjusteEstimado() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ajusteEstimado, isLoading } = useQuery({
    queryKey: ['ajuste-estimado', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const { data, error } = await supabase
        .from('profiles')
        .select('ajuste_estimado')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar ajuste estimado:', error);
        return 0;
      }
      
      return Number(data?.ajuste_estimado) || 0;
    },
    enabled: !!user,
  });

  const { mutateAsync: atualizarAjuste, isPending: isUpdating } = useMutation({
    mutationFn: async (novoAjuste: number) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update({ ajuste_estimado: novoAjuste })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ajuste-estimado'] });
      queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
      toast.success('Ajuste do saldo estimado atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar ajuste estimado:', error);
      toast.error('Erro ao atualizar ajuste');
    },
  });

  return {
    ajusteEstimado: ajusteEstimado ?? 0,
    isLoading,
    atualizarAjuste,
    isUpdating,
  };
}

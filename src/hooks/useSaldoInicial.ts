import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function useSaldoInicial() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['saldo-inicial', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      // Fonte principal: soma do saldo inicial das contas bancárias ativas
      const { data: bancos, error: bancosError } = await supabase
        .from('bancos')
        .select('saldo_inicial')
        .eq('user_id', user.id)
        .eq('ativo', true);

      if (bancosError) throw bancosError;

      if ((bancos || []).length > 0) {
        return (bancos || []).reduce((acc, b) => acc + Number(b.saldo_inicial || 0), 0);
      }

      // Fallback legado: perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('saldo_inicial')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      return Number(profile?.saldo_inicial) || 0;
    },
    enabled: !!user,
  });

  const { mutateAsync: atualizarSaldo, isPending: isUpdating } = useMutation({
    mutationFn: async (novoSaldo: number) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const valorArredondado = roundCurrency(novoSaldo);

      // Se já existem bancos, o saldo inicial global deve ajustar os bancos (não apenas profile)
      const { data: bancosAtivos, error: bancosError } = await supabase
        .from('bancos')
        .select('id, saldo_inicial, updated_at')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('updated_at', { ascending: false });

      if (bancosError) throw bancosError;

      if ((bancosAtivos || []).length > 0) {
        const totalAtual = (bancosAtivos || []).reduce(
          (acc, banco) => acc + Number(banco.saldo_inicial || 0),
          0
        );

        const diferenca = roundCurrency(valorArredondado - totalAtual);
        if (Math.abs(diferenca) < 0.01) return;

        // Ajusta a conta ativa mais recentemente atualizada para bater o total informado
        const bancoAlvo = bancosAtivos![0];
        const novoSaldoBanco = roundCurrency(Number(bancoAlvo.saldo_inicial || 0) + diferenca);

        const { error: updateBancoError } = await supabase
          .from('bancos')
          .update({ saldo_inicial: novoSaldoBanco })
          .eq('id', bancoAlvo.id)
          .eq('user_id', user.id);

        if (updateBancoError) throw updateBancoError;

        // Mantém profile sincronizado como fallback
        await supabase
          .from('profiles')
          .update({ saldo_inicial: valorArredondado })
          .eq('user_id', user.id);

        return;
      }

      // Cenário sem bancos: mantém comportamento original
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ saldo_inicial: valorArredondado })
        .eq('user_id', user.id);

      if (updateProfileError) throw updateProfileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saldo-inicial'] });
      queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
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


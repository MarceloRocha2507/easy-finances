import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PreferenciasUsuario {
  id: string;
  user_id: string;
  tema: 'light' | 'dark' | 'system';
  moeda: string;
  formato_data: string;
  primeiro_dia_semana: number;
  created_at: string;
  updated_at: string;
}

const PREFERENCIAS_PADRAO: Omit<PreferenciasUsuario, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  tema: 'system',
  moeda: 'BRL',
  formato_data: 'DD/MM/YYYY',
  primeiro_dia_semana: 0,
};

export function usePreferenciasUsuario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferencias, isLoading } = useQuery({
    queryKey: ['preferencias-usuario', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('preferencias_usuario')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Retorna preferências existentes ou padrão
      if (data) {
        return data as PreferenciasUsuario;
      }
      
      return {
        ...PREFERENCIAS_PADRAO,
        user_id: user.id,
      } as Partial<PreferenciasUsuario>;
    },
    enabled: !!user?.id,
  });

  const salvarPreferencias = useMutation({
    mutationFn: async (novasPreferencias: Partial<PreferenciasUsuario>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: existing } = await supabase
        .from('preferencias_usuario')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('preferencias_usuario')
          .update(novasPreferencias)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('preferencias_usuario')
          .insert({ ...novasPreferencias, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferencias-usuario'] });
      toast({
        title: 'Preferências salvas',
        description: 'Suas preferências foram atualizadas com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as preferências.',
        variant: 'destructive',
      });
    },
  });

  const getTema = () => preferencias?.tema || 'system';
  const getMoeda = () => preferencias?.moeda || 'BRL';
  const getFormatoData = () => preferencias?.formato_data || 'DD/MM/YYYY';
  const getPrimeiroDiaSemana = () => preferencias?.primeiro_dia_semana ?? 0;

  return {
    preferencias,
    isLoading,
    salvarPreferencias,
    getTema,
    getMoeda,
    getFormatoData,
    getPrimeiroDiaSemana,
  };
}

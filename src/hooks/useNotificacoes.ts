import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAlertasCompletos, AlertaCompleto, CategoriaAlerta } from "./useAlertasCompletos";
import { useAuth } from "./useAuth";

export type NotificacaoComStatus = AlertaCompleto & {
  lido: boolean;
};

export function useNotificacoes() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: alertas, isLoading: loadingAlertas, categorias } = useAlertasCompletos();

  // Buscar IDs dos alertas já lidos
  const { data: alertasLidos = [], isLoading: loadingLidos } = useQuery({
    queryKey: ["notificacoes-lidas", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("notificacoes_lidas" as any)
        .select("alerta_id");
      
      if (error) {
        console.error("Erro ao buscar notificações lidas:", error);
        return [];
      }
      
      return (data || []).map((n: any) => n.alerta_id);
    },
    enabled: !!user,
  });

  // Combinar alertas com status de leitura
  const notificacoes: NotificacaoComStatus[] = (alertas || []).map((alerta) => ({
    ...alerta,
    lido: alertasLidos.includes(alerta.id),
  }));

  // Marcar como lido
  const marcarComoLido = useMutation({
    mutationFn: async (alertaId: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from("notificacoes_lidas" as any)
        .insert({
          user_id: user.id,
          alerta_id: alertaId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes-lidas"] });
    },
  });

  // Marcar como não lido
  const marcarComoNaoLido = useMutation({
    mutationFn: async (alertaId: string) => {
      const { error } = await supabase
        .from("notificacoes_lidas" as any)
        .delete()
        .eq("alerta_id", alertaId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes-lidas"] });
    },
  });

  // Marcar todos como lidos
  const marcarTodosComoLidos = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const novosLidos = notificacoes
        .filter((n) => !n.lido)
        .map((n) => ({
          user_id: user.id,
          alerta_id: n.id,
        }));
      
      if (novosLidos.length > 0) {
        const { error } = await supabase
          .from("notificacoes_lidas" as any)
          .insert(novosLidos);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes-lidas"] });
    },
  });

  return {
    notificacoes,
    isLoading: loadingAlertas || loadingLidos,
    marcarComoLido,
    marcarComoNaoLido,
    marcarTodosComoLidos,
    naoLidas: notificacoes.filter((n) => !n.lido).length,
    total: notificacoes.length,
    categorias,
  };
}

export type { CategoriaAlerta };

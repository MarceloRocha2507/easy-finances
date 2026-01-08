import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardCompleto, Alerta } from "./useDashboardCompleto";

export type NotificacaoComStatus = Alerta & {
  lido: boolean;
};

export function useNotificacoes() {
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading: loadingDashboard } = useDashboardCompleto();

  // Buscar IDs dos alertas já lidos
  const { data: alertasLidos, isLoading: loadingLidos } = useQuery({
    queryKey: ["notificacoes-lidas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notificacoes_lidas")
        .select("alerta_id");
      return data?.map((n) => n.alerta_id) || [];
    },
  });

  // Combinar alertas com status de leitura
  const notificacoes: NotificacaoComStatus[] = (dashboard?.alertas || []).map((alerta) => ({
    ...alerta,
    lido: alertasLidos?.includes(alerta.id) || false,
  }));

  // Marcar como lido
  const marcarComoLido = useMutation({
    mutationFn: async (alertaId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      await supabase.from("notificacoes_lidas").insert({
        user_id: user.id,
        alerta_id: alertaId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes-lidas"] });
    },
  });

  // Marcar como não lido
  const marcarComoNaoLido = useMutation({
    mutationFn: async (alertaId: string) => {
      await supabase
        .from("notificacoes_lidas")
        .delete()
        .eq("alerta_id", alertaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes-lidas"] });
    },
  });

  // Marcar todos como lidos
  const marcarTodosComoLidos = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const novosLidos = notificacoes
        .filter((n) => !n.lido)
        .map((n) => ({
          user_id: user.id,
          alerta_id: n.id,
        }));
      
      if (novosLidos.length > 0) {
        await supabase.from("notificacoes_lidas").insert(novosLidos);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes-lidas"] });
    },
  });

  return {
    notificacoes,
    isLoading: loadingDashboard || loadingLidos,
    marcarComoLido,
    marcarComoNaoLido,
    marcarTodosComoLidos,
    naoLidas: notificacoes.filter((n) => !n.lido).length,
    total: notificacoes.length,
  };
}

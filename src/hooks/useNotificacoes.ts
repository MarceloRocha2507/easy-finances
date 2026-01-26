import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAlertasCompletos, AlertaCompleto, CategoriaAlerta } from "./useAlertasCompletos";
import { useAuth } from "./useAuth";
import { mapearAlertaParaTipo, getValorPadrao } from "./usePreferenciasNotificacao";

export type NotificacaoComStatus = AlertaCompleto & {
  lido: boolean;
};

type PreferenciasMap = Record<string, boolean>;

// Cache de 5 minutos para evitar re-fetches desnecessários
const STALE_TIME = 1000 * 60 * 5;

export function useNotificacoes() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: alertas, isLoading: loadingAlertas, categorias } = useAlertasCompletos();

  // Buscar preferências de notificação com staleTime aumentado
  const { data: preferencias = {}, isLoading: loadingPreferencias } = useQuery({
    queryKey: ["preferencias-notificacao", user?.id],
    queryFn: async (): Promise<PreferenciasMap> => {
      if (!user) return {};

      const { data, error } = await supabase
        .from("preferencias_notificacao")
        .select("tipo_alerta, ativo");

      if (error) {
        console.error("Erro ao buscar preferências:", error);
        return {};
      }

      const map: PreferenciasMap = {};
      (data || []).forEach((p: any) => {
        map[p.tipo_alerta] = p.ativo;
      });

      return map;
    },
    enabled: !!user,
    staleTime: STALE_TIME,
  });

  // Buscar IDs dos alertas já lidos com staleTime aumentado
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
    staleTime: STALE_TIME,
  });

  // Memoizar função de verificação de alerta ativo
  const isAlertaAtivo = useMemo(() => {
    return (alertaId: string): boolean => {
      const tipoAlerta = mapearAlertaParaTipo(alertaId);
      if (!tipoAlerta) return true;

      if (tipoAlerta in preferencias) {
        return preferencias[tipoAlerta];
      }
      return getValorPadrao(tipoAlerta);
    };
  }, [preferencias]);

  // Memoizar alertas filtrados
  const alertasFiltrados = useMemo(() => {
    return (alertas || []).filter((alerta) => isAlertaAtivo(alerta.id));
  }, [alertas, isAlertaAtivo]);

  // Memoizar notificações com status de leitura
  const notificacoes = useMemo<NotificacaoComStatus[]>(() => {
    return alertasFiltrados.map((alerta) => ({
      ...alerta,
      lido: alertasLidos.includes(alerta.id),
    }));
  }, [alertasFiltrados, alertasLidos]);

  // Memoizar categorias filtradas
  const categoriasFiltradas = useMemo(() => ({
    cartao: alertasFiltrados.filter(a => a.categoria === "cartao").length,
    transacao: alertasFiltrados.filter(a => a.categoria === "transacao").length,
    meta: alertasFiltrados.filter(a => a.categoria === "meta").length,
    orcamento: alertasFiltrados.filter(a => a.categoria === "orcamento").length,
    acerto: alertasFiltrados.filter(a => a.categoria === "acerto").length,
    economia: alertasFiltrados.filter(a => a.categoria === "economia").length,
  }), [alertasFiltrados]);

  // Memoizar contagem de não lidas
  const naoLidas = useMemo(() => {
    return notificacoes.filter((n) => !n.lido).length;
  }, [notificacoes]);

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
    isLoading: loadingAlertas || loadingLidos || loadingPreferencias,
    marcarComoLido,
    marcarComoNaoLido,
    marcarTodosComoLidos,
    naoLidas,
    total: notificacoes.length,
    categorias: categoriasFiltradas,
  };
}

export type { CategoriaAlerta };

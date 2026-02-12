import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useTelegram() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Configurar webhook automaticamente (idempotente)
  const configurarWebhook = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("telegram-webhook", {
        body: { action: "setup-webhook" },
      });
      if (error) throw error;
      return data;
    },
  });

  // Buscar configuração do Telegram
  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["telegram-config", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("telegram_config")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .maybeSingle();
      if (error) {
        console.error("Erro ao buscar config Telegram:", error);
        return null;
      }
      return data;
    },
    enabled: !!user,
  });

  // Buscar preferências do Telegram
  const { data: preferencias = {}, isLoading: isLoadingPrefs } = useQuery({
    queryKey: ["telegram-prefs", user?.id],
    queryFn: async (): Promise<Record<string, boolean>> => {
      if (!user) return {};
      const { data, error } = await supabase
        .from("preferencias_telegram")
        .select("tipo_alerta, ativo")
        .eq("user_id", user.id);
      if (error) {
        console.error("Erro ao buscar prefs Telegram:", error);
        return {};
      }
      const map: Record<string, boolean> = {};
      (data || []).forEach((p: any) => {
        map[p.tipo_alerta] = p.ativo;
      });
      return map;
    },
    enabled: !!user,
  });

  // Vincular conta com código
  const vincular = useMutation({
    mutationFn: async (codigo: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase.functions.invoke("telegram-webhook", {
        body: { action: "link", codigo, user_id: user.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-config"] });
    },
  });

  // Desvincular conta
  const desvincular = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase.functions.invoke("telegram-webhook", {
        body: { action: "unlink", user_id: user.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-config"] });
      queryClient.invalidateQueries({ queryKey: ["telegram-prefs"] });
    },
  });

  // Salvar preferência individual
  const salvarPreferencia = useMutation({
    mutationFn: async ({ tipoAlerta, ativo }: { tipoAlerta: string; ativo: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("preferencias_telegram")
        .upsert(
          { user_id: user.id, tipo_alerta: tipoAlerta, ativo },
          { onConflict: "user_id,tipo_alerta" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-prefs"] });
    },
  });

  const isConectado = !!config;
  const getPreferenciaTelegram = (tipoAlerta: string): boolean => {
    return preferencias[tipoAlerta] ?? false;
  };

  return {
    config,
    isConectado,
    isLoading: isLoadingConfig || isLoadingPrefs,
    vincular,
    desvincular,
    salvarPreferencia,
    getPreferenciaTelegram,
    preferencias,
    configurarWebhook,
  };
}

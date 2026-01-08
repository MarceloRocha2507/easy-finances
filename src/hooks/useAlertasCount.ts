import { useNotificacoes } from "./useNotificacoes";

export function useAlertasCount() {
  const { notificacoes, isLoading } = useNotificacoes();

  // Filter only unread alerts
  const naoLidas = notificacoes.filter((n) => !n.lido);
  
  // Count only danger and warning alerts (important ones)
  const alertasImportantes = naoLidas.filter(
    (a) => a.tipo === "danger" || a.tipo === "warning"
  );

  return {
    total: naoLidas.length,
    importantes: alertasImportantes.length,
    hasDanger: naoLidas.some((a) => a.tipo === "danger"),
    hasWarning: naoLidas.some((a) => a.tipo === "warning"),
    isLoading,
  };
}

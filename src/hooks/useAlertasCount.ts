import { useDashboardCompleto } from "./useDashboardCompleto";

export function useAlertasCount() {
  const { data, isLoading } = useDashboardCompleto();

  const alertas = data?.alertas || [];
  
  // Count only danger and warning alerts (important ones)
  const alertasImportantes = alertas.filter(
    (a) => a.tipo === "danger" || a.tipo === "warning"
  );

  return {
    total: alertas.length,
    importantes: alertasImportantes.length,
    hasDanger: alertas.some((a) => a.tipo === "danger"),
    hasWarning: alertas.some((a) => a.tipo === "warning"),
    isLoading,
  };
}

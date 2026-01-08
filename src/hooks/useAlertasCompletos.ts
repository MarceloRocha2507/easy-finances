import { useDashboardCompleto } from "./useDashboardCompleto";
import { useAlertasTransacoes } from "./useAlertasTransacoes";
import { useAlertasOrcamento } from "./useAlertasOrcamento";
import { useAlertasAcertos } from "./useAlertasAcertos";
import { useAuth } from "./useAuth";
import { usePreferenciasLeitura } from "./usePreferenciasNotificacao";

export type CategoriaAlerta = "cartao" | "transacao" | "meta" | "orcamento" | "acerto" | "economia";

export type AlertaCompleto = {
  id: string;
  tipo: "warning" | "danger" | "info" | "success";
  titulo: string;
  mensagem: string;
  icone: string;
  categoria: CategoriaAlerta;
};

// Prioridade: danger > warning > info > success
const prioridadeTipo: Record<string, number> = {
  danger: 1,
  warning: 2,
  info: 3,
  success: 4,
};

export function useAlertasCompletos() {
  const { user } = useAuth();
  const { data: dashboard, isLoading: loadingDashboard } = useDashboardCompleto();
  const { data: alertasTransacoes, isLoading: loadingTransacoes } = useAlertasTransacoes();
  const { data: alertasOrcamento, isLoading: loadingOrcamento } = useAlertasOrcamento();
  const { data: alertasAcertos, isLoading: loadingAcertos } = useAlertasAcertos();
  const { isAlertaAtivo, isLoading: loadingPreferencias } = usePreferenciasLeitura();

  const isLoading = loadingDashboard || loadingTransacoes || loadingOrcamento || loadingAcertos || loadingPreferencias;

  // Combinar todos os alertas
  const alertasCartoes: AlertaCompleto[] = (dashboard?.alertas || []).map((a) => ({
    ...a,
    categoria: "cartao" as CategoriaAlerta,
  }));

  // Alertas de metas (já vêm do dashboard)
  const alertasMetas: AlertaCompleto[] = [];
  
  if (dashboard?.metas) {
    const hoje = new Date();
    
    dashboard.metas.forEach((meta) => {
      // Meta atingida (≥100%) mas não marcada como concluída
      if (meta.progresso >= 100 && !meta.concluida) {
        alertasMetas.push({
          id: `meta-atingida-${meta.id}`,
          tipo: "success",
          titulo: "🎉 Meta atingida!",
          mensagem: `Parabéns! Você alcançou a meta "${meta.titulo}".`,
          icone: "trophy",
          categoria: "meta",
        });
      }
      // Meta quase completa (90-99%)
      else if (meta.progresso >= 90 && meta.progresso < 100) {
        alertasMetas.push({
          id: `meta-proxima-${meta.id}`,
          tipo: "info",
          titulo: "Quase lá!",
          mensagem: `Meta "${meta.titulo}" está ${meta.progresso.toFixed(0)}% completa.`,
          icone: "target",
          categoria: "meta",
        });
      }

      // Verificar prazo da meta
      if (meta.dataLimite && meta.progresso < 100) {
        const diasRestantes = Math.ceil(
          (meta.dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasRestantes < 0) {
          // Prazo vencido
          alertasMetas.push({
            id: `meta-vencida-${meta.id}`,
            tipo: "warning",
            titulo: "Prazo da meta vencido",
            mensagem: `O prazo para "${meta.titulo}" já passou há ${Math.abs(diasRestantes)} dia(s).`,
            icone: "clock",
            categoria: "meta",
          });
        } else if (diasRestantes <= 7) {
          // Prazo próximo
          alertasMetas.push({
            id: `meta-prazo-${meta.id}`,
            tipo: "info",
            titulo: "Prazo da meta se aproxima",
            mensagem: `"${meta.titulo}" vence em ${diasRestantes} dia(s).`,
            icone: "calendar-clock",
            categoria: "meta",
          });
        }
      }
    });
  }

  // Alertas de economia (baseado no comparativo)
  const alertasEconomia: AlertaCompleto[] = [];
  
  if (dashboard?.comparativo) {
    const { variacao, variacaoPct, tipo } = dashboard.comparativo;
    
    // Aumento significativo nos gastos (>20%)
    if (tipo === "aumento" && variacaoPct > 20) {
      alertasEconomia.push({
        id: "economia-aumento-gastos",
        tipo: "warning",
        titulo: "Gastos aumentaram!",
        mensagem: `Você está gastando ${variacaoPct.toFixed(0)}% a mais que no mês passado.`,
        icone: "trending-up",
        categoria: "economia",
      });
    }
    // Redução nos gastos (>10%)
    else if (tipo === "reducao" && Math.abs(variacaoPct) > 10) {
      alertasEconomia.push({
        id: "economia-reducao-gastos",
        tipo: "success",
        titulo: "Parabéns! Você economizou!",
        mensagem: `Seus gastos reduziram ${Math.abs(variacaoPct).toFixed(0)}% em relação ao mês passado.`,
        icone: "trending-down",
        categoria: "economia",
      });
    }
  }

  // Combinar todos os alertas
  const todosAlertas: AlertaCompleto[] = [
    ...alertasCartoes,
    ...alertasMetas,
    ...(alertasTransacoes || []),
    ...(alertasOrcamento || []),
    ...(alertasAcertos || []),
    ...alertasEconomia,
  ];

  // Filtrar por preferências do usuário
  const alertasFiltrados = todosAlertas.filter((alerta) => isAlertaAtivo(alerta.id));

  // Ordenar por prioridade
  const alertasOrdenados = alertasFiltrados.sort((a, b) => {
    return (prioridadeTipo[a.tipo] || 5) - (prioridadeTipo[b.tipo] || 5);
  });

  // Contar categorias após filtro
  const categoriasContagem = {
    cartao: alertasFiltrados.filter(a => a.categoria === "cartao").length,
    transacao: alertasFiltrados.filter(a => a.categoria === "transacao").length,
    meta: alertasFiltrados.filter(a => a.categoria === "meta").length,
    orcamento: alertasFiltrados.filter(a => a.categoria === "orcamento").length,
    acerto: alertasFiltrados.filter(a => a.categoria === "acerto").length,
    economia: alertasFiltrados.filter(a => a.categoria === "economia").length,
  };

  return {
    data: alertasOrdenados,
    isLoading,
    categorias: categoriasContagem,
  };
}

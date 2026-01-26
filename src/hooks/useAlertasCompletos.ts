import { useMemo } from "react";
import { useDashboardCompleto } from "./useDashboardCompleto";
import { useAlertasTransacoes } from "./useAlertasTransacoes";
import { useAlertasOrcamento } from "./useAlertasOrcamento";
import { useAlertasAcertos } from "./useAlertasAcertos";
import { useAuth } from "./useAuth";

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

  const isLoading = loadingDashboard || loadingTransacoes || loadingOrcamento || loadingAcertos;

  // Memoizar alertas de cartões
  const alertasCartoes = useMemo<AlertaCompleto[]>(() => {
    return (dashboard?.alertas || []).map((a) => ({
      ...a,
      categoria: "cartao" as CategoriaAlerta,
    }));
  }, [dashboard?.alertas]);

  // Memoizar alertas de metas
  const alertasMetas = useMemo<AlertaCompleto[]>(() => {
    const metas: AlertaCompleto[] = [];
    
    if (!dashboard?.metas) return metas;

    const hoje = new Date();
    
    dashboard.metas.forEach((meta) => {
      // Meta atingida (≥100%) mas não marcada como concluída
      if (meta.progresso >= 100 && !meta.concluida) {
        metas.push({
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
        metas.push({
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
          metas.push({
            id: `meta-vencida-${meta.id}`,
            tipo: "warning",
            titulo: "Prazo da meta vencido",
            mensagem: `O prazo para "${meta.titulo}" já passou há ${Math.abs(diasRestantes)} dia(s).`,
            icone: "clock",
            categoria: "meta",
          });
        } else if (diasRestantes <= 7) {
          // Prazo próximo
          metas.push({
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

    return metas;
  }, [dashboard?.metas]);

  // Memoizar alertas de economia
  const alertasEconomia = useMemo<AlertaCompleto[]>(() => {
    const economia: AlertaCompleto[] = [];
    
    if (!dashboard?.comparativo) return economia;

    const { variacaoPct, tipo } = dashboard.comparativo;
    
    // Aumento significativo nos gastos (>20%)
    if (tipo === "aumento" && variacaoPct > 20) {
      economia.push({
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
      economia.push({
        id: "economia-reducao-gastos",
        tipo: "success",
        titulo: "Parabéns! Você economizou!",
        mensagem: `Seus gastos reduziram ${Math.abs(variacaoPct).toFixed(0)}% em relação ao mês passado.`,
        icone: "trending-down",
        categoria: "economia",
      });
    }

    return economia;
  }, [dashboard?.comparativo]);

  // Memoizar ordenação de todos os alertas
  const alertasOrdenados = useMemo(() => {
    const todosAlertas: AlertaCompleto[] = [
      ...alertasCartoes,
      ...alertasMetas,
      ...(alertasTransacoes || []),
      ...(alertasOrcamento || []),
      ...(alertasAcertos || []),
      ...alertasEconomia,
    ];

    return todosAlertas.sort((a, b) => {
      return (prioridadeTipo[a.tipo] || 5) - (prioridadeTipo[b.tipo] || 5);
    });
  }, [alertasCartoes, alertasMetas, alertasTransacoes, alertasOrcamento, alertasAcertos, alertasEconomia]);

  // Memoizar contagem de categorias
  const categoriasContagem = useMemo(() => ({
    cartao: alertasCartoes.length,
    transacao: (alertasTransacoes || []).length,
    meta: alertasMetas.length,
    orcamento: (alertasOrcamento || []).length,
    acerto: (alertasAcertos || []).length,
    economia: alertasEconomia.length,
  }), [alertasCartoes.length, alertasTransacoes, alertasMetas.length, alertasOrcamento, alertasAcertos, alertasEconomia.length]);

  return {
    data: alertasOrdenados,
    isLoading,
    categorias: categoriasContagem,
  };
}

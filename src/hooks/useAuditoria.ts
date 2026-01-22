import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FiltrosAuditoria {
  dataInicio?: Date;
  dataFim?: Date;
  tabela?: string;
  acao?: string;
  pagina: number;
  porPagina: number;
}

export interface RegistroAuditoria {
  id: string;
  user_id: string;
  tabela: string;
  registro_id: string;
  acao: string;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  created_at: string;
}

export interface EstatisticasAuditoria {
  total: number;
  insercoes: number;
  atualizacoes: number;
  exclusoes: number;
}

export function useAuditoria(filtros: FiltrosAuditoria) {
  return useQuery({
    queryKey: ["auditoria", filtros],
    queryFn: async () => {
      let query = supabase
        .from("auditoria_cartao")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filtros.dataInicio) {
        query = query.gte("created_at", filtros.dataInicio.toISOString());
      }
      if (filtros.dataFim) {
        const fimDoDia = new Date(filtros.dataFim);
        fimDoDia.setHours(23, 59, 59, 999);
        query = query.lte("created_at", fimDoDia.toISOString());
      }
      if (filtros.tabela && filtros.tabela !== "todas") {
        query = query.eq("tabela", filtros.tabela);
      }
      if (filtros.acao && filtros.acao !== "todas") {
        query = query.eq("acao", filtros.acao);
      }

      const from = filtros.pagina * filtros.porPagina;
      query = query.range(from, from + filtros.porPagina - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      return {
        registros: (data || []) as RegistroAuditoria[],
        total: count || 0,
      };
    },
  });
}

export function useEstatisticasAuditoria() {
  return useQuery({
    queryKey: ["auditoria-estatisticas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria_cartao")
        .select("acao");

      if (error) throw error;

      const estatisticas: EstatisticasAuditoria = {
        total: data?.length || 0,
        insercoes: data?.filter((r) => r.acao === "INSERT").length || 0,
        atualizacoes: data?.filter((r) => r.acao === "UPDATE").length || 0,
        exclusoes: data?.filter((r) => r.acao === "DELETE").length || 0,
      };

      return estatisticas;
    },
  });
}

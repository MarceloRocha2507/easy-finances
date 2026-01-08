import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TipoPlano = "teste" | "mensal" | "anual" | "ilimitado";

export interface PlanLimits {
  cartoes: number;
  metas: number;
  categorias: number;
  transacoesMes: number;
  responsaveis: number;
}

const PLAN_LIMITS: Record<TipoPlano, PlanLimits> = {
  teste: {
    cartoes: 2,
    metas: 3,
    categorias: 10,
    transacoesMes: 50,
    responsaveis: 1,
  },
  mensal: {
    cartoes: 5,
    metas: 10,
    categorias: 20,
    transacoesMes: 200,
    responsaveis: 5,
  },
  anual: {
    cartoes: 10,
    metas: 25,
    categorias: 50,
    transacoesMes: 500,
    responsaveis: 10,
  },
  ilimitado: {
    cartoes: Infinity,
    metas: Infinity,
    categorias: Infinity,
    transacoesMes: Infinity,
    responsaveis: Infinity,
  },
};

export interface ResourceUsage {
  cartoes: number;
  metas: number;
  categorias: number;
  transacoesMes: number;
  responsaveis: number;
}

export function usePlanLimits() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const tipoPlano = (profile?.tipo_plano as TipoPlano) || "teste";
  const limits = PLAN_LIMITS[tipoPlano] || PLAN_LIMITS.teste;

  const { data: usage, isLoading } = useQuery({
    queryKey: ["resource-usage", user?.id],
    queryFn: async (): Promise<ResourceUsage> => {
      if (!user?.id) {
        return { cartoes: 0, metas: 0, categorias: 0, transacoesMes: 0, responsaveis: 0 };
      }

      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const [cartoesRes, metasRes, categoriasRes, transacoesRes, responsaveisRes] = await Promise.all([
        supabase.from("cartoes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("metas").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("date", startOfMonth.toISOString().split("T")[0])
          .lte("date", endOfMonth.toISOString().split("T")[0]),
        supabase.from("responsaveis").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      return {
        cartoes: cartoesRes.count ?? 0,
        metas: metasRes.count ?? 0,
        categorias: categoriasRes.count ?? 0,
        transacoesMes: transacoesRes.count ?? 0,
        responsaveis: responsaveisRes.count ?? 0,
      };
    },
    enabled: !!user?.id,
  });

  const currentUsage: ResourceUsage = usage || {
    cartoes: 0,
    metas: 0,
    categorias: 0,
    transacoesMes: 0,
    responsaveis: 0,
  };

  const canCreate = (resource: keyof PlanLimits): boolean => {
    return currentUsage[resource] < limits[resource];
  };

  const getRemaining = (resource: keyof PlanLimits): number => {
    const remaining = limits[resource] - currentUsage[resource];
    return remaining === Infinity ? Infinity : Math.max(0, remaining);
  };

  const isLimitReached = (resource: keyof PlanLimits): boolean => {
    return currentUsage[resource] >= limits[resource];
  };

  const getUsageText = (resource: keyof PlanLimits): string => {
    if (limits[resource] === Infinity) {
      return `${currentUsage[resource]} (ilimitado)`;
    }
    return `${currentUsage[resource]}/${limits[resource]}`;
  };

  const getUsagePercentage = (resource: keyof PlanLimits): number => {
    if (limits[resource] === Infinity) return 0;
    return Math.min(100, (currentUsage[resource] / limits[resource]) * 100);
  };

  return {
    tipoPlano,
    limits,
    usage: currentUsage,
    isLoading,
    canCreate,
    getRemaining,
    isLimitReached,
    getUsageText,
    getUsagePercentage,
  };
}

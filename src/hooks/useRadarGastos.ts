import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAssinaturas } from "@/hooks/useAssinaturas";
import { toast } from "sonner";

export type FrequenciaEstimada = "semanal" | "mensal" | "trimestral" | "anual";

export interface DeteccaoRadar {
  descricao: string;
  valorMedio: number;
  frequenciaEstimada: FrequenciaEstimada;
  totalOcorrencias: number;
  custoAnualEstimado: number;
  ultimaData: string;
  totalGasto12Meses: number;
}

const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

const valorSimilar = (min: number, max: number) =>
  max > 0 && (max - min) / max <= 0.05;

const estimarFrequencia = (dates: string[]): FrequenciaEstimada => {
  if (dates.length < 2) return "mensal";
  const sorted = [...dates].sort();
  const first = new Date(sorted[0] + "T12:00:00").getTime();
  const last = new Date(sorted[sorted.length - 1] + "T12:00:00").getTime();
  const avgDays = (last - first) / (1000 * 60 * 60 * 24) / (sorted.length - 1);
  if (avgDays <= 10) return "semanal";
  if (avgDays <= 45) return "mensal";
  if (avgDays <= 120) return "trimestral";
  return "anual";
};

const multiplicadorAnual: Record<FrequenciaEstimada, number> = {
  semanal: 52,
  mensal: 12,
  trimestral: 4,
  anual: 1,
};

export function useRadarGastos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { assinaturas } = useAssinaturas();

  // Fetch ignored patterns
  const ignoradosQuery = useQuery({
    queryKey: ["radar-ignorados", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("radar_ignorados" as any)
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!user,
  });

  // Fetch 12 months of expense transactions
  const transacoesQuery = useQuery({
    queryKey: ["radar-transacoes", user?.id],
    queryFn: async () => {
      const dozeAtras = new Date();
      dozeAtras.setMonth(dozeAtras.getMonth() - 12);
      const startDate = dozeAtras.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("transactions")
        .select("description, amount, date")
        .eq("user_id", user!.id)
        .eq("type", "expense")
        .eq("status", "completed")
        .gte("date", startDate)
        .not("description", "is", null);
      if (error) throw error;
      return (data ?? []) as Array<{ description: string | null; amount: number; date: string }>;
    },
    enabled: !!user,
  });

  const ignorados = ignoradosQuery.data ?? [];
  const transacoes = transacoesQuery.data ?? [];

  const deteccoes = useMemo<DeteccaoRadar[]>(() => {
    if (!transacoes.length) return [];

    const ignoradosSet = new Set(ignorados.map((i: any) => normalize(i.descricao_pattern)));
    const assinaturasNomes = assinaturas.map((a) => normalize(a.nome));

    // Group by normalized description
    const groups = new Map<string, Array<{ amount: number; date: string }>>();
    for (const t of transacoes) {
      if (!t.description) continue;
      const key = normalize(t.description);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ amount: Number(t.amount), date: t.date });
    }

    const result: DeteccaoRadar[] = [];

    for (const [desc, items] of groups) {
      if (items.length < 2) continue;

      // Check ignored
      if (ignoradosSet.has(desc)) continue;

      // Check already registered as subscription
      if (assinaturasNomes.some((nome) => desc.includes(nome) || nome.includes(desc))) continue;

      // Check value similarity
      const values = items.map((i) => i.amount);
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (!valorSimilar(min, max)) continue;

      const valorMedio = values.reduce((s, v) => s + v, 0) / values.length;
      const dates = items.map((i) => i.date);
      const frequencia = estimarFrequencia(dates);
      const totalGasto = values.reduce((s, v) => s + v, 0);
      const ultimaData = [...dates].sort().pop()!;

      result.push({
        descricao: items[0] ? transacoes.find((t) => t.description && normalize(t.description) === desc)?.description || desc : desc,
        valorMedio,
        frequenciaEstimada: frequencia,
        totalOcorrencias: items.length,
        custoAnualEstimado: valorMedio * multiplicadorAnual[frequencia],
        ultimaData,
        totalGasto12Meses: totalGasto,
      });
    }

    return result.sort((a, b) => b.custoAnualEstimado - a.custoAnualEstimado);
  }, [transacoes, ignorados, assinaturas]);

  const ignorar = useMutation({
    mutationFn: async (descricao: string) => {
      const { error } = await supabase
        .from("radar_ignorados" as any)
        .insert({ user_id: user!.id, descricao_pattern: normalize(descricao) } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radar-ignorados"] });
      toast.success("Item ignorado com sucesso");
    },
    onError: () => toast.error("Erro ao ignorar item"),
  });

  const analisarAgora = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["radar-transacoes"] });
    queryClient.invalidateQueries({ queryKey: ["radar-ignorados"] });
    toast.success("Análise atualizada");
  }, [queryClient]);

  return {
    deteccoes,
    totalDetectados: deteccoes.length,
    isLoading: transacoesQuery.isLoading || ignoradosQuery.isLoading,
    ignorar,
    analisarAgora,
  };
}

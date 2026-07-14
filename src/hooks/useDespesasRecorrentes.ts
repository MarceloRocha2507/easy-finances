import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DespesaRecorrente,
  DespesaRecorrenteInput,
  estenderHorizonteSeNecessario,
  gerarOcorrenciasParaRecorrencia,
  regenerarFuturasComNovoModelo,
  removerOcorrenciasFuturasPendentes,
} from "@/services/despesas-recorrentes";
import { addMonths } from "date-fns";

const INVALIDATE = [
  ["despesas-recorrentes"],
  ["transactions"],
  ["transaction-stats"],
  ["complete-stats"],
  ["dashboard-completo"],
  ["compras-cartao"],
  ["cartoes"],
  ["parcelas-fatura"],
];

export function useDespesasRecorrentes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const invalidate = () => INVALIDATE.forEach((k) => qc.invalidateQueries({ queryKey: k }));

  const query = useQuery<DespesaRecorrente[]>({
    queryKey: ["despesas-recorrentes"],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas_recorrentes")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DespesaRecorrente[];
    },
  });

  // Manutenção automática: ao carregar, estender horizonte das ativas
  useEffect(() => {
    if (!query.data || query.data.length === 0) return;
    (async () => {
      let mudou = false;
      for (const r of query.data!) {
        if (r.status !== "ativa") continue;
        try {
          await estenderHorizonteSeNecessario(r);
          mudou = true;
        } catch (e) {
          console.error("estender horizonte falhou:", e);
        }
      }
      if (mudou) {
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["compras-cartao"] });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.length]);

  const criar = useMutation({
    mutationFn: async (payload: DespesaRecorrenteInput) => {
      const { data, error } = await supabase
        .from("despesas_recorrentes")
        .insert({ ...payload, user_id: user!.id } as any)
        .select("*")
        .single();
      if (error) throw error;
      const rec = data as unknown as DespesaRecorrente;
      const horizonte = addMonths(new Date(), rec.horizonte_geracao_meses || 12);
      await gerarOcorrenciasParaRecorrencia(rec, horizonte);
      return rec;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Recorrência criada e ocorrências geradas");
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao criar recorrência"),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<DespesaRecorrente> & { id: string }) => {
      const { data, error } = await supabase
        .from("despesas_recorrentes")
        .update(payload as any)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const rec = data as unknown as DespesaRecorrente;
      await regenerarFuturasComNovoModelo(rec);
      return rec;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Recorrência atualizada — próximas ocorrências regeneradas");
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao atualizar recorrência"),
  });

  const pausar = useMutation({
    mutationFn: async (r: DespesaRecorrente) => {
      await removerOcorrenciasFuturasPendentes(r);
      const { error } = await supabase
        .from("despesas_recorrentes")
        .update({ status: "pausada" })
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Recorrência pausada");
    },
  });

  const cancelar = useMutation({
    mutationFn: async (r: DespesaRecorrente) => {
      await removerOcorrenciasFuturasPendentes(r);
      const { error } = await supabase
        .from("despesas_recorrentes")
        .update({ status: "cancelada" })
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Recorrência cancelada");
    },
  });

  const reativar = useMutation({
    mutationFn: async (r: DespesaRecorrente) => {
      const { data, error } = await supabase
        .from("despesas_recorrentes")
        .update({ status: "ativa" })
        .eq("id", r.id)
        .select("*")
        .single();
      if (error) throw error;
      const rec = data as unknown as DespesaRecorrente;
      const horizonte = addMonths(new Date(), rec.horizonte_geracao_meses || 12);
      await gerarOcorrenciasParaRecorrencia(rec, horizonte);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Recorrência reativada");
    },
  });

  const excluir = useMutation({
    mutationFn: async (r: DespesaRecorrente) => {
      await removerOcorrenciasFuturasPendentes(r);
      const { error } = await supabase.from("despesas_recorrentes").delete().eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Recorrência excluída (histórico preservado)");
    },
  });

  return {
    recorrentes: query.data ?? [],
    isLoading: query.isLoading,
    criar,
    atualizar,
    pausar,
    cancelar,
    reativar,
    excluir,
  };
}

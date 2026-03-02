import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Assinatura {
  id: string;
  user_id: string;
  nome: string;
  categoria: string;
  valor: number;
  moeda: string;
  frequencia: string;
  data_inicio: string;
  proxima_cobranca: string;
  metodo_pagamento: string;
  status: string;
  observacoes: string | null;
  category_id: string | null;
  data_cancelamento: string | null;
  data_pausa: string | null;
  created_at: string;
  updated_at: string;
  // Campos de vínculo com cartão
  compra_cartao_id: string | null;
  cartao_id_pagamento: string | null;
  data_pagamento: string | null;
  valor_cobrado: number | null;
  vinculo_automatico: boolean;
  // Campo virtual (join)
  cartao_nome?: string;
}

export type AssinaturaInsert = Omit<Assinatura, "id" | "created_at" | "updated_at" | "compra_cartao_id" | "cartao_id_pagamento" | "data_pagamento" | "valor_cobrado" | "vinculo_automatico" | "cartao_nome">;

const INVALIDATE_KEYS = [
  ["assinaturas"],
  ["transactions"],
  ["transaction-stats"],
  ["complete-stats"],
  ["dashboard-completo"],
];

const mesesPorFrequencia: Record<string, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

export function useAssinaturas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    INVALIDATE_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };

  const query = useQuery({
    queryKey: ["assinaturas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("assinaturas")
        .select("*, cartao:cartoes!assinaturas_cartao_id_pagamento_fkey(nome)")
        .eq("user_id", user!.id)
        .order("proxima_cobranca", { ascending: true });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        cartao_nome: a.cartao?.nome || null,
      })) as Assinatura[];
    },
    enabled: !!user,
  });

  const criar = useMutation({
    mutationFn: async (payload: Omit<AssinaturaInsert, "user_id">) => {
      const { error } = await supabase
        .from("assinaturas" as any)
        .insert({ ...payload, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Assinatura criada com sucesso");
    },
    onError: () => toast.error("Erro ao criar assinatura"),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Assinatura> & { id: string }) => {
      const { error } = await supabase
        .from("assinaturas" as any)
        .update(payload as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Assinatura atualizada");
    },
    onError: () => toast.error("Erro ao atualizar assinatura"),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("assinaturas" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Assinatura excluída");
    },
    onError: () => toast.error("Erro ao excluir assinatura"),
  });

  const marcarComoPaga = useMutation({
    mutationFn: async (assinatura: Assinatura) => {
      // 1. Calculate next billing date
      const meses = mesesPorFrequencia[assinatura.frequencia] || 1;
      const novaData = new Date(assinatura.proxima_cobranca + "T12:00:00");
      novaData.setMonth(novaData.getMonth() + meses);
      const novaCobranca = novaData.toISOString().split("T")[0];

      // 2. Update subscription
      const { error: errUpdate } = await supabase
        .from("assinaturas" as any)
        .update({ proxima_cobranca: novaCobranca } as any)
        .eq("id", assinatura.id);
      if (errUpdate) throw errUpdate;

      // 3. Create transaction only if NOT linked to a card purchase
      if (!assinatura.compra_cartao_id) {
        const hoje = new Date().toISOString().split("T")[0];
        const { error: errTx } = await supabase
          .from("transactions")
          .insert({
            user_id: user!.id,
            type: "expense",
            status: "completed",
            amount: assinatura.valor,
            description: `Assinatura - ${assinatura.nome}`,
            category_id: assinatura.category_id,
            date: hoje,
            paid_date: hoje,
          });
        if (errTx) throw errTx;
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Renovação registrada e lançada como despesa");
    },
    onError: () => toast.error("Erro ao registrar pagamento"),
  });

  const pausar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("assinaturas" as any)
        .update({ status: "pausada", data_pausa: new Date().toISOString().split("T")[0] } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Assinatura pausada");
    },
  });

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("assinaturas" as any)
        .update({ status: "cancelada", data_cancelamento: new Date().toISOString().split("T")[0] } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Assinatura cancelada");
    },
  });

  const reativar = useMutation({
    mutationFn: async (assinatura: Assinatura) => {
      const hoje = new Date();
      const proxima = new Date(assinatura.proxima_cobranca + "T12:00:00");
      // If next billing is in the past, recalculate
      while (proxima < hoje) {
        proxima.setMonth(proxima.getMonth() + (mesesPorFrequencia[assinatura.frequencia] || 1));
      }
      const { error } = await supabase
        .from("assinaturas" as any)
        .update({
          status: "ativa",
          data_pausa: null,
          data_cancelamento: null,
          proxima_cobranca: proxima.toISOString().split("T")[0],
        } as any)
        .eq("id", assinatura.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Assinatura reativada");
    },
  });

  return {
    assinaturas: query.data ?? [],
    isLoading: query.isLoading,
    criar,
    atualizar,
    excluir,
    marcarComoPaga,
    pausar,
    cancelar,
    reativar,
  };
}

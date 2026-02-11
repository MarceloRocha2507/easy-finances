import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

/* ======================================================
   TIPOS
====================================================== */

export type Meta = {
  id: string;
  titulo: string;
  valorAlvo: number;
  valorAtual: number;
  dataLimite: Date | null;
  cor: string;
  icone: string;
  progresso: number;
  concluida: boolean;
  createdAt: Date;
};

/* ======================================================
   HELPER: Buscar ou criar categoria de sistema para metas
====================================================== */

async function getOrCreateMetaCategory(
  userId: string,
  type: "expense" | "income"
): Promise<string> {
  const categoryName = type === "expense" ? "Depósito em Meta" : "Retirada de Meta";
  const icon = "piggy-bank";
  const color = type === "expense" ? "#6366f1" : "#22c55e";

  // Buscar categoria existente
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", categoryName)
    .eq("type", type)
    .single();

  if (existing) {
    return existing.id;
  }

  // Criar categoria se não existir
  const { data: newCategory, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: categoryName,
      type,
      icon,
      color,
      is_default: false,
    })
    .select("id")
    .single();

  if (error) throw error;
  return newCategory.id;
}

/* ======================================================
   HOOK: useMetas - Listar todas as metas
====================================================== */

export function useMetas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["metas", user?.id],
    queryFn: async (): Promise<Meta[]> => {
      const { data, error } = await (supabase as any)
        .from("metas")
        .select("*")
        .eq("user_id", user?.id)
        .order("concluida", { ascending: true })
        .order("data_limite", { ascending: true, nullsFirst: false });

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        titulo: m.titulo,
        valorAlvo: Number(m.valor_alvo) || 0,
        valorAtual: Number(m.valor_atual) || 0,
        dataLimite: m.data_limite ? new Date(m.data_limite) : null,
        cor: m.cor || "#6366f1",
        icone: m.icone || "piggy-bank",
        progresso:
          Number(m.valor_alvo) > 0
            ? Math.min((Number(m.valor_atual) / Number(m.valor_alvo)) * 100, 100)
            : 0,
        concluida: m.concluida || false,
        createdAt: new Date(m.created_at),
      }));
    },
    enabled: !!user,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

/* ======================================================
   MUTATION: Criar Meta
====================================================== */

export function useCriarMeta() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      titulo: string;
      valorAlvo: number;
      valorAtual?: number;
      dataLimite?: Date | null;
      cor?: string;
      icone?: string;
    }) => {
      const { error } = await (supabase as any).from("metas").insert({
        user_id: user?.id,
        titulo: data.titulo,
        valor_alvo: data.valorAlvo,
        valor_atual: data.valorAtual || 0,
        data_limite: data.dataLimite
          ? data.dataLimite.toISOString().split("T")[0]
          : null,
        cor: data.cor || "#6366f1",
        icone: data.icone || "piggy-bank",
        concluida: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-completo"] });
      queryClient.invalidateQueries({ queryKey: ["complete-stats"] });
      toast({
        title: "Meta criada!",
        description: "Sua meta de economia foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar meta",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

/* ======================================================
   MUTATION: Atualizar Meta
====================================================== */

export function useAtualizarMeta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      titulo?: string;
      valorAlvo?: number;
      valorAtual?: number;
      dataLimite?: Date | null;
      cor?: string;
      icone?: string;
      concluida?: boolean;
    }) => {
      const updateData: any = {};

      if (data.titulo !== undefined) updateData.titulo = data.titulo;
      if (data.valorAlvo !== undefined) updateData.valor_alvo = data.valorAlvo;
      if (data.valorAtual !== undefined) updateData.valor_atual = data.valorAtual;
      if (data.dataLimite !== undefined) {
        updateData.data_limite = data.dataLimite
          ? data.dataLimite.toISOString().split("T")[0]
          : null;
      }
      if (data.cor !== undefined) updateData.cor = data.cor;
      if (data.icone !== undefined) updateData.icone = data.icone;
      if (data.concluida !== undefined) updateData.concluida = data.concluida;

      updateData.updated_at = new Date().toISOString();

      const { error } = await (supabase as any)
        .from("metas")
        .update(updateData)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-completo"] });
      queryClient.invalidateQueries({ queryKey: ["complete-stats"] });
      toast({
        title: "Meta atualizada!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

/* ======================================================
   MUTATION: Adicionar Valor à Meta (Depósito)
   - Cria transação de despesa para reduzir saldo disponível
====================================================== */

export function useAdicionarValorMeta() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      valor: number;
      valorAtualAnterior: number;
      valorAlvo: number;
      metaTitulo: string;
      saldoDisponivel?: number;
      motivo?: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Validar saldo disponível se fornecido (com tolerância para precisão de ponto flutuante)
      if (data.saldoDisponivel !== undefined) {
        const valorArredondado = parseFloat(data.valor.toFixed(2));
        const saldoArredondado = parseFloat(data.saldoDisponivel.toFixed(2));
        if (valorArredondado > saldoArredondado) {
          throw new Error("Saldo insuficiente para este depósito");
        }
      }

      const novoValor = data.valorAtualAnterior + data.valor;
      const concluida = novoValor >= data.valorAlvo;
      const today = new Date().toISOString().split("T")[0];

      // 1. Buscar ou criar categoria de depósito em meta
      const categoryId = await getOrCreateMetaCategory(user.id, "expense");

      // 2. Atualizar valor da meta
      const { error: metaError } = await (supabase as any)
        .from("metas")
        .update({
          valor_atual: novoValor,
          concluida,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (metaError) throw metaError;

      // 3. Criar transação de despesa (reduz saldo disponível)
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "expense",
        amount: data.valor,
        description: `Depósito na meta: ${data.metaTitulo}`,
        category_id: categoryId,
        status: "completed",
        date: today,
      });

      if (txError) throw txError;

      // 4. Registrar movimentação detalhada
      await (supabase as any).from("movimentacoes_meta").insert({
        user_id: user.id,
        meta_id: data.id,
        tipo: "deposito",
        valor: data.valor,
        saldo_resultante: novoValor,
        motivo: data.motivo || null,
      });

      return { novoValor, concluida };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["historico-meta"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-stats"] });
      queryClient.invalidateQueries({ queryKey: ["complete-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-completo"] });

      if (result.concluida) {
        toast({
          title: "🎉 Parabéns! Meta atingida!",
          description: "Você alcançou sua meta de economia!",
        });
      } else {
        toast({
          title: "Valor adicionado!",
          description: "Seu progresso foi atualizado.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar valor",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

/* ======================================================
   MUTATION: Retirar Valor da Meta
   - Cria transação de receita para aumentar saldo disponível
====================================================== */

export function useRetirarValorMeta() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      valor: number;
      valorAtualAnterior: number;
      metaTitulo: string;
      motivo?: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Validar se há valor suficiente na meta
      if (data.valor > data.valorAtualAnterior) {
        throw new Error("Valor insuficiente na meta para esta retirada");
      }

      const novoValor = Math.max(data.valorAtualAnterior - data.valor, 0);
      const today = new Date().toISOString().split("T")[0];

      // 1. Buscar ou criar categoria de retirada de meta
      const categoryId = await getOrCreateMetaCategory(user.id, "income");

      // 2. Atualizar valor da meta
      const { error: metaError } = await (supabase as any)
        .from("metas")
        .update({
          valor_atual: novoValor,
          concluida: false, // Retirada sempre "reabre" a meta
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (metaError) throw metaError;

      // 3. Criar transação de receita (aumenta saldo disponível)
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "income",
        amount: data.valor,
        description: `Retirada da meta: ${data.metaTitulo}`,
        category_id: categoryId,
        status: "completed",
        date: today,
      });

      if (txError) throw txError;

      // 4. Registrar movimentação detalhada
      await (supabase as any).from("movimentacoes_meta").insert({
        user_id: user.id,
        meta_id: data.id,
        tipo: "retirada",
        valor: data.valor,
        saldo_resultante: novoValor,
        motivo: data.motivo || null,
      });

      return { novoValor };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["historico-meta"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-stats"] });
      queryClient.invalidateQueries({ queryKey: ["complete-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-completo"] });

      toast({
        title: "Valor retirado!",
        description: "O valor foi devolvido ao seu saldo disponível.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao retirar valor",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

/* ======================================================
   MUTATION: Excluir Meta
====================================================== */

export function useExcluirMeta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("metas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-completo"] });
      queryClient.invalidateQueries({ queryKey: ["complete-stats"] });
      toast({
        title: "Meta excluída",
        description: "A meta foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });
}
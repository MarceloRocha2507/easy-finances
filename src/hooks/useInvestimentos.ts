import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Investimento {
  id: string;
  userId: string;
  nome: string;
  tipo: string;
  instituicao: string | null;
  valorInicial: number;
  valorAtual: number;
  rentabilidadeAnual: number | null;
  dataInicio: string;
  dataVencimento: string | null;
  cor: string;
  icone: string;
  ativo: boolean;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MovimentacaoInvestimento {
  id: string;
  investimentoId: string;
  userId: string;
  tipo: "aporte" | "resgate" | "rendimento";
  valor: number;
  data: string;
  observacao: string | null;
  createdAt: string;
}

export const TIPOS_INVESTIMENTO = [
  { value: "poupanca", label: "Poupança", icon: "piggy-bank", cor: "#22c55e" },
  { value: "cdb", label: "CDB", icon: "landmark", cor: "#3b82f6" },
  { value: "lci", label: "LCI", icon: "building-2", cor: "#14b8a6" },
  { value: "lca", label: "LCA", icon: "building-2", cor: "#0d9488" },
  { value: "tesouro", label: "Tesouro Direto", icon: "building", cor: "#8b5cf6" },
  { value: "acoes", label: "Ações", icon: "trending-up", cor: "#f59e0b" },
  { value: "fundos", label: "Fundos", icon: "layers", cor: "#ec4899" },
  { value: "cripto", label: "Criptomoedas", icon: "bitcoin", cor: "#f97316" },
  { value: "outros", label: "Outros", icon: "wallet", cor: "#6366f1" },
];

export function useInvestimentos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["investimentos", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("investimentos")
        .select("*")
        .eq("user_id", user.id)
        .order("ativo", { ascending: false })
        .order("nome", { ascending: true });

      if (error) throw error;

      return (data || []).map((inv): Investimento => ({
        id: inv.id,
        userId: inv.user_id,
        nome: inv.nome,
        tipo: inv.tipo,
        instituicao: inv.instituicao,
        valorInicial: Number(inv.valor_inicial),
        valorAtual: Number(inv.valor_atual),
        rentabilidadeAnual: inv.rentabilidade_anual ? Number(inv.rentabilidade_anual) : null,
        dataInicio: inv.data_inicio,
        dataVencimento: inv.data_vencimento,
        cor: inv.cor,
        icone: inv.icone,
        ativo: inv.ativo,
        observacao: inv.observacao,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
      }));
    },
    enabled: !!user?.id,
  });
}

export function useMovimentacoesInvestimento(investimentoId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["movimentacoes-investimento", investimentoId],
    queryFn: async () => {
      if (!user?.id || !investimentoId) return [];

      const { data, error } = await supabase
        .from("movimentacoes_investimento")
        .select("*")
        .eq("investimento_id", investimentoId)
        .order("data", { ascending: false });

      if (error) throw error;

      return (data || []).map((mov): MovimentacaoInvestimento => ({
        id: mov.id,
        investimentoId: mov.investimento_id,
        userId: mov.user_id,
        tipo: mov.tipo as "aporte" | "resgate" | "rendimento",
        valor: Number(mov.valor),
        data: mov.data,
        observacao: mov.observacao,
        createdAt: mov.created_at,
      }));
    },
    enabled: !!user?.id && !!investimentoId,
  });
}

interface CriarInvestimentoInput {
  nome: string;
  tipo: string;
  instituicao?: string;
  valorInicial: number;
  rentabilidadeAnual?: number;
  dataInicio: Date;
  dataVencimento?: Date;
  cor: string;
  icone: string;
  observacao?: string;
}

export function useCriarInvestimento() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CriarInvestimentoInput) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Criar investimento
      const { data: investimento, error: invError } = await supabase
        .from("investimentos")
        .insert({
          user_id: user.id,
          nome: input.nome,
          tipo: input.tipo,
          instituicao: input.instituicao || null,
          valor_inicial: input.valorInicial,
          valor_atual: input.valorInicial,
          rentabilidade_anual: input.rentabilidadeAnual || null,
          data_inicio: input.dataInicio.toISOString().split("T")[0],
          data_vencimento: input.dataVencimento?.toISOString().split("T")[0] || null,
          cor: input.cor,
          icone: input.icone,
          observacao: input.observacao || null,
        })
        .select()
        .single();

      if (invError) throw invError;

      // Criar movimentação inicial (aporte)
      if (input.valorInicial > 0) {
        const { error: movError } = await supabase
          .from("movimentacoes_investimento")
          .insert({
            investimento_id: investimento.id,
            user_id: user.id,
            tipo: "aporte",
            valor: input.valorInicial,
            data: input.dataInicio.toISOString().split("T")[0],
            observacao: "Aporte inicial",
          });

        if (movError) throw movError;
      }

      return investimento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investimentos"] });
      toast.success("Investimento criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar investimento:", error);
      toast.error("Erro ao criar investimento");
    },
  });
}

interface AtualizarInvestimentoInput {
  id: string;
  nome?: string;
  tipo?: string;
  instituicao?: string | null;
  rentabilidadeAnual?: number | null;
  dataVencimento?: Date | null;
  cor?: string;
  icone?: string;
  ativo?: boolean;
  observacao?: string | null;
}

export function useAtualizarInvestimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AtualizarInvestimentoInput) => {
      const updateData: Record<string, unknown> = {};

      if (input.nome !== undefined) updateData.nome = input.nome;
      if (input.tipo !== undefined) updateData.tipo = input.tipo;
      if (input.instituicao !== undefined) updateData.instituicao = input.instituicao;
      if (input.rentabilidadeAnual !== undefined) updateData.rentabilidade_anual = input.rentabilidadeAnual;
      if (input.dataVencimento !== undefined) {
        updateData.data_vencimento = input.dataVencimento?.toISOString().split("T")[0] || null;
      }
      if (input.cor !== undefined) updateData.cor = input.cor;
      if (input.icone !== undefined) updateData.icone = input.icone;
      if (input.ativo !== undefined) updateData.ativo = input.ativo;
      if (input.observacao !== undefined) updateData.observacao = input.observacao;

      const { error } = await supabase
        .from("investimentos")
        .update(updateData)
        .eq("id", input.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investimentos"] });
      toast.success("Investimento atualizado!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar investimento:", error);
      toast.error("Erro ao atualizar investimento");
    },
  });
}

export function useExcluirInvestimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("investimentos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investimentos"] });
      toast.success("Investimento excluído!");
    },
    onError: (error) => {
      console.error("Erro ao excluir investimento:", error);
      toast.error("Erro ao excluir investimento");
    },
  });
}

interface CriarMovimentacaoInput {
  investimentoId: string;
  tipo: "aporte" | "resgate" | "rendimento";
  valor: number;
  data: Date;
  observacao?: string;
}

export function useCriarMovimentacao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CriarMovimentacaoInput) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Buscar investimento atual
      const { data: investimento, error: fetchError } = await supabase
        .from("investimentos")
        .select("valor_atual")
        .eq("id", input.investimentoId)
        .single();

      if (fetchError) throw fetchError;

      // Calcular novo valor
      let novoValor = Number(investimento.valor_atual);
      if (input.tipo === "aporte" || input.tipo === "rendimento") {
        novoValor += input.valor;
      } else if (input.tipo === "resgate") {
        novoValor -= input.valor;
        if (novoValor < 0) novoValor = 0;
      }

      // Criar movimentação
      const { error: movError } = await supabase
        .from("movimentacoes_investimento")
        .insert({
          investimento_id: input.investimentoId,
          user_id: user.id,
          tipo: input.tipo,
          valor: input.valor,
          data: input.data.toISOString().split("T")[0],
          observacao: input.observacao || null,
        });

      if (movError) throw movError;

      // Atualizar valor do investimento
      const updateData: Record<string, unknown> = { valor_atual: novoValor };
      
      // Se o valor zerou, marcar como inativo
      if (novoValor === 0 && input.tipo === "resgate") {
        updateData.ativo = false;
      }

      const { error: updateError } = await supabase
        .from("investimentos")
        .update(updateData)
        .eq("id", input.investimentoId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["investimentos"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes-investimento", variables.investimentoId] });
      
      const mensagens = {
        aporte: "Aporte registrado com sucesso!",
        resgate: "Resgate registrado com sucesso!",
        rendimento: "Rendimento registrado com sucesso!",
      };
      toast.success(mensagens[variables.tipo]);
    },
    onError: (error) => {
      console.error("Erro ao criar movimentação:", error);
      toast.error("Erro ao registrar movimentação");
    },
  });
}

export function useExcluirMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, investimentoId }: { id: string; investimentoId: string }) => {
      // Buscar movimentação para reverter valor
      const { data: movimentacao, error: fetchMovError } = await supabase
        .from("movimentacoes_investimento")
        .select("tipo, valor")
        .eq("id", id)
        .single();

      if (fetchMovError) throw fetchMovError;

      // Buscar valor atual do investimento
      const { data: investimento, error: fetchInvError } = await supabase
        .from("investimentos")
        .select("valor_atual")
        .eq("id", investimentoId)
        .single();

      if (fetchInvError) throw fetchInvError;

      // Reverter valor
      let novoValor = Number(investimento.valor_atual);
      if (movimentacao.tipo === "aporte" || movimentacao.tipo === "rendimento") {
        novoValor -= Number(movimentacao.valor);
        if (novoValor < 0) novoValor = 0;
      } else if (movimentacao.tipo === "resgate") {
        novoValor += Number(movimentacao.valor);
      }

      // Deletar movimentação
      const { error: deleteError } = await supabase
        .from("movimentacoes_investimento")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      // Atualizar valor do investimento
      const { error: updateError } = await supabase
        .from("investimentos")
        .update({ valor_atual: novoValor })
        .eq("id", investimentoId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["investimentos"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes-investimento", variables.investimentoId] });
      toast.success("Movimentação excluída!");
    },
    onError: (error) => {
      console.error("Erro ao excluir movimentação:", error);
      toast.error("Erro ao excluir movimentação");
    },
  });
}

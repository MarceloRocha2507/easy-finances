import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompleteStats } from "@/hooks/useTransactions";
import { toast } from "sonner";
import { addMonths, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export type FormaPagamento = "a_vista" | "parcelado_cartao" | "boleto_parcelado";

export interface DadosSimulacao {
  nome: string;
  valorTotal: number;
  formaPagamento: FormaPagamento;
  parcelas: number;
  cartaoId: string | null;
  categoryId: string | null;
  dataPrevista: Date;
  valorSeguranca: number;
}

export interface ProjecaoMes {
  mes: string;
  mesLabel: string;
  receitasPrevistas: number;
  despesasPrevistas: number;
  parcelaCompra: number;
  saldoSemCompra: number;
  saldoComCompra: number;
}

export interface SimulacaoSalva {
  id: string;
  nome: string;
  valor_total: number;
  forma_pagamento: string;
  parcelas: number;
  cartao_id: string | null;
  category_id: string | null;
  data_prevista: string;
  valor_seguranca: number;
  veredicto: string | null;
  created_at: string;
}

export function useSimuladorCompra() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: completeStats } = useCompleteStats();
  const [projecao, setProjecao] = useState<ProjecaoMes[] | null>(null);

  // Fetch recurring transactions
  const { data: recorrentes } = useQuery({
    queryKey: ["transacoes-recorrentes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, tipo_lancamento, category_id")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .eq("tipo_lancamento", "fixa");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch active subscriptions
  const { data: assinaturas } = useQuery({
    queryKey: ["assinaturas-simulador", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assinaturas" as any)
        .select("valor, frequencia")
        .eq("user_id", user!.id)
        .eq("status", "ativa");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Fetch pending future transactions
  const { data: despesasFuturas } = useQuery({
    queryKey: ["despesas-futuras-simulador", user?.id],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const limite = format(addMonths(new Date(), 12), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, due_date")
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .gte("due_date", hoje)
        .lte("due_date", limite);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Saved simulations
  const { data: simulacoesSalvas = [], isLoading: isLoadingSalvas } = useQuery({
    queryKey: ["simulacoes-compra", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulacoes_compra" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as SimulacaoSalva[];
    },
    enabled: !!user,
  });

  const mesesPorFrequencia: Record<string, number> = {
    mensal: 1,
    trimestral: 3,
    semestral: 6,
    anual: 12,
  };

  const calcularProjecao = useCallback(
    (dados: DadosSimulacao): ProjecaoMes[] => {
      const saldoAtual = completeStats?.saldoDisponivel || 0;

      // Recurring monthly income/expense
      const receitaRecorrente = (recorrentes || [])
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + Number(t.amount), 0);

      const despesaRecorrente = (recorrentes || [])
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0);

      // Normalized monthly subscriptions
      const totalAssinaturas = (assinaturas || []).reduce((s, a) => {
        const meses = mesesPorFrequencia[a.frequencia] || 1;
        return s + Number(a.valor) / meses;
      }, 0);

      // Group future expenses by month
      const futurasPorMes: Record<string, number> = {};
      (despesasFuturas || []).forEach((t) => {
        if (t.due_date) {
          const mesKey = t.due_date.substring(0, 7);
          const amount = Number(t.amount) * (t.type === "expense" ? 1 : -1);
          futurasPorMes[mesKey] = (futurasPorMes[mesKey] || 0) + amount;
        }
      });

      // Calculate installment per month
      const valorParcela =
        dados.formaPagamento === "a_vista"
          ? dados.valorTotal
          : dados.valorTotal / dados.parcelas;

      const mesCompra = startOfMonth(dados.dataPrevista);

      const resultado: ProjecaoMes[] = [];
      let saldoAnteriorSem = saldoAtual;
      let saldoAnteriorCom = saldoAtual;

      for (let i = 0; i < 12; i++) {
        const mesDate = addMonths(new Date(), i);
        const mesKey = format(mesDate, "yyyy-MM");
        const mesLabel = format(mesDate, "MMM/yy", { locale: ptBR });

        const receitas = receitaRecorrente;
        const despesas =
          despesaRecorrente + totalAssinaturas + (futurasPorMes[mesKey] || 0);

        let parcelaCompra = 0;
        if (dados.formaPagamento === "a_vista") {
          const mesCompraKey = format(mesCompra, "yyyy-MM");
          if (mesKey === mesCompraKey) parcelaCompra = dados.valorTotal;
        } else {
          const mesInicio = startOfMonth(mesCompra);
          const mesFim = addMonths(mesInicio, dados.parcelas);
          if (mesDate >= mesInicio && mesDate < mesFim) {
            parcelaCompra = valorParcela;
          }
        }

        const saldoSemCompra = saldoAnteriorSem + receitas - despesas;
        const saldoComCompra =
          saldoAnteriorCom + receitas - despesas - parcelaCompra;

        resultado.push({
          mes: mesKey,
          mesLabel,
          receitasPrevistas: receitas,
          despesasPrevistas: despesas,
          parcelaCompra,
          saldoSemCompra,
          saldoComCompra,
        });

        saldoAnteriorSem = saldoSemCompra;
        saldoAnteriorCom = saldoComCompra;
      }

      setProjecao(resultado);
      return resultado;
    },
    [completeStats, recorrentes, assinaturas, despesasFuturas]
  );

  const salvarSimulacao = useMutation({
    mutationFn: async (dados: DadosSimulacao & { veredicto?: string }) => {
      const { error } = await supabase
        .from("simulacoes_compra" as any)
        .insert({
          user_id: user!.id,
          nome: dados.nome,
          valor_total: dados.valorTotal,
          forma_pagamento: dados.formaPagamento,
          parcelas: dados.parcelas,
          cartao_id: dados.cartaoId,
          category_id: dados.categoryId,
          data_prevista: format(dados.dataPrevista, "yyyy-MM-dd"),
          valor_seguranca: dados.valorSeguranca,
          veredicto: dados.veredicto || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulacoes-compra"] });
      toast.success("Simulação salva com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar simulação"),
  });

  const excluirSimulacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("simulacoes_compra" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulacoes-compra"] });
      toast.success("Simulação excluída");
    },
    onError: () => toast.error("Erro ao excluir simulação"),
  });

  const lancarComoDespesa = useMutation({
    mutationFn: async (dados: DadosSimulacao) => {
      if (dados.formaPagamento === "a_vista") {
        const { error } = await supabase.from("transactions").insert({
          user_id: user!.id,
          type: "expense",
          status: "pending",
          amount: dados.valorTotal,
          description: dados.nome,
          category_id: dados.categoryId,
          due_date: format(dados.dataPrevista, "yyyy-MM-dd"),
          tipo_lancamento: "unica",
        });
        if (error) throw error;
      } else {
        const parcelas = [];
        for (let i = 0; i < dados.parcelas; i++) {
          const dueDate = addMonths(dados.dataPrevista, i);
          parcelas.push({
            user_id: user!.id,
            type: "expense" as const,
            status: "pending",
            amount: dados.valorTotal / dados.parcelas,
            description: `${dados.nome} (${i + 1}/${dados.parcelas})`,
            category_id: dados.categoryId,
            due_date: format(dueDate, "yyyy-MM-dd"),
            tipo_lancamento: "parcelada",
            numero_parcela: i + 1,
            total_parcelas: dados.parcelas,
          });
        }
        const { error } = await supabase
          .from("transactions")
          .insert(parcelas);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["complete-stats"] });
      toast.success("Compra lançada como despesa futura!");
    },
    onError: () => toast.error("Erro ao lançar despesa"),
  });

  return {
    projecao,
    calcularProjecao,
    salvarSimulacao,
    excluirSimulacao,
    lancarComoDespesa,
    simulacoesSalvas,
    isLoadingSalvas,
    saldoAtual: completeStats?.saldoDisponivel || 0,
  };
}

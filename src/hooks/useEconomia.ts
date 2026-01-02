import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

/* ======================================================
   TIPOS
====================================================== */

export type GastoCategoria = {
  categoriaId: string;
  categoriaNome: string;
  categoriaIcone: string;
  categoriaCor: string;
  total: number;
  quantidade: number;
  percentual: number;
  orcamento?: number;
  percentualOrcamento?: number;
  status: "ok" | "atencao" | "excedido";
};

export type InsightEconomia = {
  id: string;
  tipo: "alerta" | "dica" | "conquista" | "tendencia";
  titulo: string;
  mensagem: string;
  icone: string;
  cor: string;
  acao?: string;
};

export type AnaliseGastos = {
  totalGasto: number;
  totalReceitas: number;
  saldo: number;
  economizado: number;
  gastosPorCategoria: GastoCategoria[];
  topGastos: GastoCategoria[];
  insights: InsightEconomia[];
  mediaDiaria: number;
  previsaoMensal: number;
  comparativoMesAnterior: {
    diferenca: number;
    percentual: number;
    tipo: "aumento" | "reducao" | "igual";
  };
};

export type Orcamento = {
  id: string;
  categoryId: string;
  categoriaNome: string;
  categoriaIcone: string;
  categoriaCor: string;
  valorLimite: number;
  gastoAtual: number;
  percentualUsado: number;
  status: "ok" | "atencao" | "excedido";
  disponivel: number;
};

/* ======================================================
   HELPERS
====================================================== */

function firstDayOfMonth(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function lastDayOfMonth(date: Date): string {
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const yyyy = nextMonth.getFullYear();
  const mm = String(nextMonth.getMonth() + 1).padStart(2, "0");
  const dd = String(nextMonth.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function gerarInsights(
  gastos: GastoCategoria[],
  totalGasto: number,
  totalReceitas: number,
  mediaDiaria: number,
  comparativo: { diferenca: number; percentual: number; tipo: "aumento" | "reducao" | "igual" }
): InsightEconomia[] {
  const insights: InsightEconomia[] = [];

  // 1. Categoria que mais gasta
  if (gastos.length > 0) {
    const topCategoria = gastos[0];
    if (topCategoria.percentual > 40) {
      insights.push({
        id: "top-gasto",
        tipo: "alerta",
        titulo: `${topCategoria.categoriaNome} consome ${topCategoria.percentual.toFixed(0)}% dos gastos`,
        mensagem: `Considere reduzir gastos com ${topCategoria.categoriaNome.toLowerCase()}. Você já gastou R$${topCategoria.total.toFixed(2)} este mês.`,
        icone: "alert-triangle",
        cor: "#f59e0b",
        acao: "Ver detalhes",
      });
    }
  }

  // 2. Orçamento excedido
  const excedidos = gastos.filter((g) => g.status === "excedido");
  if (excedidos.length > 0) {
    insights.push({
      id: "orcamento-excedido",
      tipo: "alerta",
      titulo: `${excedidos.length} categoria(s) acima do orçamento`,
      mensagem: `Você ultrapassou o limite em: ${excedidos.map((e) => e.categoriaNome).join(", ")}.`,
      icone: "alert-circle",
      cor: "#ef4444",
    });
  }

  // 3. Economia do mês
  if (totalReceitas > 0 && totalGasto < totalReceitas) {
    const economizado = totalReceitas - totalGasto;
    const percentualEconomia = (economizado / totalReceitas) * 100;
    
    if (percentualEconomia >= 20) {
      insights.push({
        id: "economia-boa",
        tipo: "conquista",
        titulo: `Parabéns! Você está economizando ${percentualEconomia.toFixed(0)}%`,
        mensagem: `Você já economizou R$${economizado.toFixed(2)} este mês. Continue assim!`,
        icone: "trophy",
        cor: "#22c55e",
      });
    } else if (percentualEconomia >= 10) {
      insights.push({
        id: "economia-ok",
        tipo: "dica",
        titulo: `Você está economizando ${percentualEconomia.toFixed(0)}%`,
        mensagem: `Tente aumentar para 20% para ter uma reserva de emergência mais sólida.`,
        icone: "piggy-bank",
        cor: "#3b82f6",
      });
    }
  }

  // 4. Gastando mais que ganha
  if (totalGasto > totalReceitas && totalReceitas > 0) {
    insights.push({
      id: "gasto-maior-receita",
      tipo: "alerta",
      titulo: "⚠️ Gastos maiores que receitas!",
      mensagem: `Você está gastando R$${(totalGasto - totalReceitas).toFixed(2)} a mais do que ganha. Revise seus gastos urgentemente.`,
      icone: "alert-octagon",
      cor: "#ef4444",
    });
  }

  // 5. Comparativo com mês anterior
  if (comparativo.tipo === "reducao" && Math.abs(comparativo.percentual) >= 10) {
    insights.push({
      id: "reducao-gastos",
      tipo: "conquista",
      titulo: `🎉 Você reduziu ${Math.abs(comparativo.percentual).toFixed(0)}% dos gastos!`,
      mensagem: `Comparado ao mês passado, você economizou R$${Math.abs(comparativo.diferenca).toFixed(2)}. Excelente progresso!`,
      icone: "trending-down",
      cor: "#22c55e",
    });
  } else if (comparativo.tipo === "aumento" && comparativo.percentual >= 20) {
    insights.push({
      id: "aumento-gastos",
      tipo: "tendencia",
      titulo: `Gastos aumentaram ${comparativo.percentual.toFixed(0)}%`,
      mensagem: `Você está gastando R$${comparativo.diferenca.toFixed(2)} a mais que no mês passado. Fique atento!`,
      icone: "trending-up",
      cor: "#f59e0b",
    });
  }

  // 6. Dica baseada na média diária
  const diasRestantes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
  const previsaoRestante = mediaDiaria * diasRestantes;
  
  if (diasRestantes > 5 && previsaoRestante > 0) {
    insights.push({
      id: "previsao",
      tipo: "dica",
      titulo: `Previsão para os próximos ${diasRestantes} dias`,
      mensagem: `Mantendo a média atual de R$${mediaDiaria.toFixed(2)}/dia, você gastará mais R$${previsaoRestante.toFixed(2)} até o fim do mês.`,
      icone: "calculator",
      cor: "#6366f1",
    });
  }

  return insights;
}

/* ======================================================
   HOOK: useAnaliseGastos
====================================================== */

export function useAnaliseGastos(mesReferencia?: Date) {
  const { user } = useAuth();
  const mes = mesReferencia || new Date();

  return useQuery({
    queryKey: ["analise-gastos", user?.id, firstDayOfMonth(mes)],
    queryFn: async (): Promise<AnaliseGastos> => {
      const inicioMes = firstDayOfMonth(mes);
      const fimMes = lastDayOfMonth(mes);
      
      const mesAnterior = new Date(mes.getFullYear(), mes.getMonth() - 1, 1);
      const inicioMesAnterior = firstDayOfMonth(mesAnterior);
      const fimMesAnterior = lastDayOfMonth(mesAnterior);

      // 1. Buscar transações do mês atual
      const { data: transacoes, error: transacoesError } = await supabase
        .from("transactions")
        .select(`
          id, amount, type, date, category_id,
          category:categories(id, name, icon, color)
        `)
        .gte("date", inicioMes)
        .lte("date", fimMes);

      if (transacoesError) throw transacoesError;

      // 2. Buscar transações do mês anterior (para comparativo)
      const { data: transacoesAnteriores } = await supabase
        .from("transactions")
        .select("amount, type")
        .gte("date", inicioMesAnterior)
        .lte("date", fimMesAnterior);

      // 3. Buscar orçamentos do mês
      const { data: orcamentos } = await (supabase as any)
        .from("orcamentos")
        .select("category_id, valor_limite")
        .eq("user_id", user?.id)
        .eq("mes_referencia", inicioMes);

      const orcamentoMap: Record<string, number> = {};
      (orcamentos || []).forEach((o: any) => {
        orcamentoMap[o.category_id] = Number(o.valor_limite);
      });

      // 4. Calcular totais
      let totalGasto = 0;
      let totalReceitas = 0;
      const gastosPorCategoria: Record<string, GastoCategoria> = {};

      (transacoes || []).forEach((t: any) => {
        const valor = Number(t.amount) || 0;
        
        if (t.type === "expense") {
          totalGasto += valor;
          
          const catId = t.category_id || "sem-categoria";
          const cat = t.category as any;
          
          if (!gastosPorCategoria[catId]) {
            gastosPorCategoria[catId] = {
              categoriaId: catId,
              categoriaNome: cat?.name || "Sem categoria",
              categoriaIcone: cat?.icon || "📦",
              categoriaCor: cat?.color || "#6366f1",
              total: 0,
              quantidade: 0,
              percentual: 0,
              orcamento: orcamentoMap[catId],
              status: "ok",
            };
          }
          
          gastosPorCategoria[catId].total += valor;
          gastosPorCategoria[catId].quantidade += 1;
        } else {
          totalReceitas += valor;
        }
      });

      // 5. Calcular percentuais e status
      const listaGastos = Object.values(gastosPorCategoria)
        .map((g) => {
          g.percentual = totalGasto > 0 ? (g.total / totalGasto) * 100 : 0;
          
          if (g.orcamento && g.orcamento > 0) {
            g.percentualOrcamento = (g.total / g.orcamento) * 100;
            
            if (g.percentualOrcamento >= 100) {
              g.status = "excedido";
            } else if (g.percentualOrcamento >= 80) {
              g.status = "atencao";
            }
          }
          
          return g;
        })
        .sort((a, b) => b.total - a.total);

      // 6. Comparativo com mês anterior
      let gastoMesAnterior = 0;
      (transacoesAnteriores || []).forEach((t: any) => {
        if (t.type === "expense") {
          gastoMesAnterior += Number(t.amount) || 0;
        }
      });

      const diferenca = totalGasto - gastoMesAnterior;
      const percentualComparativo = gastoMesAnterior > 0 
        ? (diferenca / gastoMesAnterior) * 100 
        : 0;

      const tipoComparativo: "aumento" | "reducao" | "igual" = 
        diferenca > 0 ? "aumento" : diferenca < 0 ? "reducao" : "igual";

      const comparativo: {
        diferenca: number;
        percentual: number;
        tipo: "aumento" | "reducao" | "igual";
      } = {
        diferenca,
        percentual: percentualComparativo,
        tipo: tipoComparativo,
      };

      // 7. Média diária
      const diaAtual = new Date().getDate();
      const mediaDiaria = diaAtual > 0 ? totalGasto / diaAtual : 0;

      // 8. Previsão mensal
      const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
      const previsaoMensal = mediaDiaria * diasNoMes;

      // 9. Gerar insights
      const insights = gerarInsights(
        listaGastos,
        totalGasto,
        totalReceitas,
        mediaDiaria,
        comparativo
      );

      return {
        totalGasto,
        totalReceitas,
        saldo: totalReceitas - totalGasto,
        economizado: Math.max(totalReceitas - totalGasto, 0),
        gastosPorCategoria: listaGastos,
        topGastos: listaGastos.slice(0, 5),
        insights,
        mediaDiaria,
        previsaoMensal,
        comparativoMesAnterior: comparativo,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

/* ======================================================
   HOOK: useOrcamentos
====================================================== */

export function useOrcamentos(mesReferencia?: Date) {
  const { user } = useAuth();
  const mes = mesReferencia || new Date();

  return useQuery({
    queryKey: ["orcamentos", user?.id, firstDayOfMonth(mes)],
    queryFn: async (): Promise<Orcamento[]> => {
      const inicioMes = firstDayOfMonth(mes);
      const fimMes = lastDayOfMonth(mes);

      // 1. Buscar orçamentos
      const { data: orcamentos, error } = await (supabase as any)
        .from("orcamentos")
        .select(`
          id, category_id, valor_limite,
          categories(id, name, icon, color)
        `)
        .eq("user_id", user?.id)
        .eq("mes_referencia", inicioMes);

      if (error) throw error;

      // 2. Buscar gastos por categoria
      const { data: transacoes } = await supabase
        .from("transactions")
        .select("amount, category_id")
        .eq("type", "expense")
        .gte("date", inicioMes)
        .lte("date", fimMes);

      const gastosPorCategoria: Record<string, number> = {};
      (transacoes || []).forEach((t: any) => {
        const catId = t.category_id || "";
        gastosPorCategoria[catId] = (gastosPorCategoria[catId] || 0) + Number(t.amount);
      });

      // 3. Formatar orçamentos
      return (orcamentos || []).map((o: any) => {
        const limite = Number(o.valor_limite) || 0;
        const gasto = gastosPorCategoria[o.category_id] || 0;
        const percentual = limite > 0 ? (gasto / limite) * 100 : 0;

        let status: "ok" | "atencao" | "excedido" = "ok";
        if (percentual >= 100) status = "excedido";
        else if (percentual >= 80) status = "atencao";

        return {
          id: o.id,
          categoryId: o.category_id,
          categoriaNome: o.categories?.name || "Categoria",
          categoriaIcone: o.categories?.icon || "📦",
          categoriaCor: o.categories?.color || "#6366f1",
          valorLimite: limite,
          gastoAtual: gasto,
          percentualUsado: percentual,
          status,
          disponivel: Math.max(limite - gasto, 0),
        };
      });
    },
    enabled: !!user,
  });
}

/* ======================================================
   MUTATION: Criar/Atualizar Orçamento
====================================================== */

export function useSalvarOrcamento() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      categoryId: string;
      valorLimite: number;
      mesReferencia: Date;
    }) => {
      const { error } = await (supabase as any)
        .from("orcamentos")
        .upsert({
          user_id: user?.id,
          category_id: data.categoryId,
          valor_limite: data.valorLimite,
          mes_referencia: firstDayOfMonth(data.mesReferencia),
        }, {
          onConflict: "user_id,category_id,mes_referencia",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["analise-gastos"] });
      toast({
        title: "Orçamento salvo!",
        description: "O limite foi definido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o orçamento.",
        variant: "destructive",
      });
    },
  });
}
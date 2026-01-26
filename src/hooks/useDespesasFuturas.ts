import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { addDays, addMonths, format, parseISO, startOfMonth } from "date-fns";

/* ======================================================
   TIPOS
====================================================== */

export type DespesaFutura = {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  categoria: { id: string; nome: string; cor: string } | null;
  responsavel: { id: string; nome: string } | null;
  origem: "cartao" | "transacao";
  cartaoNome?: string;
  cartaoId?: string;
  tipo: "parcelada" | "fixa" | "unica";
  parcela?: { numero: number; total: number };
};

export type FiltrosDespesasFuturas = {
  dataInicio: Date;
  dataFim: Date;
  categoriaId?: string;
  responsavelId?: string;
  cartaoId?: string;
  tipo?: string;
};

/* ======================================================
   FUNÇÕES DE BUSCA
====================================================== */

async function buscarParcelasCartao(
  userId: string,
  dataInicio: Date,
  dataFim: Date
): Promise<DespesaFutura[]> {
  const inicioStr = format(dataInicio, "yyyy-MM-dd");
  const fimStr = format(dataFim, "yyyy-MM-dd");

  // Buscar parcelas não pagas no período
  const { data: parcelas, error } = await supabase
    .from("parcelas_cartao")
    .select(`
      id,
      valor,
      mes_referencia,
      numero_parcela,
      total_parcelas,
      paga,
      tipo_recorrencia,
      compra:compras_cartao!inner (
        id,
        descricao,
        cartao_id,
        categoria_id,
        responsavel_id,
        tipo_lancamento,
        user_id,
        cartao:cartoes!inner (
          id,
          nome,
          dia_vencimento
        ),
        categoria:categories (
          id,
          name,
          color
        ),
        responsavel:responsaveis (
          id,
          nome
        )
      )
    `)
    .eq("paga", false)
    .eq("ativo", true)
    .gte("mes_referencia", inicioStr)
    .lte("mes_referencia", fimStr);

  if (error) {
    console.error("Erro ao buscar parcelas:", error);
    return [];
  }

  // Filtrar por user_id e mapear para DespesaFutura
  return (parcelas || [])
    .filter((p: any) => p.compra?.user_id === userId)
    .map((p: any) => {
      // Calcular data de vencimento baseada no mês e dia do cartão
      const [ano, mes] = p.mes_referencia.split("-").map(Number);
      const diaVencimento = p.compra.cartao?.dia_vencimento || 10;
      const dataVenc = new Date(ano, mes - 1, Math.min(diaVencimento, 28));

      return {
        id: `parcela-${p.id}`,
        descricao: p.compra.descricao,
        valor: Number(p.valor) || 0,
        dataVencimento: dataVenc,
        categoria: p.compra.categoria
          ? {
              id: p.compra.categoria.id,
              nome: p.compra.categoria.name,
              cor: p.compra.categoria.color || "#888",
            }
          : null,
        responsavel: p.compra.responsavel
          ? {
              id: p.compra.responsavel.id,
              nome: p.compra.responsavel.nome,
            }
          : null,
        origem: "cartao" as const,
        cartaoNome: p.compra.cartao?.nome,
        cartaoId: p.compra.cartao_id,
        tipo: (p.compra.tipo_lancamento === "fixa"
          ? "fixa"
          : p.total_parcelas > 1
          ? "parcelada"
          : "unica") as "parcelada" | "fixa" | "unica",
        parcela:
          p.total_parcelas > 1
            ? { numero: p.numero_parcela, total: p.total_parcelas }
            : undefined,
      };
    });
}

async function buscarTransacoesPendentes(
  userId: string,
  dataInicio: Date,
  dataFim: Date
): Promise<DespesaFutura[]> {
  const inicioStr = format(dataInicio, "yyyy-MM-dd");
  const fimStr = format(dataFim, "yyyy-MM-dd");

  const { data: transacoes, error } = await supabase
    .from("transactions")
    .select(`
      id,
      description,
      amount,
      due_date,
      status,
      type,
      tipo_lancamento,
      numero_parcela,
      total_parcelas,
      category:categories (
        id,
        name,
        color
      )
    `)
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("status", "pending")
    .gte("due_date", inicioStr)
    .lte("due_date", fimStr);

  if (error) {
    console.error("Erro ao buscar transações:", error);
    return [];
  }

  return (transacoes || []).map((t: any) => {
    const dataVenc = t.due_date ? parseISO(t.due_date) : new Date();

    return {
      id: `transacao-${t.id}`,
      descricao: t.description || "Sem descrição",
      valor: Number(t.amount) || 0,
      dataVencimento: dataVenc,
      categoria: t.category
        ? {
            id: t.category.id,
            nome: t.category.name,
            cor: t.category.color || "#888",
          }
        : null,
      responsavel: null,
      origem: "transacao" as const,
      tipo: (t.tipo_lancamento === "fixa" || t.tipo_lancamento === "recorrente"
        ? "fixa"
        : t.tipo_lancamento === "parcelada"
        ? "parcelada"
        : "unica") as "parcelada" | "fixa" | "unica",
      parcela:
        t.total_parcelas && t.total_parcelas > 1
          ? { numero: t.numero_parcela || 1, total: t.total_parcelas }
          : undefined,
    };
  });
}

async function buscarDespesasFuturas(
  userId: string,
  filtros: FiltrosDespesasFuturas
): Promise<DespesaFutura[]> {
  // Buscar em paralelo
  const [parcelas, transacoes] = await Promise.all([
    buscarParcelasCartao(userId, filtros.dataInicio, filtros.dataFim),
    buscarTransacoesPendentes(userId, filtros.dataInicio, filtros.dataFim),
  ]);

  // Combinar resultados
  let despesas = [...parcelas, ...transacoes];

  // Aplicar filtros
  if (filtros.categoriaId) {
    if (filtros.categoriaId === "sem-categoria") {
      despesas = despesas.filter((d) => !d.categoria);
    } else {
      despesas = despesas.filter((d) => d.categoria?.id === filtros.categoriaId);
    }
  }

  if (filtros.responsavelId) {
    despesas = despesas.filter((d) => d.responsavel?.id === filtros.responsavelId);
  }

  if (filtros.cartaoId) {
    if (filtros.cartaoId === "transacao") {
      despesas = despesas.filter((d) => d.origem === "transacao");
    } else {
      despesas = despesas.filter((d) => d.cartaoId === filtros.cartaoId);
    }
  }

  if (filtros.tipo) {
    despesas = despesas.filter((d) => d.tipo === filtros.tipo);
  }

  // Ordenar por data de vencimento
  despesas.sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime());

  return despesas;
}

/* ======================================================
   HOOK PRINCIPAL
====================================================== */

export function useDespesasFuturas(filtros: FiltrosDespesasFuturas) {
  const { user } = useAuth();

  const queryKey = [
    "despesas-futuras",
    user?.id,
    format(filtros.dataInicio, "yyyy-MM-dd"),
    format(filtros.dataFim, "yyyy-MM-dd"),
    filtros.categoriaId,
    filtros.responsavelId,
    filtros.cartaoId,
    filtros.tipo,
  ];

  return useQuery({
    queryKey,
    queryFn: () => buscarDespesasFuturas(user!.id, filtros),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/* ======================================================
   UTILITÁRIOS
====================================================== */

export function calcularResumo(despesas: DespesaFutura[]) {
  const hoje = new Date();
  const em30Dias = addDays(hoje, 30);

  const totalPeriodo = despesas.reduce((sum, d) => sum + d.valor, 0);
  const proximos30Dias = despesas
    .filter((d) => d.dataVencimento <= em30Dias)
    .reduce((sum, d) => sum + d.valor, 0);
  const quantidade = despesas.length;

  return { totalPeriodo, proximos30Dias, quantidade };
}

export function agruparPorMes(despesas: DespesaFutura[]) {
  const grupos: Record<string, { despesas: DespesaFutura[]; total: number }> = {};

  despesas.forEach((d) => {
    const mesKey = format(startOfMonth(d.dataVencimento), "yyyy-MM");
    if (!grupos[mesKey]) {
      grupos[mesKey] = { despesas: [], total: 0 };
    }
    grupos[mesKey].despesas.push(d);
    grupos[mesKey].total += d.valor;
  });

  return grupos;
}

/* ======================================================
   RESUMO POR CARTÃO
====================================================== */

export type ResumoCartaoFuturo = {
  cartaoId: string | null;
  cartaoNome: string;
  cartaoCor?: string;
  total: number;
  quantidade: number;
};

export function agruparPorCartao(
  despesas: DespesaFutura[],
  cartoes: Array<{ id: string; nome: string; cor: string }>
): ResumoCartaoFuturo[] {
  const grupos: Record<string, { total: number; quantidade: number }> = {};

  // Agrupar por cartaoId (null = transações)
  despesas.forEach((d) => {
    const key = d.cartaoId || "__transacao__";
    if (!grupos[key]) {
      grupos[key] = { total: 0, quantidade: 0 };
    }
    grupos[key].total += d.valor;
    grupos[key].quantidade += 1;
  });

  // Mapear para o tipo de retorno
  const resultado: ResumoCartaoFuturo[] = [];

  // Adicionar cartões que têm despesas
  Object.entries(grupos).forEach(([key, dados]) => {
    if (key === "__transacao__") {
      resultado.push({
        cartaoId: null,
        cartaoNome: "Transações",
        cartaoCor: undefined,
        total: dados.total,
        quantidade: dados.quantidade,
      });
    } else {
      const cartao = cartoes.find((c) => c.id === key);
      if (cartao) {
        resultado.push({
          cartaoId: cartao.id,
          cartaoNome: cartao.nome,
          cartaoCor: cartao.cor,
          total: dados.total,
          quantidade: dados.quantidade,
        });
      }
    }
  });

  // Ordenar por total (maior para menor)
  resultado.sort((a, b) => b.total - a.total);

  return resultado;
}

export function getDefaultFiltros(): FiltrosDespesasFuturas {
  const hoje = new Date();
  return {
    dataInicio: hoje,
    dataFim: addMonths(hoje, 3),
  };
}

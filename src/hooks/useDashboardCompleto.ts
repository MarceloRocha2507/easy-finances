import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ======================================================
   TIPOS
====================================================== */

export type CartaoDashboard = {
  id: string;
  nome: string;
  bandeira: string | null;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  cor: string;
  totalMes: number;
  totalPendente: number;
  totalPago: number;
  disponivel: number;
  usoPct: number;
  diasParaVencimento: number;
};

export type ResumoCartoes = {
  totalFaturaMes: number;
  totalPendente: number;
  totalPago: number;
  limiteTotal: number;
  limiteDisponivel: number;
  quantidadeCartoes: number;
};

export type CategoriaAlerta = "cartao" | "transacao" | "meta" | "orcamento" | "acerto" | "economia";

export type Alerta = {
  id: string;
  tipo: "warning" | "danger" | "info" | "success";
  titulo: string;
  mensagem: string;
  icone: string;
  categoria?: CategoriaAlerta;
};

export type ProximaFatura = {
  cartaoId: string;
  cartaoNome: string;
  bandeira: string | null;
  valor: number;
  dataVencimento: Date;
  diasRestantes: number;
};

export type UltimaCompra = {
  id: string;
  descricao: string;
  valor: number;
  parcelas: number;
  cartaoNome: string;
  data: Date;
};

export type GastoDiario = {
  data: string;
  valor: number;
  label: string;
};

export type ComparativoMensal = {
  mesAtual: number;
  mesAnterior: number;
  variacao: number;
  variacaoPct: number;
  tipo: "aumento" | "reducao" | "igual";
};

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

export type DashboardData = {
  cartoes: CartaoDashboard[];
  resumo: ResumoCartoes;
  alertas: Alerta[];
  proximasFaturas: ProximaFatura[];
  ultimasCompras: UltimaCompra[];
  gastosDiarios: GastoDiario[];
  comparativo: ComparativoMensal;
  metas: Meta[];
};

/* ======================================================
   HELPERS
====================================================== */

function firstDayOfMonth(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function calcularDiasParaVencimento(diaVencimento: number): number {
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let dataVencimento: Date;
  if (diaAtual <= diaVencimento) {
    dataVencimento = new Date(anoAtual, mesAtual, diaVencimento);
  } else {
    dataVencimento = new Date(anoAtual, mesAtual + 1, diaVencimento);
  }

  const diffTime = dataVencimento.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/* ======================================================
   HOOK PRINCIPAL
====================================================== */

export function useDashboardCompleto(mesReferencia?: Date) {
  const mesRef = mesReferencia || new Date();

  return useQuery({
    queryKey: ["dashboard-completo", firstDayOfMonth(mesRef)],
    queryFn: async (): Promise<DashboardData> => {
      const hoje = new Date();
      const mesAtual = firstDayOfMonth(mesRef);
      const proximoMes = firstDayOfMonth(
        new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1)
      );
      const mesAnterior = firstDayOfMonth(
        new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1)
      );

      // ========== 1. BUSCAR CARTÕES ==========
      const { data: cartoes, error: cartoesError } = await (supabase as any)
        .from("cartoes")
        .select("id, nome, bandeira, limite, dia_fechamento, dia_vencimento, cor");

      if (cartoesError) throw cartoesError;

      if (!cartoes || cartoes.length === 0) {
        return getEmptyDashboard();
      }

      const cartaoIds = cartoes.map((c: any) => c.id);

      // ========== 2. BUSCAR COMPRAS (com limite de período) ==========
      // Limita a 90 dias para reduzir dados transferidos
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 90);
      const dataLimiteStr = dataLimite.toISOString().split("T")[0];

      const { data: compras } = await (supabase as any)
        .from("compras_cartao")
        .select("id, cartao_id, descricao, valor_total, parcelas, created_at")
        .in("cartao_id", cartaoIds)
        .gte("created_at", dataLimiteStr)
        .order("created_at", { ascending: false })
        .limit(200);

      const compraIds = (compras || []).map((c: any) => c.id);
      const compraCartaoMap: Record<string, string> = {};
      (compras || []).forEach((c: any) => {
        compraCartaoMap[c.id] = c.cartao_id;
      });

      // ========== 3. BUSCAR PARCELAS DO MÊS ATUAL ==========
      let parcelasMesAtual: any[] = [];
      let parcelasMesAnterior: any[] = [];

      if (compraIds.length > 0) {
        const { data: parcelas } = await (supabase as any)
          .from("parcelas_cartao")
          .select("id, compra_id, valor, numero_parcela, total_parcelas, mes_referencia, paga")
          .in("compra_id", compraIds)
          .gte("mes_referencia", mesAnterior)
          .lt("mes_referencia", proximoMes);

        if (parcelas) {
          parcelasMesAtual = parcelas.filter(
            (p: any) => p.mes_referencia >= mesAtual && p.mes_referencia < proximoMes
          );
          parcelasMesAnterior = parcelas.filter(
            (p: any) => p.mes_referencia >= mesAnterior && p.mes_referencia < mesAtual
          );
        }
      }

      // ========== 4. CALCULAR TOTAIS POR CARTÃO ==========
      const parcelasPorCartao: Record<string, { total: number; pago: number; pendente: number }> = {};

      parcelasMesAtual.forEach((p: any) => {
        const cartaoId = compraCartaoMap[p.compra_id];
        if (cartaoId) {
          if (!parcelasPorCartao[cartaoId]) {
            parcelasPorCartao[cartaoId] = { total: 0, pago: 0, pendente: 0 };
          }
          const valor = Math.abs(Number(p.valor) || 0);
          parcelasPorCartao[cartaoId].total += valor;
          if (p.paga) {
            parcelasPorCartao[cartaoId].pago += valor;
          } else {
            parcelasPorCartao[cartaoId].pendente += valor;
          }
        }
      });

      // ========== 5. FORMATAR CARTÕES ==========
      const cartoesFormatados: CartaoDashboard[] = cartoes.map((cartao: any) => {
        const limite = Number(cartao.limite) || 0;
        const totais = parcelasPorCartao[cartao.id] || { total: 0, pago: 0, pendente: 0 };
        const disponivel = Math.max(limite - totais.pendente, 0);
        const usoPct = limite > 0 ? Math.min((totais.pendente / limite) * 100, 100) : 0;
        const diasParaVencimento = calcularDiasParaVencimento(cartao.dia_vencimento || 10);

        return {
          id: cartao.id,
          nome: cartao.nome,
          bandeira: cartao.bandeira || null,
          limite,
          dia_fechamento: cartao.dia_fechamento || 1,
          dia_vencimento: cartao.dia_vencimento || 10,
          cor: cartao.cor || "#6366f1",
          totalMes: totais.total,
          totalPendente: totais.pendente,
          totalPago: totais.pago,
          disponivel,
          usoPct,
          diasParaVencimento,
        };
      });

      // ========== 6. CALCULAR RESUMO ==========
      const limiteTotal = cartoesFormatados.reduce((sum, c) => sum + c.limite, 0);
      const totalPendente = cartoesFormatados.reduce((sum, c) => sum + c.totalPendente, 0);
      const totalPago = cartoesFormatados.reduce((sum, c) => sum + c.totalPago, 0);

      const resumo: ResumoCartoes = {
        totalFaturaMes: totalPendente + totalPago,
        totalPendente,
        totalPago,
        limiteTotal,
        limiteDisponivel: Math.max(limiteTotal - totalPendente, 0),
        quantidadeCartoes: cartoes.length,
      };

      // ========== 7. GERAR ALERTAS INTELIGENTES ==========
      const alertas: Alerta[] = [];

      // Alerta de limite alto
      cartoesFormatados.forEach((cartao) => {
        if (cartao.usoPct >= 90) {
          alertas.push({
            id: `limite-critico-${cartao.id}`,
            tipo: "danger",
            titulo: "Limite crítico!",
            mensagem: `${cartao.nome} está com ${cartao.usoPct.toFixed(0)}% do limite usado.`,
            icone: "alert-triangle",
            categoria: "cartao",
          });
        } else if (cartao.usoPct >= 75) {
          alertas.push({
            id: `limite-alto-${cartao.id}`,
            tipo: "warning",
            titulo: "Limite alto",
            mensagem: `${cartao.nome} está com ${cartao.usoPct.toFixed(0)}% do limite usado.`,
            icone: "alert-circle",
            categoria: "cartao",
          });
        }
      });

      // Alertas de vencimento de fatura
      cartoesFormatados.forEach((cartao) => {
        if (cartao.totalPendente > 0) {
          const valorFormatado = cartao.totalPendente.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

          // Fatura VENCIDA
          if (cartao.diasParaVencimento < 0) {
            alertas.push({
              id: `fatura-vencida-${cartao.id}`,
              tipo: "danger",
              titulo: "Fatura VENCIDA!",
              mensagem: `${cartao.nome} está vencida há ${Math.abs(cartao.diasParaVencimento)} dia(s). Valor: ${valorFormatado}.`,
              icone: "alert-octagon",
              categoria: "cartao",
            });
          }
          // Fatura vence HOJE
          else if (cartao.diasParaVencimento === 0) {
            alertas.push({
              id: `fatura-hoje-${cartao.id}`,
              tipo: "danger",
              titulo: "Fatura vence HOJE!",
              mensagem: `${cartao.nome} vence hoje. Valor: ${valorFormatado}.`,
              icone: "clock",
              categoria: "cartao",
            });
          }
          // Fatura vence em breve (1-3 dias)
          else if (cartao.diasParaVencimento <= 3) {
            alertas.push({
              id: `vencimento-${cartao.id}`,
              tipo: "warning",
              titulo: "Fatura vence em breve!",
              mensagem: `${cartao.nome} vence em ${cartao.diasParaVencimento} dia(s). Valor: ${valorFormatado}.`,
              icone: "calendar",
              categoria: "cartao",
            });
          }
          // Fatura vence esta semana (4-7 dias)
          else if (cartao.diasParaVencimento <= 7) {
            alertas.push({
              id: `fatura-semana-${cartao.id}`,
              tipo: "info",
              titulo: "Fatura vence esta semana",
              mensagem: `${cartao.nome} vence em ${cartao.diasParaVencimento} dia(s). Valor: ${valorFormatado}.`,
              icone: "calendar",
              categoria: "cartao",
            });
          }
          // Fatura vence em breve (8-15 dias)
          else if (cartao.diasParaVencimento <= 15) {
            alertas.push({
              id: `fatura-quinzena-${cartao.id}`,
              tipo: "info",
              titulo: "Fatura vence em breve",
              mensagem: `${cartao.nome} vence em ${cartao.diasParaVencimento} dia(s). Valor: ${valorFormatado}.`,
              icone: "calendar-days",
              categoria: "cartao",
            });
          }
        }

        // Limite disponível muito baixo (< R$ 500)
        if (cartao.disponivel < 500 && cartao.disponivel > 0 && cartao.limite >= 1000) {
          alertas.push({
            id: `limite-baixo-${cartao.id}`,
            tipo: "info",
            titulo: "Limite disponível baixo",
            mensagem: `${cartao.nome} tem apenas R$ ${cartao.disponivel.toFixed(2)} disponível.`,
            icone: "credit-card",
            categoria: "cartao",
          });
        }
      });

      // ========== 8. PRÓXIMAS FATURAS ==========
      const proximasFaturas: ProximaFatura[] = cartoesFormatados
        .filter((c) => c.totalPendente > 0)
        .map((cartao) => {
          const hoje = new Date();
          let dataVencimento: Date;
          if (hoje.getDate() <= cartao.dia_vencimento) {
            dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), cartao.dia_vencimento);
          } else {
            dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, cartao.dia_vencimento);
          }

          return {
            cartaoId: cartao.id,
            cartaoNome: cartao.nome,
            bandeira: cartao.bandeira,
            valor: cartao.totalPendente,
            dataVencimento,
            diasRestantes: cartao.diasParaVencimento,
          };
        })
        .sort((a, b) => a.diasRestantes - b.diasRestantes);

      // ========== 9. ÚLTIMAS COMPRAS ==========
      const ultimasCompras: UltimaCompra[] = (compras || [])
        .slice(0, 5)
        .map((compra: any) => {
          const cartao = cartoes.find((c: any) => c.id === compra.cartao_id);
          return {
            id: compra.id,
            descricao: compra.descricao,
            valor: Math.abs(Number(compra.valor_total) || 0),
            parcelas: compra.parcelas || 1,
            cartaoNome: cartao?.nome || "Cartão",
            data: new Date(compra.created_at),
          };
        });

      // ========== 10. GASTOS DIÁRIOS (últimos 30 dias) ==========
      const gastosDiarios: GastoDiario[] = [];
      const ultimos30Dias = new Date();
      ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);

      // Agrupar compras por dia
      const comprasPorDia: Record<string, number> = {};
      (compras || []).forEach((compra: any) => {
        const dataCompra = new Date(compra.created_at);
        if (dataCompra >= ultimos30Dias) {
          const dataStr = dataCompra.toISOString().split("T")[0];
          comprasPorDia[dataStr] = (comprasPorDia[dataStr] || 0) + Math.abs(Number(compra.valor_total) || 0);
        }
      });

      // Preencher últimos 30 dias
      for (let i = 29; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split("T")[0];
        const label = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        gastosDiarios.push({
          data: dataStr,
          valor: comprasPorDia[dataStr] || 0,
          label,
        });
      }

      // ========== 11. COMPARATIVO MENSAL ==========
      const totalMesAtual = parcelasMesAtual.reduce(
        (sum, p: any) => sum + Math.abs(Number(p.valor) || 0),
        0
      );
      const totalMesAnteriorCalc = parcelasMesAnterior.reduce(
        (sum, p: any) => sum + Math.abs(Number(p.valor) || 0),
        0
      );

      const variacao = totalMesAtual - totalMesAnteriorCalc;
      const variacaoPct =
        totalMesAnteriorCalc > 0
          ? ((variacao / totalMesAnteriorCalc) * 100)
          : totalMesAtual > 0
          ? 100
          : 0;

      const comparativo: ComparativoMensal = {
        mesAtual: totalMesAtual,
        mesAnterior: totalMesAnteriorCalc,
        variacao,
        variacaoPct,
        tipo: variacao > 0 ? "aumento" : variacao < 0 ? "reducao" : "igual",
      };

      // ========== 12. BUSCAR METAS ==========
      let metas: Meta[] = [];
      try {
        const { data: metasData } = await (supabase as any)
          .from("metas")
          .select("*")
          .eq("concluida", false)
          .order("data_limite", { ascending: true });

        if (metasData) {
          metas = metasData.map((m: any) => ({
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
        }
      } catch (e) {
        console.log("Tabela metas não existe ainda");
      }

      return {
        cartoes: cartoesFormatados,
        resumo,
        alertas,
        proximasFaturas,
        ultimasCompras,
        gastosDiarios,
        comparativo,
        metas,
      };
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5, // Refresh automático a cada 5 minutos
    retry: 1,
  });
}

/* ======================================================
   DASHBOARD VAZIO
====================================================== */

function getEmptyDashboard(): DashboardData {
  return {
    cartoes: [],
    resumo: {
      totalFaturaMes: 0,
      totalPendente: 0,
      totalPago: 0,
      limiteTotal: 0,
      limiteDisponivel: 0,
      quantidadeCartoes: 0,
    },
    alertas: [],
    proximasFaturas: [],
    ultimasCompras: [],
    gastosDiarios: [],
    comparativo: {
      mesAtual: 0,
      mesAnterior: 0,
      variacao: 0,
      variacaoPct: 0,
      tipo: "igual",
    },
    metas: [],
  };
}

// Alias for backward compatibility
export const useCartoesDashboard = useDashboardCompleto;
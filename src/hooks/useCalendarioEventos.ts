import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { addDays, format, startOfMonth, endOfMonth, addMonths } from "date-fns";

export type CalendarioEventoTipo =
  | "receita"
  | "despesa"
  | "fatura"
  | "fechamento"
  | "assinatura"
  | "meta"
  | "investimento"
  | "acerto";

export interface CalendarioEvento {
  id: string;
  data: Date;
  dataISO: string; // YYYY-MM-DD
  tipo: CalendarioEventoTipo;
  titulo: string;
  valor?: number;
  status?: "pendente" | "concluido";
  cor: string;
  origemId: string;
  metadados?: Record<string, any>;
}

export const CORES_TIPO: Record<CalendarioEventoTipo, string> = {
  receita: "#22C55E",
  despesa: "#DC2626",
  fatura: "#8B5CF6",
  fechamento: "#F59E0B",
  assinatura: "#EC4899",
  meta: "#0EA5E9",
  investimento: "#14B8A6",
  acerto: "#6B7280",
};

export const LABELS_TIPO: Record<CalendarioEventoTipo, string> = {
  receita: "Receita",
  despesa: "Despesa",
  fatura: "Fatura",
  fechamento: "Fechamento",
  assinatura: "Assinatura",
  meta: "Meta",
  investimento: "Investimento",
  acerto: "Acerto",
};

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// Parse 'YYYY-MM-DD' como data local (sem deslocamento UTC)
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function useCalendarioEventos(mesReferencia: Date) {
  const { user } = useAuth();

  // Janela: do início do mês visível até o final do mês seguinte (cobrir agenda lateral)
  const inicio = startOfMonth(mesReferencia);
  const fim = endOfMonth(addMonths(mesReferencia, 1));
  const inicioISO = fmtDate(inicio);
  const fimISO = fmtDate(fim);

  return useQuery({
    queryKey: ["calendario-eventos", user?.id, inicioISO, fimISO],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<CalendarioEvento[]> => {
      if (!user?.id) return [];

      const eventos: CalendarioEvento[] = [];

      const [
        transacoesRes,
        cartoesRes,
        assinaturasRes,
        metasRes,
        investimentosRes,
        acertosRes,
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select("id,description,amount,type,status,due_date,paid_date,date")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .or(
            `and(due_date.gte.${inicioISO},due_date.lte.${fimISO}),and(paid_date.gte.${inicioISO},paid_date.lte.${fimISO}),and(date.gte.${inicioISO},date.lte.${fimISO})`
          )
          .limit(10000),
        supabase
          .from("cartoes")
          .select("id,nome,cor,dia_vencimento,dia_fechamento")
          .eq("user_id", user.id)
          .limit(1000),
        supabase
          .from("assinaturas")
          .select("id,nome,valor,proxima_cobranca,status,categoria")
          .eq("user_id", user.id)
          .eq("status", "ativa")
          .gte("proxima_cobranca", inicioISO)
          .lte("proxima_cobranca", fimISO)
          .limit(1000),
        supabase
          .from("metas")
          .select("id,titulo,data_limite,valor_alvo,valor_atual,concluida,cor")
          .eq("user_id", user.id)
          .eq("concluida", false)
          .not("data_limite", "is", null)
          .gte("data_limite", inicioISO)
          .lte("data_limite", fimISO)
          .limit(1000),
        supabase
          .from("investimentos")
          .select("id,nome,valor_atual,data_vencimento,tipo")
          .eq("user_id", user.id)
          .eq("ativo", true)
          .not("data_vencimento", "is", null)
          .gte("data_vencimento", inicioISO)
          .lte("data_vencimento", fimISO)
          .limit(1000),
        supabase
          .from("acertos_fatura")
          .select("id,mes_referencia,valor_devido,status,cartao_id")
          .eq("user_id", user.id)
          .eq("status", "pendente")
          .gte("mes_referencia", inicioISO)
          .lte("mes_referencia", fimISO)
          .limit(1000),
      ]);

      // 1) Transações
      (transacoesRes.data || []).forEach((t: any) => {
        const isIncome = t.type === "income";
        const isPaid = t.status === "completed";
        const dataRef = isPaid
          ? t.paid_date || t.date
          : t.due_date || t.date;
        if (!dataRef) return;
        const dt = parseLocalDate(dataRef);
        if (dt < inicio || dt > fim) return;
        eventos.push({
          id: `txn-${t.id}`,
          data: dt,
          dataISO: dataRef,
          tipo: isIncome ? "receita" : "despesa",
          titulo: t.description || (isIncome ? "Receita" : "Despesa"),
          valor: Number(t.amount) || 0,
          status: isPaid ? "concluido" : "pendente",
          cor: CORES_TIPO[isIncome ? "receita" : "despesa"],
          origemId: t.id,
          metadados: { transacao: t },
        });
      });

      // 2) Faturas e fechamentos (gera para mês visível e próximo)
      const cartoes = cartoesRes.data || [];
      const mesesParaGerar = [mesReferencia, addMonths(mesReferencia, 1)];
      cartoes.forEach((c: any) => {
        mesesParaGerar.forEach((m) => {
          const ano = m.getFullYear();
          const mesIdx = m.getMonth();
          const ultimoDia = new Date(ano, mesIdx + 1, 0).getDate();
          const diaVenc = Math.min(c.dia_vencimento || 10, ultimoDia);
          const diaFech = Math.min(c.dia_fechamento || 1, ultimoDia);

          const dataVenc = new Date(ano, mesIdx, diaVenc);
          const dataFech = new Date(ano, mesIdx, diaFech);

          if (dataVenc >= inicio && dataVenc <= fim) {
            eventos.push({
              id: `fatura-${c.id}-${ano}-${mesIdx}`,
              data: dataVenc,
              dataISO: fmtDate(dataVenc),
              tipo: "fatura",
              titulo: `Vencimento • ${c.nome}`,
              status: "pendente",
              cor: c.cor || CORES_TIPO.fatura,
              origemId: c.id,
              metadados: { cartao: c, evento: "vencimento" },
            });
          }
          if (dataFech >= inicio && dataFech <= fim) {
            eventos.push({
              id: `fech-${c.id}-${ano}-${mesIdx}`,
              data: dataFech,
              dataISO: fmtDate(dataFech),
              tipo: "fechamento",
              titulo: `Fechamento • ${c.nome}`,
              status: "pendente",
              cor: CORES_TIPO.fechamento,
              origemId: c.id,
              metadados: { cartao: c, evento: "fechamento" },
            });
          }
        });
      });

      // 3) Assinaturas
      (assinaturasRes.data || []).forEach((a: any) => {
        const dt = parseLocalDate(a.proxima_cobranca);
        eventos.push({
          id: `assin-${a.id}`,
          data: dt,
          dataISO: a.proxima_cobranca,
          tipo: "assinatura",
          titulo: a.nome,
          valor: Number(a.valor) || 0,
          status: "pendente",
          cor: CORES_TIPO.assinatura,
          origemId: a.id,
          metadados: { assinatura: a },
        });
      });

      // 4) Metas
      (metasRes.data || []).forEach((m: any) => {
        const dt = parseLocalDate(m.data_limite);
        eventos.push({
          id: `meta-${m.id}`,
          data: dt,
          dataISO: m.data_limite,
          tipo: "meta",
          titulo: `Prazo: ${m.titulo}`,
          valor: Number(m.valor_alvo) - Number(m.valor_atual || 0),
          status: "pendente",
          cor: m.cor || CORES_TIPO.meta,
          origemId: m.id,
          metadados: { meta: m },
        });
      });

      // 5) Investimentos
      (investimentosRes.data || []).forEach((i: any) => {
        const dt = parseLocalDate(i.data_vencimento);
        eventos.push({
          id: `inv-${i.id}`,
          data: dt,
          dataISO: i.data_vencimento,
          tipo: "investimento",
          titulo: `Vence: ${i.nome}`,
          valor: Number(i.valor_atual) || 0,
          status: "pendente",
          cor: CORES_TIPO.investimento,
          origemId: i.id,
          metadados: { investimento: i },
        });
      });

      // 6) Acertos
      (acertosRes.data || []).forEach((a: any) => {
        const dt = parseLocalDate(a.mes_referencia);
        eventos.push({
          id: `acerto-${a.id}`,
          data: dt,
          dataISO: a.mes_referencia,
          tipo: "acerto",
          titulo: "Acerto de fatura",
          valor: Number(a.valor_devido) || 0,
          status: "pendente",
          cor: CORES_TIPO.acerto,
          origemId: a.id,
          metadados: { acerto: a },
        });
      });

      return eventos.sort((a, b) => a.data.getTime() - b.data.getTime());
    },
  });
}

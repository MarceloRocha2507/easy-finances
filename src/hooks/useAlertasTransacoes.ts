import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AlertaTransacao = {
  id: string;
  tipo: "warning" | "danger" | "info" | "success";
  titulo: string;
  mensagem: string;
  icone: string;
  categoria: "transacao";
};

export function useAlertasTransacoes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["alertas-transacoes", user?.id],
    queryFn: async (): Promise<AlertaTransacao[]> => {
      const alertas: AlertaTransacao[] = [];
      const hoje = new Date();
      const hojeStr = hoje.toISOString().split("T")[0];
      
      // Calcular datas
      const em3Dias = new Date(hoje);
      em3Dias.setDate(em3Dias.getDate() + 3);
      const em3DiasStr = em3Dias.toISOString().split("T")[0];

      // Buscar transações pendentes
      const { data: transacoes, error } = await supabase
        .from("transactions")
        .select(`
          id, description, amount, type, due_date, status,
          category:categories(name)
        `)
        .eq("status", "pending");

      if (error) {
        console.error("Erro ao buscar transações para alertas:", error);
        return [];
      }

      (transacoes || []).forEach((t: any) => {
        const descricao = t.description || "Transação";
        const valor = Number(t.amount) || 0;
        const valorFormatado = valor.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        if (t.type === "expense" && t.due_date) {
          // Despesa VENCIDA
          if (t.due_date < hojeStr) {
            const diasAtraso = Math.ceil(
              (hoje.getTime() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            alertas.push({
              id: `transacao-vencida-${t.id}`,
              tipo: "danger",
              titulo: "Conta atrasada!",
              mensagem: `"${descricao}" de ${valorFormatado} está ${diasAtraso} dia(s) em atraso.`,
              icone: "alert-octagon",
              categoria: "transacao",
            });
          }
          // Despesa vence HOJE
          else if (t.due_date === hojeStr) {
            alertas.push({
              id: `transacao-hoje-${t.id}`,
              tipo: "warning",
              titulo: "Conta vence HOJE!",
              mensagem: `"${descricao}" de ${valorFormatado} vence hoje.`,
              icone: "clock",
              categoria: "transacao",
            });
          }
          // Despesa vence em 1-3 dias
          else if (t.due_date > hojeStr && t.due_date <= em3DiasStr) {
            const diasRestantes = Math.ceil(
              (new Date(t.due_date).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
            );
            alertas.push({
              id: `transacao-proxima-${t.id}`,
              tipo: "info",
              titulo: "Conta próxima do vencimento",
              mensagem: `"${descricao}" de ${valorFormatado} vence em ${diasRestantes} dia(s).`,
              icone: "calendar",
              categoria: "transacao",
            });
          }
        }

        // Receita pendente a receber
        if (t.type === "income") {
          if (t.due_date && t.due_date <= hojeStr) {
            alertas.push({
              id: `receita-pendente-${t.id}`,
              tipo: "info",
              titulo: "Receita a receber",
              mensagem: `"${descricao}" de ${valorFormatado} está pendente.`,
              icone: "wallet",
              categoria: "transacao",
            });
          }
        }
      });

      return alertas;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

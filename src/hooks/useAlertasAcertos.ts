import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AlertaAcerto = {
  id: string;
  tipo: "warning" | "danger" | "info" | "success";
  titulo: string;
  mensagem: string;
  icone: string;
  categoria: "acerto";
};

function firstDayOfMonth(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

export function useAlertasAcertos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["alertas-acertos", user?.id],
    queryFn: async (): Promise<AlertaAcerto[]> => {
      const alertas: AlertaAcerto[] = [];
      const mesAtual = firstDayOfMonth(new Date());

      // Buscar acertos pendentes/parciais do mês
      const { data: acertos, error } = await (supabase as any)
        .from("acertos_fatura")
        .select(`
          id, valor_devido, valor_pago, status,
          responsavel:responsaveis(nome, apelido),
          cartao:cartoes(nome)
        `)
        .eq("mes_referencia", mesAtual)
        .neq("status", "pago");

      if (error) {
        console.error("Erro ao buscar acertos:", error);
        return [];
      }

      (acertos || []).forEach((a: any) => {
        const valorDevido = Number(a.valor_devido) || 0;
        const valorPago = Number(a.valor_pago) || 0;
        const valorPendente = valorDevido - valorPago;
        const responsavelNome = a.responsavel?.apelido || a.responsavel?.nome || "Responsável";
        const cartaoNome = a.cartao?.nome || "Cartão";

        if (valorPago === 0) {
          // Acerto totalmente pendente
          alertas.push({
            id: `acerto-pendente-${a.id}`,
            tipo: "info",
            titulo: "Acerto pendente",
            mensagem: `${responsavelNome} deve R$ ${valorDevido.toFixed(2)} do ${cartaoNome}.`,
            icone: "user-check",
            categoria: "acerto",
          });
        } else if (valorPago > 0 && valorPago < valorDevido) {
          // Acerto parcialmente pago
          alertas.push({
            id: `acerto-parcial-${a.id}`,
            tipo: "info",
            titulo: "Acerto parcial",
            mensagem: `${responsavelNome} ainda deve R$ ${valorPendente.toFixed(2)} do ${cartaoNome}.`,
            icone: "user-minus",
            categoria: "acerto",
          });
        }
      });

      return alertas;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

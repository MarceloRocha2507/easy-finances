import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DetalhesDespesasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mesReferencia: Date;
  pendingExpense: number;
  faturaCartao: number;
}

interface TransacaoPendente {
  id: string;
  description: string | null;
  amount: number;
  due_date: string | null;
}

interface ParcelaCartao {
  id: string;
  valor: number;
  numero_parcela: number;
  total_parcelas: number;
  compra: {
    id: string;
    descricao: string;
    cartao: {
      id: string;
      nome: string;
      cor: string;
    };
  };
}

export function DetalhesDespesasDialog({
  open,
  onOpenChange,
  mesReferencia,
}: DetalhesDespesasDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const inicioMes = format(
    new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1),
    "yyyy-MM-dd"
  );
  const fimMes = format(
    new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0),
    "yyyy-MM-dd"
  );

  const { data: transacoesPendentes = [] } = useQuery({
    queryKey: ["transacoes-pendentes", user?.id, inicioMes, fimMes],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select(`id, description, amount, due_date`)
        .eq("user_id", user.id)
        .eq("type", "expense")
        .eq("status", "pending")
        .gte("due_date", inicioMes)
        .lte("due_date", fimMes)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data || []) as TransacaoPendente[];
    },
    enabled: open && !!user,
  });

  const { data: parcelasCartao = [] } = useQuery({
    queryKey: ["parcelas-cartao-titular", user?.id, inicioMes],
    queryFn: async () => {
      if (!user) return [];
      const { data: titularData } = await supabase
        .from("responsaveis")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_titular", true)
        .single();
      const titularId = titularData?.id;

      const { data: parcelas, error } = await supabase
        .from("parcelas_cartao")
        .select(`
          id, valor, numero_parcela, total_parcelas,
          compra:compras_cartao!inner(
            id, descricao, responsavel_id,
            cartao:cartoes!inner(id, nome, cor)
          )
        `)
        .eq("mes_referencia", inicioMes)
        .eq("paga", false)
        .eq("ativo", true);

      if (error) throw error;

      const parcelasFiltradas = (parcelas || []).filter((p: any) => {
        const responsavelId = p.compra?.responsavel_id;
        return responsavelId === titularId || responsavelId === null;
      });
      return parcelasFiltradas as ParcelaCartao[];
    },
    enabled: open && !!user,
  });

  const parcelasPorCartao = parcelasCartao.reduce((acc, parcela) => {
    const cartaoId = parcela.compra.cartao.id;
    if (!acc[cartaoId]) {
      acc[cartaoId] = {
        cartao: parcela.compra.cartao,
        parcelas: [],
        total: 0,
      };
    }
    acc[cartaoId].parcelas.push(parcela);
    acc[cartaoId].total += Number(parcela.valor);
    return acc;
  }, {} as Record<string, { cartao: { id: string; nome: string; cor: string }; parcelas: ParcelaCartao[]; total: number }>);

  const totalContas = transacoesPendentes.reduce((acc, t) => acc + Number(t.amount), 0);
  const totalCartoes = Object.values(parcelasPorCartao).reduce((acc, c) => acc + c.total, 0);
  const totalGeral = totalContas + totalCartoes;

  const mesFormatado = format(mesReferencia, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 bg-white">
        {/* Header */}
        <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-5 space-y-1 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Despesas a pagar
          </p>
          <SheetTitle className="text-2xl font-bold tabular-nums text-[#DC2626]">
            {formatCurrency(totalGeral)}
          </SheetTitle>
          <p className="text-xs text-[#6B7280] capitalize">{mesFormatado}</p>
        </SheetHeader>

        <div className="border-t border-[#F3F4F6]" />

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-6">
            {/* Contas Pendentes */}
            {transacoesPendentes.length > 0 && (
              <section>
                <header className="flex items-center justify-between pb-2 mb-1 border-b border-[#F3F4F6]">
                  <h3 className="text-xs font-semibold text-[#374151]">
                    Contas pendentes
                  </h3>
                  <span className="text-[13px] font-semibold tabular-nums text-[#111827]">
                    {formatCurrency(totalContas)}
                  </span>
                </header>
                <ul className="divide-y divide-[#F9FAFB]">
                  {transacoesPendentes.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#111827] truncate">
                          {t.description || "Sem descrição"}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                          {t.due_date
                            ? `Vence ${format(new Date(t.due_date + "T00:00:00"), "dd/MM")}`
                            : "Sem vencimento"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-[#DC2626] whitespace-nowrap">
                        {formatCurrency(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Fatura do Cartão */}
            {Object.keys(parcelasPorCartao).length > 0 && (
              <section>
                <header className="flex items-center justify-between pb-2 mb-1 border-b border-[#F3F4F6]">
                  <h3 className="text-xs font-semibold text-[#374151]">
                    Fatura do cartão · você
                  </h3>
                  <span className="text-[13px] font-semibold tabular-nums text-[#111827]">
                    {formatCurrency(totalCartoes)}
                  </span>
                </header>
                <ul className="divide-y divide-[#F9FAFB]">
                  {Object.values(parcelasPorCartao).map(({ cartao, total }) => (
                    <li key={cartao.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/cartoes/${cartao.id}/despesas`);
                        }}
                        className="w-full flex items-center justify-between gap-3 py-3 group hover:bg-[#FAFAFA] -mx-2 px-2 rounded transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: cartao.cor }}
                          />
                          <span className="text-sm text-[#111827] truncate">
                            {cartao.nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-sm font-semibold tabular-nums text-[#111827]">
                            {formatCurrency(total)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#374151] transition-colors" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Empty state */}
            {transacoesPendentes.length === 0 && Object.keys(parcelasPorCartao).length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-[#111827] mb-1">Tudo em dia</p>
                <p className="text-xs text-[#9CA3AF]">
                  Nenhuma conta ou fatura pendente neste mês.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
          <Link
            to="/transactions?status=pending"
            onClick={() => onOpenChange(false)}
            className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors inline-flex items-center gap-1"
          >
            Ver pendentes
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-[#6B7280]">Total</span>
            <span className="text-base font-bold tabular-nums text-[#DC2626]">
              {formatCurrency(totalGeral)}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Receipt, Wallet, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  category?: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
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
  pendingExpense,
  faturaCartao,
}: DetalhesDespesasDialogProps) {
  const { user } = useAuth();

  const inicioMes = format(
    new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1),
    "yyyy-MM-dd"
  );
  const fimMes = format(
    new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0),
    "yyyy-MM-dd"
  );

  // Buscar transações pendentes
  const { data: transacoesPendentes = [] } = useQuery({
    queryKey: ["transacoes-pendentes", user?.id, inicioMes, fimMes],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          description,
          amount,
          due_date,
          category:categories(name, icon, color)
        `)
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

  // Buscar parcelas do cartão (titular)
  const { data: parcelasCartao = [] } = useQuery({
    queryKey: ["parcelas-cartao-titular", user?.id, inicioMes],
    queryFn: async () => {
      if (!user) return [];

      // Primeiro, buscar o ID do titular
      const { data: titularData } = await supabase
        .from("responsaveis")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_titular", true)
        .single();

      const titularId = titularData?.id;

      // Buscar parcelas do mês
      const { data: parcelas, error } = await supabase
        .from("parcelas_cartao")
        .select(`
          id,
          valor,
          numero_parcela,
          total_parcelas,
          compra:compras_cartao!inner(
            id,
            descricao,
            responsavel_id,
            cartao:cartoes!inner(id, nome, cor)
          )
        `)
        .eq("mes_referencia", inicioMes)
        .eq("paga", false)
        .eq("ativo", true);

      if (error) throw error;

      // Filtrar apenas as parcelas do titular ou sem responsável
      const parcelasFiltradas = (parcelas || []).filter((p: any) => {
        const responsavelId = p.compra?.responsavel_id;
        return responsavelId === titularId || responsavelId === null;
      });

      return parcelasFiltradas as ParcelaCartao[];
    },
    enabled: open && !!user,
  });

  // Agrupar parcelas por cartão
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
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0 mb-4 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <SheetTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-red-600" />
            Despesas a Pagar
          </SheetTitle>
          <p className="text-sm text-muted-foreground capitalize">{mesFormatado}</p>
        </SheetHeader>

        <div className="flex-1 min-h-0 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Fade indicator no topo */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          
          <ScrollArea className="h-full -mr-4 pr-4">
            <div className="space-y-6 pr-4 pt-2 pb-4">
            {/* Seção: Contas Pendentes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <h3 className="font-medium text-sm">Contas Pendentes</h3>
                </div>
                <span className="text-sm font-semibold text-amber-600">
                  {formatCurrency(totalContas)}
                </span>
              </div>

              {transacoesPendentes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">
                  Nenhuma conta pendente
                </p>
              ) : (
                <div className="space-y-2">
                  {transacoesPendentes.map((transacao) => (
                    <div
                      key={transacao.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {transacao.category?.icon || "📦"}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            {transacao.description || "Sem descrição"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transacao.due_date
                              ? `Vence em ${format(new Date(transacao.due_date + "T00:00:00"), "dd/MM")}`
                              : "Sem vencimento"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-expense">
                        {formatCurrency(transacao.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Seção: Fatura do Cartão */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <h3 className="font-medium text-sm">Fatura do Cartão (EU)</h3>
                </div>
                <span className="text-sm font-semibold text-purple-600">
                  {formatCurrency(totalCartoes)}
                </span>
              </div>

              {Object.keys(parcelasPorCartao).length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">
                  Nenhuma parcela pendente
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.values(parcelasPorCartao).map(({ cartao, parcelas, total }) => (
                    <div key={cartao.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cartao.cor }}
                          />
                          <span className="text-sm font-medium">{cartao.nome}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(total)}
                        </Badge>
                      </div>

                      <div className="pl-5 space-y-1">
                        {parcelas.map((parcela) => (
                          <div
                            key={parcela.id}
                            className="flex items-center justify-between py-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {parcela.compra.descricao}
                              </span>
                              {parcela.total_parcelas > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  {parcela.numero_parcela}/{parcela.total_parcelas}
                                </Badge>
                              )}
                            </div>
                            <span className="font-medium">
                              {formatCurrency(parcela.valor)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
          
          {/* Fade indicator na base */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        </div>

        {/* Footer com total */}
        <div className="flex-shrink-0 pt-4 mt-4 border-t bg-background animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold">Total a Pagar</span>
            <span className="text-xl font-bold text-red-600">
              {formatCurrency(totalGeral)}
            </span>
          </div>
          <Link to="/transactions?status=pending" onClick={() => onOpenChange(false)}>
            <Button variant="outline" className="w-full" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Transações Pendentes
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

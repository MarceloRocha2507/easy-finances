import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Receipt, CheckCircle2, Clock, CreditCard, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

import { useCartoes } from "@/services/cartoes";
import { formatCurrency } from "@/lib/formatters";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";
import type { Cartao } from "@/services/cartoes";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function addMonths(base: Date, delta: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + delta);
  return d;
}

function formatAmountBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function buscarLancamentosFatura(cartaoId: string, mesRef: Date, apenasTitular = false) {
  const mesRefStr = format(new Date(mesRef.getFullYear(), mesRef.getMonth(), 1), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("parcelas_cartao")
    .select(
      "valor, numero_parcela, total_parcelas, mes_referencia, compras_cartao!inner(cartao_id, descricao, nome_fatura, data_compra, ativo, compra_estornada_id, tipo_lancamento, responsavel:responsaveis(is_titular))"
    )
    .eq("ativo", true)
    .eq("mes_referencia", mesRefStr)
    .eq("compras_cartao.cartao_id", cartaoId)
    .eq("compras_cartao.ativo", true)
    .limit(10000);
  if (error) throw error;
  return (data || [])
    .filter((p: any) => {
      if (!apenasTitular) return true;
      const resp = p.compras_cartao?.responsavel;
      return resp === null || resp === undefined || resp?.is_titular === true;
    })
    .map((p: any) => {
      const compra = p.compras_cartao;
      const baseNome = (compra?.nome_fatura || compra?.descricao || "Lançamento").trim();
      const sufixo =
        p.total_parcelas && p.total_parcelas > 1
          ? ` - ${p.numero_parcela}/${p.total_parcelas}`
          : "";
      const title = `${baseNome}${sufixo}`;
      const isCredito =
        !!compra?.compra_estornada_id ||
        /estorno|crédito|credito|pagamento recebido/i.test(baseNome);
      const valor = Number(p.valor) || 0;
      const amount = isCredito ? -valor : valor;
      const date: string = compra?.data_compra || p.mes_referencia;
      return { date, title, amount };
    });
}


function baixarArquivo(conteudo: string, nome: string, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportarFaturaInter(cartao: Cartao, mesRef: Date, apenasTitular = false) {
  try {
    const lancamentos = (await buscarLancamentosFatura(cartao.id, mesRef, apenasTitular)).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    if (lancamentos.length === 0) {
      toast.info("Nenhum lançamento nessa fatura para exportar.");
      return;
    }
    const header = "Data;Histórico;Valor";
    const linhas = lancamentos.map((l) => {
      const [y, m, d] = l.date.split("-");
      const dataBR = `${d}/${m}/${y}`;
      const valorStr = formatAmountBR(l.amount).replace(".", "");
      const valorFinal = l.amount < 0 ? `-${valorStr}` : valorStr;
      return `${dataBR};${csvEscape(l.title)};${valorFinal}`;
    });
    const csv = [header, ...linhas].join("\n");
    const mesLabel = format(mesRef, "yyyy-MM");
    const sufixoArquivo = apenasTitular ? "-titular" : "";
    baixarArquivo(
      csv,
      `inter-${cartao.nome.toLowerCase().replace(/\s+/g, "-")}-${mesLabel}${sufixoArquivo}.csv`
    );
    toast.success(`Fatura exportada no padrão Inter${apenasTitular ? " (somente titular)" : ""}.`);
  } catch (e: any) {
    console.error(e);
    toast.error("Falha ao exportar fatura.", { description: e?.message });
  }
}

async function exportarFaturaNubank(cartao: Cartao, mesRef: Date, apenasTitular = false) {
  try {
    const lancamentos = (await buscarLancamentosFatura(cartao.id, mesRef, apenasTitular)).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    if (lancamentos.length === 0) {
      toast.info("Nenhum lançamento nessa fatura para exportar.");
      return;
    }

    const header = "date,title,amount";
    const linhasCsv = lancamentos.map((l) => {
      const valorStr = l.amount < 0 ? `- ${formatAmountBR(l.amount)}` : formatAmountBR(l.amount);
      return `${l.date},${csvEscape(l.title)},${csvEscape(valorStr)}`;
    });
    const csv = [header, ...linhasCsv].join("\n");
    const mesLabel = format(mesRef, "yyyy-MM");
    const sufixoArquivo = apenasTitular ? "-titular" : "";
    baixarArquivo(
      csv,
      `nubank-${cartao.nome.toLowerCase().replace(/\s+/g, "-")}-${mesLabel}${sufixoArquivo}.csv`
    );
    toast.success(`Fatura exportada no padrão Nubank${apenasTitular ? " (somente titular)" : ""}.`);
  } catch (e: any) {
    console.error(e);
    toast.error("Falha ao exportar fatura.", { description: e?.message });
  }
}


export default function Faturas() {
  const [mesRef, setMesRef] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [filtroCartao, setFiltroCartao] = useState<string>("todos");
  const [cartaoSelecionado, setCartaoSelecionado] = useState<Cartao | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: cartoes = [], isLoading, refetch } = useCartoes(mesRef);

  const cartoesFiltrados = useMemo(() => {
    if (filtroCartao === "todos") return cartoes;
    return cartoes.filter((c) => c.id === filtroCartao);
  }, [cartoes, filtroCartao]);

  const totais = useMemo(() => {
    const total = cartoesFiltrados.reduce((acc, c) => acc + (c.faturaAtual || 0), 0);
    const pago = cartoesFiltrados.reduce((acc, c) => {
      // Consideramos pago se todas as parcelas do mês estão pagas
      // Por simplicidade, usamos faturaAtual como pendente
      return acc;
    }, 0);
    return { total, pago, pendente: total };
  }, [cartoesFiltrados]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Faturas</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Acompanhe as faturas mensais dos seus cartões
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filtroCartao} onValueChange={setFiltroCartao}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os cartões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os cartões</SelectItem>
                {cartoes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center justify-center p-1 bg-gray-50/50 rounded-lg border border-gray-100 w-fit mx-auto">
          <div className="flex items-center gap-1 rounded-md bg-white border border-gray-200 px-1 h-9 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
              onClick={() => setMesRef(addMonths(mesRef, -1))}
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </Button>
            <span className="text-[13px] font-semibold capitalize min-w-[120px] sm:min-w-[140px] text-center text-gray-700 select-none">
              {monthLabel(mesRef)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
              onClick={() => setMesRef(addMonths(mesRef, 1))}
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Total do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totais.total)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">{formatCurrency(totais.pendente)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Cartões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{cartoesFiltrados.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de faturas por cartão */}
        <div className="space-y-3">
          {cartoesFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhum cartão encontrado</p>
              </CardContent>
            </Card>
          ) : (
            cartoesFiltrados.map((cartao, index) => {
              const percentual = cartao.limite > 0 
                ? Math.min((cartao.faturaAtual / cartao.limite) * 100, 100) 
                : 0;
              const isAlto = percentual >= 80;

              return (
                <Card
                  key={cartao.id}
                  className="card-hover cursor-pointer fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => {
                    setCartaoSelecionado(cartao);
                    setDialogOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{cartao.nome}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {cartao.bandeira}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-semibold text-lg">
                          {formatCurrency(cartao.faturaAtual)}
                        </p>
                        <div className="flex items-center gap-2">
                          {isAlto && (
                            <Badge variant="destructive" className="text-xs">
                              Uso alto
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => e.stopPropagation()}
                                title="Exportar fatura em CSV"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Exportar CSV
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportarFaturaNubank(cartao, mesRef);
                                }}
                              >
                                Padrão Nubank
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportarFaturaInter(cartao, mesRef);
                                }}
                              >
                                Padrão Inter
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Fatura atual</span>
                        <span>{percentual.toFixed(0)}% do limite</span>
                      </div>
                      <Progress 
                        value={percentual} 
                        className={`h-2 ${isAlto ? "[&>div]:bg-destructive" : ""}`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Vencimento: dia {cartao.dia_vencimento}</span>
                        <span>Limite: {formatCurrency(cartao.limite)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <DetalhesCartaoDialog
        cartao={cartaoSelecionado}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdated={() => refetch()}
      />
    </Layout>
  );
}

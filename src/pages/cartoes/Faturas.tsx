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
import { ChevronLeft, ChevronRight, Receipt, CheckCircle2, Clock, CreditCard } from "lucide-react";
import { useCartoes } from "@/services/cartoes";
import { formatCurrency } from "@/lib/formatters";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";
import type { Cartao } from "@/services/cartoes";

function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function addMonths(base: Date, delta: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + delta);
  return d;
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
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMesRef(addMonths(mesRef, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium capitalize min-w-[180px] text-center">
            {monthLabel(mesRef)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMesRef(addMonths(mesRef, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
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

                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(cartao.faturaAtual)}
                        </p>
                        {isAlto && (
                          <Badge variant="destructive" className="text-xs">
                            Uso alto
                          </Badge>
                        )}
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

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Wallet,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useCartoes, CartaoComResumo } from "@/services/cartoes";
import { NovoCartaoDialog } from "@/components/cartoes/NovoCartaoDialog";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";
import { cn } from "@/lib/utils";

export default function Cartoes() {
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const { data: cartoes = [], isLoading, refetch } = useCartoes(mesReferencia);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoComResumo | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);

  // Navegação de mês
  const irMesAnterior = () => {
    setMesReferencia(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() - 1, 1));
  };

  const irProximoMes = () => {
    setMesReferencia(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 1));
  };

  const nomeMes = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Calcular totais
  const totalLimite = cartoes.reduce((sum, c) => sum + c.limite, 0);
  const totalUsado = cartoes.reduce((sum, c) => sum + c.limiteUsado, 0);
  const totalDisponivel = cartoes.reduce((sum, c) => sum + c.limiteDisponivel, 0);
  const totalFaturaMes = cartoes.reduce((sum, c) => sum + c.faturaAtual, 0);

  const handleCartaoClick = (cartao: CartaoComResumo) => {
    setCartaoSelecionado(cartao);
    setDetalhesOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
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
            <h1 className="text-2xl font-semibold tracking-tight">Cartões</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Gerencie seus cartões e acompanhe as faturas
            </p>
          </div>
          <NovoCartaoDialog onSaved={() => refetch()} />
        </div>

        {/* Resumo Geral */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                  Limite total
                </span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-2xl font-semibold mt-3 value-display">
                {formatCurrency(totalLimite)}
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                  Limite usado
                </span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-2xl font-semibold mt-3 value-display text-amber-600">
                {formatCurrency(totalUsado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Todas as parcelas pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                  Disponível
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-emerald-500" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-2xl font-semibold mt-3 value-display text-emerald-600">
                {formatCurrency(totalDisponivel)}
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                  Fatura do mês
                </span>
                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-red-500" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-2xl font-semibold mt-3 value-display text-red-600">
                {formatCurrency(totalFaturaMes)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {nomeMes}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navegação de Mês */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={irMesAnterior}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium capitalize min-w-[140px] text-center">
            {nomeMes}
          </span>
          <Button variant="outline" size="icon" onClick={irProximoMes}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista de Cartões */}
        {cartoes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CreditCard className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="text-muted-foreground mb-4">
                Nenhum cartão cadastrado
              </p>
              <p className="text-sm text-muted-foreground">
                Clique em "Novo Cartão" acima para adicionar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cartoes.map((cartao, index) => (
              <CartaoCard
                key={cartao.id}
                cartao={cartao}
                mesReferencia={mesReferencia}
                onClick={() => handleCartaoClick(cartao)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {detalhesOpen && cartaoSelecionado && (
        <DetalhesCartaoDialog
          cartao={cartaoSelecionado}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
          onUpdated={() => refetch()}
        />
      )}
    </Layout>
  );
}

/* ======================================================
   Componente CartaoCard
====================================================== */

interface CartaoCardProps {
  cartao: CartaoComResumo;
  mesReferencia: Date;
  onClick: () => void;
  index: number;
}

function CartaoCard({ cartao, mesReferencia, onClick, index }: CartaoCardProps) {
  // Calcular dias até fechamento e vencimento
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();

  // Data de fechamento
  let dataFechamento = new Date(anoAtual, mesAtual, cartao.dia_fechamento);
  if (dataFechamento < hoje) {
    dataFechamento = new Date(anoAtual, mesAtual + 1, cartao.dia_fechamento);
  }
  const diasAteFechamento = Math.ceil(
    (dataFechamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Data de vencimento
  let dataVencimento = new Date(anoAtual, mesAtual, cartao.dia_vencimento);
  if (dataVencimento < hoje) {
    dataVencimento = new Date(anoAtual, mesAtual + 1, cartao.dia_vencimento);
  }
  const diasAteVencimento = Math.ceil(
    (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  const nomeMes = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card
      className="cursor-pointer card-hover fade-in overflow-hidden"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      {/* Header com cor do cartão */}
      <div
        className="h-2"
        style={{ backgroundColor: cartao.cor || "#6366f1" }}
      />

      <CardContent className="p-5">
        {/* Info do Cartão */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${cartao.cor || "#6366f1"}15` }}
            >
              <CreditCard
                className="h-5 w-5"
                style={{ color: cartao.cor || "#6366f1" }}
                strokeWidth={1.75}
              />
            </div>
            <div>
              <p className="font-medium">{cartao.nome}</p>
              <p className="text-xs text-muted-foreground uppercase">
                {cartao.bandeira || "Crédito"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Aberta
          </Badge>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-xs text-muted-foreground">Fechamento</p>
            <p className="text-sm font-medium">
              {dataFechamento.toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground">
              em {diasAteFechamento} dia(s)
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Vencimento</p>
            <p className="text-sm font-medium">
              {dataVencimento.toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground">
              em {diasAteVencimento} dia(s)
            </p>
          </div>
        </div>

        {/* Uso do Limite */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Uso do limite</span>
            <span className="font-medium">{cartao.percentualUsado.toFixed(0)}%</span>
          </div>
          <Progress
            value={cartao.percentualUsado}
            className={cn(
              "h-2",
              cartao.percentualUsado > 80 && "[&>div]:bg-red-500",
              cartao.percentualUsado > 50 && cartao.percentualUsado <= 80 && "[&>div]:bg-amber-500"
            )}
          />
        </div>

        {/* Valores do Limite */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Limite</p>
            <p className="text-sm font-semibold value-display">
              {formatCurrency(cartao.limite)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Usado</p>
            <p className="text-sm font-semibold value-display text-amber-600">
              {formatCurrency(cartao.limiteUsado)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className="text-sm font-semibold value-display text-emerald-600">
              {formatCurrency(cartao.limiteDisponivel)}
            </p>
          </div>
        </div>

        {/* Fatura do Mês - Destaque */}
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium capitalize">Fatura {nomeMes}</span>
            </div>
            <span className="text-lg font-bold value-display text-red-600">
              {formatCurrency(cartao.faturaAtual)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
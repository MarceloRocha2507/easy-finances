import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  AlertTriangle,
} from "lucide-react";

import { useDashboardCompleto, CartaoDashboard } from "@/hooks/useDashboardCompleto";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";
import { formatCurrency } from "@/lib/formatters";

/* ======================================================
   Componente de Card Individual
====================================================== */

interface CartaoCardProps {
  cartao: CartaoDashboard;
  onClick: () => void;
}

function CartaoCard({ cartao, onClick }: CartaoCardProps) {
  const corCartao = cartao.cor || "#6366f1";
  const limiteAlto = cartao.usoPct >= 80;

  return (
    <div
      onClick={onClick}
      className="p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer group"
      style={{ borderColor: `${corCartao}30` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${corCartao}20` }}
          >
            <CreditCard className="h-5 w-5" style={{ color: corCartao }} />
          </div>
          <div>
            <p className="font-medium group-hover:text-primary transition-colors truncate">
              {cartao.nome}
            </p>
            <p className="text-xs text-muted-foreground">
              {cartao.bandeira || "Crédito"}
            </p>
          </div>
        </div>

        {limiteAlto && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {cartao.usoPct.toFixed(0)}%
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fatura</span>
          <span className="font-semibold text-expense">
            {formatCurrency(cartao.totalPendente)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Disponível</span>
          <span className="font-semibold" style={{ color: corCartao }}>
            {formatCurrency(cartao.disponivel)}
          </span>
        </div>

        <Progress
          value={cartao.usoPct}
          className="h-1.5"
          style={{ 
            "--progress-color": limiteAlto ? "hsl(var(--destructive))" : corCartao 
          } as React.CSSProperties}
        />

        <p className="text-xs text-muted-foreground text-right">
          {cartao.usoPct.toFixed(0)}% do limite de {formatCurrency(cartao.limite)}
        </p>
      </div>
    </div>
  );
}

/* ======================================================
   Skeleton Loading
====================================================== */

function CartaoSkeleton() {
  return (
    <div className="p-4 border rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-1.5 w-full" />
      </div>
    </div>
  );
}

/* ======================================================
   Componente Principal
====================================================== */

export function DashboardCartoes() {
  const { data, isLoading, refetch } = useDashboardCompleto();

  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoDashboard | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);

  function handleCartaoClick(cartao: CartaoDashboard) {
    setCartaoSelecionado(cartao);
    setDetalhesOpen(true);
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cartões de Crédito
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Resumo */}
          {data?.resumo && data.resumo.quantidadeCartoes > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 p-3 rounded-xl bg-muted/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Faturas</p>
                <p className="text-xs sm:text-base font-semibold text-expense truncate">
                  {formatCurrency(data.resumo.totalPendente)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Limite Total</p>
                <p className="text-xs sm:text-base font-semibold truncate">
                  {formatCurrency(data.resumo.limiteTotal)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Disponível</p>
                <p className="text-xs sm:text-base font-semibold text-income truncate">
                  {formatCurrency(data.resumo.limiteDisponivel)}
                </p>
              </div>
            </div>
          )}

          {/* Lista de Cartões */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CartaoSkeleton />
              <CartaoSkeleton />
            </div>
          ) : !data?.cartoes || data.cartoes.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Nenhum cartão cadastrado
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.cartoes.map((cartao) => (
                <CartaoCard
                  key={cartao.id}
                  cartao={cartao}
                  onClick={() => handleCartaoClick(cartao)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      {cartaoSelecionado && (
        <DetalhesCartaoDialog
          cartao={cartaoSelecionado as any}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
          onUpdated={() => refetch()}
        />
      )}
    </>
  );
}

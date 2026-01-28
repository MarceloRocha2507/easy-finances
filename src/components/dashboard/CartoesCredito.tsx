import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { CartaoDashboard, ResumoCartoes } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface CartaoCardProps {
  cartao: CartaoDashboard;
  onClick: () => void;
}

function CartaoCard({ cartao, onClick }: CartaoCardProps) {
  const corCartao = cartao.cor || "#8B5CF6";
  const limiteAlto = cartao.usoPct >= 80;
  const venceEmBreve = cartao.diasParaVencimento <= 3 && cartao.diasParaVencimento >= 0;

  return (
    <div
      onClick={onClick}
      className="p-4 border rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer hover:shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${corCartao}15` }}
          >
            <CreditCard className="h-4 w-4" style={{ color: corCartao }} />
          </div>
          <div>
            <p className="text-sm font-medium">{cartao.nome}</p>
            <p className="text-xs text-muted-foreground">
              {cartao.bandeira || "Crédito"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {limiteAlto && (
            <span className="flex items-center gap-1 text-xs text-expense">
              <AlertTriangle className="h-3 w-3" />
              {cartao.usoPct.toFixed(0)}%
            </span>
          )}
          {venceEmBreve && cartao.totalPendente > 0 && (
            <span className="flex items-center gap-1 text-xs text-warning">
              <Clock className="h-3 w-3" />
              {cartao.diasParaVencimento === 0
                ? "Hoje"
                : `${cartao.diasParaVencimento}d`}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fatura</span>
          <span className="font-medium text-expense">
            {formatCurrency(cartao.totalPendente)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Disponível</span>
          <span className="font-medium text-income">
            {formatCurrency(cartao.disponivel)}
          </span>
        </div>

        <Progress
          value={cartao.usoPct}
          className="h-1.5"
          variant={cartao.usoPct >= 80 ? "expense" : cartao.usoPct >= 50 ? "warning" : "default"}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{cartao.usoPct.toFixed(0)}% do limite</span>
          <span>Venc. dia {cartao.dia_vencimento}</span>
        </div>
      </div>
    </div>
  );
}

function CartaoSkeleton() {
  return (
    <div className="p-4 border rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div>
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

interface Props {
  cartoes: CartaoDashboard[];
  resumo: ResumoCartoes;
  isLoading?: boolean;
  onCartaoClick: (cartao: CartaoDashboard) => void;
}

export function CartoesCredito({ cartoes, resumo, isLoading, onCartaoClick }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Cartões de Crédito
        </CardTitle>
      </CardHeader>

      <CardContent>
        {resumo.quantidadeCartoes > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4 p-3 rounded-xl bg-muted">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Faturas</p>
              <p className="text-sm font-semibold text-expense">
                {formatCurrency(resumo.totalPendente)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Limite Total</p>
              <p className="text-sm font-semibold">
                {formatCurrency(resumo.limiteTotal)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Disponível</p>
              <p className="text-sm font-semibold text-income">
                {formatCurrency(resumo.limiteDisponivel)}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CartaoSkeleton />
            <CartaoSkeleton />
          </div>
        ) : cartoes.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum cartão cadastrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cartoes.map((cartao) => (
              <CartaoCard
                key={cartao.id}
                cartao={cartao}
                onClick={() => onCartaoClick(cartao)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

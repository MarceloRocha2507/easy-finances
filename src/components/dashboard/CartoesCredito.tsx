import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { CartaoDashboard, ResumoCartoes } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";

/* ======================================================
   Cores por bandeira
====================================================== */
const CORES_BANDEIRA: Record<string, string> = {
  mastercard: "#eb001b",
  visa: "#1a1f71",
  elo: "#00a4e0",
  amex: "#006fcf",
  hipercard: "#b3131b",
  default: "#6366f1",
};

function getCorCartao(bandeira: string | null): string {
  if (!bandeira) return CORES_BANDEIRA.default;
  const key = bandeira.toLowerCase();
  return CORES_BANDEIRA[key] || CORES_BANDEIRA.default;
}

/* ======================================================
   Card Individual
====================================================== */

interface CartaoCardProps {
  cartao: CartaoDashboard;
  onClick: () => void;
}

function CartaoCard({ cartao, onClick }: CartaoCardProps) {
  // Usar cor personalizada do cartão ou fallback para cor da bandeira
  const corCartao = cartao.cor || getCorCartao(cartao.bandeira);
  const limiteAlto = cartao.usoPct >= 80;
  const venceEmBreve = cartao.diasParaVencimento <= 3 && cartao.diasParaVencimento >= 0;

  return (
    <div
      onClick={onClick}
      className="p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Indicador de cor do cartão */}
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: corCartao }}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${corCartao}20` }}
          >
            <CreditCard className="h-5 w-5" style={{ color: corCartao }} />
          </div>
          <div>
            <p className="font-medium group-hover:text-primary transition-colors">
              {cartao.nome}
            </p>
            <p className="text-xs text-muted-foreground">
              {cartao.bandeira || "Crédito"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {limiteAlto && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              {cartao.usoPct.toFixed(0)}%
            </Badge>
          )}
          {venceEmBreve && cartao.totalPendente > 0 && (
            <Badge variant="outline" className="gap-1 text-xs text-amber-600">
              <Clock className="h-3 w-3" />
              {cartao.diasParaVencimento === 0
                ? "Vence hoje"
                : `${cartao.diasParaVencimento}d`}
            </Badge>
          )}
        </div>
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
          <span className="font-semibold text-income">
            {formatCurrency(cartao.disponivel)}
          </span>
        </div>

        <Progress
          value={cartao.usoPct}
          className={`h-1.5 ${limiteAlto ? "[&>div]:bg-red-500" : ""}`}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {cartao.usoPct.toFixed(0)}% do limite
          </span>
          <span>
            Venc. dia {cartao.dia_vencimento}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   Skeleton
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

interface Props {
  cartoes: CartaoDashboard[];
  resumo: ResumoCartoes;
  isLoading?: boolean;
  onCartaoClick: (cartao: CartaoDashboard) => void;
}

export function CartoesCredito({ cartoes, resumo, isLoading, onCartaoClick }: Props) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cartões de Crédito
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Resumo */}
        {resumo.quantidadeCartoes > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4 p-3 rounded-xl bg-muted/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Faturas</p>
              <p className="font-semibold text-expense">
                {formatCurrency(resumo.totalPendente)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Limite Total</p>
              <p className="font-semibold">
                {formatCurrency(resumo.limiteTotal)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Disponível</p>
              <p className="font-semibold text-income">
                {formatCurrency(resumo.limiteDisponivel)}
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
        ) : cartoes.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              Nenhum cartão cadastrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
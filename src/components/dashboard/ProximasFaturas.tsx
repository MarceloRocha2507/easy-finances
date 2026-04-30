import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard } from "lucide-react";
import { ProximaFatura } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";

const CORES_BANDEIRA: Record<string, string> = {
  mastercard: "#eb001b",
  visa: "#1a1f71",
  elo: "#00a4e0",
  amex: "#006fcf",
  hipercard: "#b3131b",
  default: "#6366f1",
};

interface Props {
  faturas: ProximaFatura[];
  onCartaoClick?: (cartaoId: string) => void;
}

export function ProximasFaturas({ faturas, onCartaoClick }: Props) {
  const faturasPendentes = faturas.filter(f => f.valor > 0);

  if (faturasPendentes.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Próximas Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma fatura pendente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Próximas Faturas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {faturasPendentes.slice(0, 4).map((fatura) => {
          const cor = CORES_BANDEIRA[fatura.bandeira?.toLowerCase() || "default"] || CORES_BANDEIRA.default;

          const badgeVariant = fatura.diasRestantes <= 3
            ? "destructive"
            : fatura.diasRestantes <= 7
            ? "outline"
            : "secondary";

          const badgeClass = fatura.diasRestantes <= 7 && fatura.diasRestantes > 3
            ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
            : "";

          const diasLabel = fatura.diasRestantes < 0
            ? `${Math.abs(fatura.diasRestantes)}d atrás`
            : fatura.diasRestantes === 0
            ? "Hoje"
            : fatura.diasRestantes === 1
            ? "Amanhã"
            : fatura.diasRestantes > 31
            ? fatura.dataVencimento.toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' })
            : `${fatura.diasRestantes} dias`;

          return (
            <div
              key={fatura.cartaoId}
              className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onCartaoClick?.(fatura.cartaoId)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cor}20` }}
                >
                  <CreditCard className="h-4 w-4" style={{ color: cor }} />
                </div>
                <p className="text-sm font-medium truncate max-w-[80px] sm:max-w-none">{fatura.cartaoNome}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <p className="text-xs sm:text-sm font-semibold text-expense">
                  {formatCurrency(fatura.valor)}
                </p>
                <Badge variant={badgeVariant} className={`text-xs ${badgeClass}`}>
                  {diasLabel}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Clock } from "lucide-react";
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
  if (faturas.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
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
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Faturas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {faturas.slice(0, 4).map((fatura) => {
          const cor = CORES_BANDEIRA[fatura.bandeira?.toLowerCase() || "default"] || CORES_BANDEIRA.default;
          const urgente = fatura.diasRestantes <= 3;

          return (
            <div
              key={fatura.cartaoId}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                urgente ? "border-amber-500/30 bg-amber-500/5" : "hover:bg-muted/50"
              }`}
              onClick={() => onCartaoClick?.(fatura.cartaoId)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cor}20` }}
                >
                  <CreditCard className="h-5 w-5" style={{ color: cor }} />
                </div>
                <div>
                  <p className="font-medium">{fatura.cartaoNome}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fatura.dataVencimento.toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-expense">
                  {formatCurrency(fatura.valor)}
                </p>
                <Badge
                  variant={urgente ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {fatura.diasRestantes === 0
                    ? "Hoje"
                    : fatura.diasRestantes === 1
                    ? "Amanhã"
                    : `${fatura.diasRestantes} dias`}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, CheckCircle } from "lucide-react";
import { ComparativoMensal as ComparativoType } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  comparativo: ComparativoType;
}

export function ComparativoMensal({ comparativo }: Props) {
  const { mesAtual, mesAnterior, variacao, variacaoPct, tipo } = comparativo;

  const config = {
    aumento: {
      arrowIcon: ArrowUpRight,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "a mais",
      statusText: "Atenção aos gastos",
      statusColor: "text-amber-600 dark:text-amber-400",
    },
    reducao: {
      arrowIcon: ArrowDownRight,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      label: "a menos",
      statusText: "Economizando",
      statusColor: "text-emerald-600 dark:text-emerald-400",
    },
    igual: {
      arrowIcon: Minus,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      label: "igual",
      statusText: "Estável",
      statusColor: "text-muted-foreground",
    },
  };

  const { arrowIcon: ArrowIcon, color, bgColor, label, statusText, statusColor } = config[tipo];

  return (
    <Card className="border rounded-xl shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Comparativo Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-3">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${bgColor}`}
          >
            <ArrowIcon className={`h-5 w-5 ${color}`} />
            <span className={`font-bold text-lg ${color}`}>
              {Math.abs(variacaoPct).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {tipo === "reducao" && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
            <p className={`text-xs ${statusColor}`}>
              {tipo === "igual" ? (
                "Gastos iguais ao mês anterior"
              ) : (
                <>
                  {formatCurrency(Math.abs(variacao))} {label} · {statusText}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Mês Atual</p>
            <p className="text-lg font-bold">{formatCurrency(mesAtual)}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Mês Anterior</p>
            <p className="text-lg font-bold text-muted-foreground">
              {formatCurrency(mesAnterior)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

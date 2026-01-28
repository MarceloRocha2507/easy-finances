import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ComparativoMensal as ComparativoType } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  comparativo: ComparativoType;
}

export function ComparativoMensal({ comparativo }: Props) {
  const { mesAtual, mesAnterior, variacao, variacaoPct, tipo } = comparativo;

  const config = {
    aumento: {
      icon: TrendingUp,
      arrowIcon: ArrowUpRight,
      color: "text-expense",
      bgColor: "bg-expense/10",
      label: "a mais",
    },
    reducao: {
      icon: TrendingDown,
      arrowIcon: ArrowDownRight,
      color: "text-income",
      bgColor: "bg-income/10",
      label: "a menos",
    },
    igual: {
      icon: Minus,
      arrowIcon: Minus,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      label: "igual",
    },
  };

  const { icon: Icon, arrowIcon: ArrowIcon, color, bgColor, label } = config[tipo];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Comparativo Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-5">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${bgColor}`}
          >
            <ArrowIcon className={`h-5 w-5 ${color}`} />
            <span className={`font-bold text-lg ${color}`}>
              {Math.abs(variacaoPct).toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {tipo === "igual" ? (
              "Gastos iguais ao mês anterior"
            ) : (
              <>
                Você gastou{" "}
                <span className={`font-semibold ${color}`}>
                  {formatCurrency(Math.abs(variacao))}
                </span>{" "}
                {label} que no mês passado
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted text-center">
            <p className="text-xs text-muted-foreground mb-1">Mês Atual</p>
            <p className="text-lg font-semibold">{formatCurrency(mesAtual)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted text-center">
            <p className="text-xs text-muted-foreground mb-1">Mês Anterior</p>
            <p className="text-lg font-semibold text-muted-foreground">
              {formatCurrency(mesAnterior)}
            </p>
          </div>
        </div>

        {tipo === "reducao" && (
          <div className="mt-4 p-3 rounded-lg bg-income/10 border border-income/20 text-center">
            <p className="text-sm text-income">
              🎉 Parabéns! Você está economizando!
            </p>
          </div>
        )}

        {tipo === "aumento" && variacaoPct > 20 && (
          <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
            <p className="text-sm text-warning">
              ⚠️ Atenção aos gastos este mês!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

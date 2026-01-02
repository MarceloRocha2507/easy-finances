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
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "a mais",
    },
    reducao: {
      icon: TrendingDown,
      arrowIcon: ArrowDownRight,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      label: "a menos",
    },
    igual: {
      icon: Minus,
      arrowIcon: Minus,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      label: "igual",
    },
  };

  const { icon: Icon, arrowIcon: ArrowIcon, color, bgColor, label } = config[tipo];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Comparativo Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${bgColor}`}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Mês Atual</p>
            <p className="text-xl font-bold">{formatCurrency(mesAtual)}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Mês Anterior</p>
            <p className="text-xl font-bold text-muted-foreground">
              {formatCurrency(mesAnterior)}
            </p>
          </div>
        </div>

        {tipo === "reducao" && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              🎉 Parabéns! Você está economizando!
            </p>
          </div>
        )}

        {tipo === "aumento" && variacaoPct > 20 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              ⚠️ Atenção aos gastos este mês!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
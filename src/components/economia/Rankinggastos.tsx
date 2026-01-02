import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { GastoCategoria } from "@/hooks/useEconomia";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  gastos: GastoCategoria[];
  totalGasto: number;
}

export function RankingGastos({ gastos, totalGasto }: Props) {
  if (gastos.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Onde Você Mais Gasta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum gasto registrado este mês</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Onde Você Mais Gasta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gastos.map((gasto, index) => (
          <div key={gasto.categoriaId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: `${gasto.categoriaCor}20` }}
                >
                  {gasto.categoriaIcone}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{gasto.categoriaNome}</span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        #1
                      </Badge>
                    )}
                    {gasto.status === "excedido" && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Excedido
                      </Badge>
                    )}
                    {gasto.status === "atencao" && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                        Atenção
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {gasto.quantidade} transações
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatCurrency(gasto.total)}</p>
                <p className="text-xs text-muted-foreground">
                  {gasto.percentual.toFixed(1)}% do total
                </p>
              </div>
            </div>

            <div className="relative">
              <Progress
                value={gasto.percentual}
                className="h-2"
                style={{
                  // @ts-ignore
                  "--progress-color": gasto.categoriaCor,
                }}
              />
              {gasto.orcamento && gasto.orcamento > 0 && (
                <div
                  className="absolute top-0 h-2 w-0.5 bg-gray-800 dark:bg-white"
                  style={{
                    left: `${Math.min((gasto.orcamento / totalGasto) * 100, 100)}%`,
                  }}
                  title={`Limite: ${formatCurrency(gasto.orcamento)}`}
                />
              )}
            </div>

            {gasto.orcamento && gasto.orcamento > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Orçamento: {formatCurrency(gasto.orcamento)}</span>
                <span
                  className={
                    gasto.status === "excedido"
                      ? "text-red-500"
                      : gasto.status === "atencao"
                      ? "text-amber-500"
                      : "text-green-500"
                  }
                >
                  {gasto.percentualOrcamento?.toFixed(0)}% usado
                </span>
              </div>
            )}
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total de gastos</span>
            <span className="text-xl font-bold text-expense">
              {formatCurrency(totalGasto)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
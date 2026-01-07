import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GastoCategoria } from "@/hooks/useEconomia";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Props {
  gastos: GastoCategoria[];
  totalGasto: number;
}

export function RankingGastos({ gastos, totalGasto }: Props) {
  if (gastos.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Gastos por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum gasto registrado este mês</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Gastos por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gastos.map((gasto, index) => (
          <div key={gasto.categoriaId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: gasto.categoriaCor }}
                />
                <span className="text-sm font-medium truncate">
                  {gasto.categoriaNome}
                </span>
                {index === 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    Maior
                  </Badge>
                )}
                {gasto.status === "excedido" && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                    Excedido
                  </Badge>
                )}
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-sm font-medium tabular-nums">
                  {formatCurrency(gasto.total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {gasto.percentual.toFixed(1)}%
                </p>
              </div>
            </div>

            <Progress
              value={gasto.percentual}
              className={cn(
                "h-1.5",
                gasto.status === "excedido" && "[&>div]:bg-destructive",
                gasto.status === "atencao" && "[&>div]:bg-amber-500",
                gasto.status === "ok" && `[&>div]:bg-[${gasto.categoriaCor}]`
              )}
              style={{
                // @ts-ignore
                "--progress-color": gasto.categoriaCor,
              }}
            />

            {gasto.orcamento && gasto.orcamento > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Limite: {formatCurrency(gasto.orcamento)}</span>
                <span
                  className={cn(
                    gasto.status === "excedido" && "text-destructive",
                    gasto.status === "atencao" && "text-amber-600"
                  )}
                >
                  {gasto.percentualOrcamento?.toFixed(0)}% usado
                </span>
              </div>
            )}
          </div>
        ))}

        <div className="pt-4 border-t flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-semibold">
            {formatCurrency(totalGasto)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

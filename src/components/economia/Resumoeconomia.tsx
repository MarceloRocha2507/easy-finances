import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Props {
  totalReceitas: number;
  totalGasto: number;
  saldo: number;
  economizado: number;
  mediaDiaria: number;
  previsaoMensal: number;
  comparativo: {
    diferenca: number;
    percentual: number;
    tipo: "aumento" | "reducao" | "igual";
  };
}

export function ResumoEconomia({
  totalReceitas,
  totalGasto,
  economizado,
  mediaDiaria,
  comparativo,
}: Props) {
  const percentualEconomia =
    totalReceitas > 0 ? (economizado / totalReceitas) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Receitas */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Receitas</p>
          <p className="text-xl font-semibold text-income mt-1">
            {formatCurrency(totalReceitas)}
          </p>
        </CardContent>
      </Card>

      {/* Gastos */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Gastos</p>
          <p className="text-xl font-semibold text-expense mt-1">
            {formatCurrency(totalGasto)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Média: {formatCurrency(mediaDiaria)}/dia
          </p>
        </CardContent>
      </Card>

      {/* Economizado */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Economizado</p>
          <p
            className={cn(
              "text-xl font-semibold mt-1",
              economizado >= 0 ? "text-income" : "text-expense"
            )}
          >
            {formatCurrency(Math.max(economizado, 0))}
          </p>
          {totalReceitas > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {percentualEconomia.toFixed(0)}% da receita
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comparativo */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">vs Mês Anterior</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span
              className={cn(
                "text-xl font-semibold",
                comparativo.tipo === "reducao"
                  ? "text-income"
                  : comparativo.tipo === "aumento"
                  ? "text-expense"
                  : "text-muted-foreground"
              )}
            >
              {comparativo.tipo === "reducao" ? "-" : comparativo.tipo === "aumento" ? "+" : ""}
              {Math.abs(comparativo.percentual).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {comparativo.tipo === "reducao"
              ? `${formatCurrency(Math.abs(comparativo.diferenca))} a menos`
              : comparativo.tipo === "aumento"
              ? `${formatCurrency(comparativo.diferenca)} a mais`
              : "Igual ao mês passado"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
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
  saldo,
  economizado,
  mediaDiaria,
  previsaoMensal,
  comparativo,
}: Props) {
  const percentualEconomia =
    totalReceitas > 0 ? (economizado / totalReceitas) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Receitas */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receitas</p>
              <p className="text-2xl font-bold text-income">
                {formatCurrency(totalReceitas)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total de Gastos */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500/10 to-red-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gastos</p>
              <p className="text-2xl font-bold text-expense">
                {formatCurrency(totalGasto)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Média: {formatCurrency(mediaDiaria)}/dia
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Economizado */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Economizado</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  saldo >= 0 ? "text-blue-500" : "text-red-500"
                )}
              >
                {formatCurrency(Math.max(economizado, 0))}
              </p>
              {totalReceitas > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {percentualEconomia.toFixed(0)}% da receita
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">vs Mês Anterior</p>
              <div className="flex items-center gap-1">
                {comparativo.tipo === "reducao" ? (
                  <ArrowDownRight className="w-5 h-5 text-emerald-500" />
                ) : comparativo.tipo === "aumento" ? (
                  <ArrowUpRight className="w-5 h-5 text-red-500" />
                ) : (
                  <Minus className="w-5 h-5 text-gray-500" />
                )}
                <p
                  className={cn(
                    "text-2xl font-bold",
                    comparativo.tipo === "reducao"
                      ? "text-emerald-500"
                      : comparativo.tipo === "aumento"
                      ? "text-red-500"
                      : "text-gray-500"
                  )}
                >
                  {Math.abs(comparativo.percentual).toFixed(0)}%
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {comparativo.tipo === "reducao"
                  ? `${formatCurrency(Math.abs(comparativo.diferenca))} a menos`
                  : comparativo.tipo === "aumento"
                  ? `${formatCurrency(comparativo.diferenca)} a mais`
                  : "Igual ao mês passado"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
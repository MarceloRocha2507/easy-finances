import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, PiggyBank, ArrowLeftRight } from "lucide-react";

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
      <Card className="gradient-income shadow-lg rounded-xl border-0 animate-fade-in-up">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Receitas</p>
          <p className="text-2xl sm:text-3xl font-bold text-income mt-1">
            {formatCurrency(totalReceitas)}
          </p>
        </CardContent>
      </Card>

      {/* Gastos */}
      <Card className="gradient-expense shadow-lg rounded-xl border-0 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-rose-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Gastos</p>
          <p className="text-2xl sm:text-3xl font-bold text-expense mt-1">
            {formatCurrency(totalGasto)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Média: {formatCurrency(mediaDiaria)}/dia
          </p>
        </CardContent>
      </Card>

      {/* Economizado */}
      <Card className={cn(
        "shadow-lg rounded-xl border-0 animate-fade-in-up",
        economizado >= 0 ? "gradient-income" : "gradient-expense"
      )} style={{ animationDelay: "0.1s" }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              economizado >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
            )}>
              <PiggyBank className={cn(
                "h-6 w-6",
                economizado >= 0 ? "text-emerald-600" : "text-rose-600"
              )} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Economizado</p>
          <p
            className={cn(
              "text-2xl sm:text-3xl font-bold mt-1",
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
      <Card className="shadow-sm rounded-xl border-l-4 animate-fade-in-up" style={{
        borderLeftColor: comparativo.tipo === "reducao" 
          ? "hsl(var(--income))" 
          : comparativo.tipo === "aumento" 
          ? "hsl(var(--expense))" 
          : "hsl(var(--muted-foreground))",
        animationDelay: "0.15s"
      }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              comparativo.tipo === "reducao" 
                ? "bg-emerald-500/20" 
                : comparativo.tipo === "aumento" 
                ? "bg-rose-500/20" 
                : "bg-muted"
            )}>
              <ArrowLeftRight className={cn(
                "h-6 w-6",
                comparativo.tipo === "reducao" 
                  ? "text-emerald-600" 
                  : comparativo.tipo === "aumento" 
                  ? "text-rose-600" 
                  : "text-muted-foreground"
              )} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">vs Mês Anterior</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span
              className={cn(
                "text-2xl sm:text-3xl font-bold",
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

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {/* Receitas */}
      <Card className="gradient-income shadow-lg rounded-xl border-0 animate-fade-in-up overflow-hidden">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Receitas</p>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold text-income mt-0.5 sm:mt-1 truncate">
            {formatCurrency(totalReceitas)}
          </p>
        </CardContent>
      </Card>

      {/* Gastos */}
      <Card className="gradient-expense shadow-lg rounded-xl border-0 animate-fade-in-up overflow-hidden" style={{ animationDelay: "0.05s" }}>
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
              <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 text-rose-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Gastos</p>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold text-expense mt-0.5 sm:mt-1 truncate">
            {formatCurrency(totalGasto)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Média: {formatCurrency(mediaDiaria)}/dia
          </p>
        </CardContent>
      </Card>

      {/* Economizado */}
      <Card className={cn(
        "shadow-lg rounded-xl border-0 animate-fade-in-up overflow-hidden",
        economizado >= 0 ? "gradient-income" : "gradient-expense"
      )} style={{ animationDelay: "0.1s" }}>
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className={cn(
              "w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
              economizado >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
            )}>
              <PiggyBank className={cn(
                "h-4 w-4 sm:h-6 sm:w-6",
                economizado >= 0 ? "text-emerald-600" : "text-rose-600"
              )} />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">Economizado</p>
          <p
            className={cn(
              "text-lg sm:text-2xl md:text-3xl font-bold mt-0.5 sm:mt-1 truncate",
              economizado >= 0 ? "text-income" : "text-expense"
            )}
          >
            {formatCurrency(Math.max(economizado, 0))}
          </p>
          {totalReceitas > 0 && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              {percentualEconomia.toFixed(0)}% da receita
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comparativo */}
      <Card className="shadow-sm rounded-xl border-l-4 animate-fade-in-up overflow-hidden" style={{
        borderLeftColor: comparativo.tipo === "reducao" 
          ? "hsl(var(--income))" 
          : comparativo.tipo === "aumento" 
          ? "hsl(var(--expense))" 
          : "hsl(var(--muted-foreground))",
        animationDelay: "0.15s"
      }}>
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className={cn(
              "w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
              comparativo.tipo === "reducao" 
                ? "bg-emerald-500/20" 
                : comparativo.tipo === "aumento" 
                ? "bg-rose-500/20" 
                : "bg-muted"
            )}>
              <ArrowLeftRight className={cn(
                "h-4 w-4 sm:h-6 sm:w-6",
                comparativo.tipo === "reducao" 
                  ? "text-emerald-600" 
                  : comparativo.tipo === "aumento" 
                  ? "text-rose-600" 
                  : "text-muted-foreground"
              )} />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">vs Mês Anterior</p>
          <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
            <span
              className={cn(
                "text-lg sm:text-2xl md:text-3xl font-bold",
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
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
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

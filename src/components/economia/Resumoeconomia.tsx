import { StatCardPrimary } from "@/components/dashboard/StatCardPrimary";
import { StatCardSecondary } from "@/components/dashboard/StatCardSecondary";
import { formatCurrency } from "@/lib/formatters";
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
      <StatCardPrimary
        title="Receitas"
        value={totalReceitas}
        icon={TrendingUp}
        type="income"
        delay={0}
      />

      <StatCardPrimary
        title="Gastos"
        value={totalGasto}
        icon={TrendingDown}
        type="expense"
        subInfo={<span className="text-xs text-muted-foreground">Média: {formatCurrency(mediaDiaria)}/dia</span>}
        delay={0.05}
      />

      <StatCardPrimary
        title="Economizado"
        value={Math.max(economizado, 0)}
        icon={PiggyBank}
        type={economizado >= 0 ? "income" : "expense"}
        subInfo={totalReceitas > 0 ? <span className="text-xs text-muted-foreground">{percentualEconomia.toFixed(0)}% da receita</span> : undefined}
        delay={0.1}
      />

      <StatCardSecondary
        title="vs Mês Anterior"
        value={Math.abs(comparativo.diferenca)}
        icon={ArrowLeftRight}
        status={comparativo.tipo === "reducao" ? "success" : comparativo.tipo === "aumento" ? "danger" : "neutral"}
        prefix={comparativo.tipo === "reducao" ? "-" : comparativo.tipo === "aumento" ? "+" : ""}
        subInfo={
          comparativo.tipo === "reducao"
            ? `${Math.abs(comparativo.percentual).toFixed(0)}% a menos`
            : comparativo.tipo === "aumento"
            ? `${Math.abs(comparativo.percentual).toFixed(0)}% a mais`
            : "Igual ao mês passado"
        }
        delay={0.15}
      />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ComparativoMensal as ComparativoType } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  comparativo: ComparativoType;
}

export function ComparativoMensal({ comparativo }: Props) {
  const { mesAtual, mesAnterior, variacao, variacaoPct, tipo } = comparativo;

  const pctColor = tipo === "reducao" ? "text-[#16A34A]" : tipo === "aumento" ? "text-[#DC2626]" : "text-[#6B7280]";
  const PctIcon = tipo === "reducao" ? TrendingDown : tipo === "aumento" ? TrendingUp : Minus;

  return (
    <Card className="border border-[#E5E7EB] rounded-xl shadow-none bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#9CA3AF]" />
          Comparativo Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <PctIcon className={`h-4 w-4 ${pctColor}`} />
          <span className={`font-bold text-lg ${pctColor}`}>
            {Math.abs(variacaoPct).toFixed(1)}%
          </span>
          <span className="text-[13px] text-[#6B7280]">
            {tipo === "igual"
              ? "Gastos iguais ao mês anterior"
              : <>
                  {formatCurrency(Math.abs(variacao))} {tipo === "reducao" ? "a menos" : "a mais"} que no mês passado
                </>
            }
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-[11px] text-[#9CA3AF] mb-1">Mês Atual</p>
            <p className="text-xl font-bold text-[#111827] dark:text-white">{formatCurrency(mesAtual)}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-[#9CA3AF] mb-1">Mês Anterior</p>
            <p className="text-xl font-bold text-[#111827] dark:text-white">{formatCurrency(mesAnterior)}</p>
          </div>
        </div>

        {tipo !== "igual" && (
          <p className="text-[11px] text-[#9CA3AF] text-center mt-4">
            {tipo === "reducao"
              ? "Você está economizando em relação ao mês anterior."
              : variacaoPct > 20
                ? "Atenção: seus gastos aumentaram significativamente."
                : "Pequeno aumento nos gastos em relação ao mês anterior."
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}

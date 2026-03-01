import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { GastoDiario } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  dados: GastoDiario[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-lg shadow-sm p-3">
        <p className="font-medium text-[#111827] dark:text-white text-sm">{label}</p>
        <p className="text-sm text-[#6B7280]">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function GastosDiarios({ dados }: Props) {
  const totalPeriodo = dados.reduce((sum, d) => sum + d.valor, 0);
  const mediaDiaria = totalPeriodo / dados.length;
  const maiorGasto = Math.max(...dados.map((d) => d.valor));

  const dadosComLabel = dados.map((d, i) => ({
    ...d,
    labelVisivel: i % 5 === 0 ? d.label : "",
  }));

  return (
    <Card className="border border-[#E5E7EB] rounded-xl shadow-none bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#9CA3AF]" />
            Gastos por Dia
          </CardTitle>
          <div className="text-right text-sm">
            <p className="text-[#6B7280] text-[11px]">Média diária</p>
            <p className="font-bold text-[#111827] dark:text-white">{formatCurrency(mediaDiaria)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalPeriodo === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-[#9CA3AF]">
            <div className="text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum gasto nos últimos 30 dias</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dadosComLabel}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F3F4F6"
                  />
                  <XAxis
                    dataKey="labelVisivel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#111827" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#F3F4F6]">
              <div className="text-center">
                <p className="text-[11px] text-[#6B7280]">Total 30 dias</p>
                <p className="font-bold text-[#111827] dark:text-white">{formatCurrency(totalPeriodo)}</p>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-[#6B7280]">Maior gasto</p>
                <p className="font-bold text-[#111827] dark:text-white">{formatCurrency(maiorGasto)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

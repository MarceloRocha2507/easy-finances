import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
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
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-primary">
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

  // Mostrar apenas alguns labels no eixo X
  const dadosComLabel = dados.map((d, i) => ({
    ...d,
    labelVisivel: i % 5 === 0 ? d.label : "",
  }));

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Gastos por Dia
          </CardTitle>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Média diária</p>
            <p className="font-semibold">{formatCurrency(mediaDiaria)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalPeriodo === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum gasto nos últimos 30 dias</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dadosComLabel}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="labelVisivel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorGasto)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total 30 dias</p>
                <p className="font-semibold">{formatCurrency(totalPeriodo)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Maior gasto</p>
                <p className="font-semibold">{formatCurrency(maiorGasto)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
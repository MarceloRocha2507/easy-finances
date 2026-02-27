import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { ProjecaoMes } from "@/hooks/useSimuladorCompra";

interface Props {
  projecao: ProjecaoMes[];
  valorSeguranca: number;
}

function formatYAxis(value: number): string {
  if (value === 0) return "R$0";
  if (Math.abs(value) >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.fill }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export function GraficoProjecao({ projecao, valorSeguranca }: Props) {
  return (
    <Card className="border rounded-xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Projeção de Saldo — Próximos 12 Meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="min-w-[600px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={projecao}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="mesLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                {valorSeguranca > 0 && (
                  <ReferenceLine
                    y={valorSeguranca}
                    stroke="hsl(var(--warning, 45 93% 47%))"
                    strokeDasharray="5 5"
                    label={{
                      value: `Segurança: ${formatCurrency(valorSeguranca)}`,
                      position: "insideTopRight",
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                )}
                <Bar
                  dataKey="saldoSemCompra"
                  name="Sem compra"
                  fill="hsl(var(--muted-foreground))"
                  radius={[4, 4, 0, 0]}
                  opacity={0.4}
                />
                <Bar
                  dataKey="saldoComCompra"
                  name="Com compra"
                  radius={[4, 4, 0, 0]}
                >
                  {projecao.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.saldoComCompra < 0
                          ? "hsl(var(--destructive))"
                          : entry.saldoComCompra < valorSeguranca && valorSeguranca > 0
                          ? "hsl(45, 93%, 47%)"
                          : "hsl(var(--primary))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

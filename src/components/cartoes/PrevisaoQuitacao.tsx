import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CalendarCheck, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Parcelamento {
  id: string;
  descricao: string;
  valorTotal: number;
  valorParcela: number;
  totalParcelas: number;
  parcelasPagas: number;
  parcelasRestantes: number;
  cartaoNome: string;
  cartaoId: string;
  responsavelNome: string | null;
  proximaParcela: Date | null;
  tipo: "parcelado" | "fixo" | "recorrente";
}

interface Props {
  parcelamentos: Parcelamento[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-sm text-primary font-semibold">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function PrevisaoQuitacao({ parcelamentos }: Props) {
  const forecastData = useMemo(() => {
    const months: Record<string, number> = {};

    parcelamentos.forEach((p) => {
      if (p.tipo !== "parcelado" || !p.proximaParcela || p.parcelasRestantes <= 0) return;

      for (let i = 0; i < p.parcelasRestantes; i++) {
        const target = new Date(p.proximaParcela);
        target.setMonth(target.getMonth() + i);
        const key = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
        months[key] = (months[key] || 0) + p.valorParcela;
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => {
        const [year, month] = mes.split("-");
        const d = new Date(Number(year), Number(month) - 1);
        const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        return { mes, label, total };
      });
  }, [parcelamentos]);

  const dataQuitacao = useMemo(() => {
    if (forecastData.length === 0) return null;
    const last = forecastData[forecastData.length - 1];
    const [year, month] = last.mes.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [forecastData]);

  const totalComprometido = useMemo(() => {
    return forecastData.reduce((acc, d) => acc + d.total, 0);
  }, [forecastData]);

  if (forecastData.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-muted-foreground" />
        Previsão de Quitação
      </h2>

      {/* Highlight card */}
      <Card className="border-emerald-200/60 dark:border-emerald-800/30">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
            <CalendarCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Quitação total estimada</p>
            <p className="text-xl font-bold capitalize">{dataQuitacao}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total restante</p>
            <p className="text-lg font-semibold">{formatCurrency(totalComprometido)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Compromisso mensal com parcelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={forecastData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                fill="hsl(var(--foreground))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Resumo por mês
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {forecastData.map((item, idx) => {
            const isLast = idx === forecastData.length - 1;
            const maxTotal = forecastData[0]?.total || 1;
            const widthPercent = (item.total / maxTotal) * 100;

            return (
              <div key={item.mes} className="flex items-center gap-3 py-2">
                <span className="text-sm w-20 shrink-0 capitalize text-muted-foreground">
                  {item.label}
                </span>
                <div className="flex-1 relative h-4 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-foreground/80 transition-all"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-28 text-right tabular-nums">
                  {formatCurrency(item.total)}
                </span>
                {isLast && (
                  <Badge variant="outline" className="text-green-600 border-green-300 text-xs shrink-0">
                    Última
                  </Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

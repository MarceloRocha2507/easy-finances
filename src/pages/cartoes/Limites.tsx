import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Gauge, AlertTriangle, TrendingUp, PiggyBank } from "lucide-react";
import { useCartoes } from "@/services/cartoes";
import { formatCurrency } from "@/lib/formatters";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const CORES = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Limites() {
  const { data: cartoes = [], isLoading } = useCartoes();

  const analise = useMemo(() => {
    const limiteTotal = cartoes.reduce((acc, c) => acc + c.limite, 0);
    const usadoTotal = cartoes.reduce((acc, c) => acc + (c.limiteUsado || 0), 0);
    const disponivelTotal = limiteTotal - usadoTotal;
    const percentualGeral = limiteTotal > 0 ? (usadoTotal / limiteTotal) * 100 : 0;

    const cartoesAlerta = cartoes.filter((c) => {
      const perc = c.limite > 0 ? ((c.limiteUsado || 0) / c.limite) * 100 : 0;
      return perc >= 80;
    });

    const cartoesOrdenados = [...cartoes].sort((a, b) => {
      const percA = a.limite > 0 ? ((a.limiteUsado || 0) / a.limite) * 100 : 0;
      const percB = b.limite > 0 ? ((b.limiteUsado || 0) / b.limite) * 100 : 0;
      return percB - percA;
    });

    return {
      limiteTotal,
      usadoTotal,
      disponivelTotal,
      percentualGeral,
      cartoesAlerta,
      cartoesOrdenados,
    };
  }, [cartoes]);

  const dadosGrafico = useMemo(() => {
    return cartoes.map((c, i) => ({
      name: c.nome,
      value: c.limiteUsado || 0,
      limite: c.limite,
      fill: CORES[i % CORES.length],
    }));
  }, [cartoes]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  const getStatusColor = (percentual: number) => {
    if (percentual >= 90) return "destructive";
    if (percentual >= 70) return "warning";
    return "default";
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Limites</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Análise consolidada dos limites dos seus cartões
          </p>
        </div>

        {/* Alertas */}
        {analise.cartoesAlerta.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              {analise.cartoesAlerta.length === 1
                ? `O cartão ${analise.cartoesAlerta[0].nome} está com uso elevado do limite.`
                : `${analise.cartoesAlerta.length} cartões estão com uso elevado do limite.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Limite Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(analise.limiteTotal)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Usado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">{formatCurrency(analise.usadoTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {analise.percentualGeral.toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-income">{formatCurrency(analise.disponivelTotal)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Uso Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{analise.percentualGeral.toFixed(0)}%</p>
                <Badge variant={getStatusColor(analise.percentualGeral) as any}>
                  {analise.percentualGeral >= 80 ? "Alto" : analise.percentualGeral >= 50 ? "Médio" : "Baixo"}
                </Badge>
              </div>
              <Progress 
                value={analise.percentualGeral} 
                className={`h-2 mt-2 ${analise.percentualGeral >= 80 ? "[&>div]:bg-destructive" : ""}`}
              />
            </CardContent>
          </Card>
        </div>

        {/* Gráfico e lista lado a lado */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de pizza */}
          {cartoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosGrafico.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => 
                          percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                        }
                        labelLine={false}
                      >
                        {dadosGrafico.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de cartões */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhamento por Cartão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analise.cartoesOrdenados.map((cartao) => {
                const percentual = cartao.limite > 0 
                  ? ((cartao.limiteUsado || 0) / cartao.limite) * 100 
                  : 0;
                const disponivel = cartao.limite - (cartao.limiteUsado || 0);

                return (
                  <div key={cartao.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{cartao.nome}</span>
                        {percentual >= 80 && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{percentual.toFixed(0)}%</span>
                    </div>
                    
                    <Progress 
                      value={percentual} 
                      className={`h-2 ${percentual >= 80 ? "[&>div]:bg-destructive" : percentual >= 60 ? "[&>div]:bg-warning" : ""}`}
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Usado: {formatCurrency(cartao.limiteUsado || 0)}</span>
                      <span>Disponível: {formatCurrency(disponivel)}</span>
                    </div>
                  </div>
                );
              })}

              {cartoes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-4 opacity-30" />
                  <p>Nenhum cartão cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recomendações */}
        {analise.percentualGeral > 50 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">💡 Recomendações</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {analise.percentualGeral >= 80 && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <span>
                      Seu uso geral está muito alto. Considere pagar faturas antecipadamente 
                      ou reduzir gastos para evitar juros.
                    </span>
                  </li>
                )}
                {analise.cartoesAlerta.length > 0 && (
                  <li className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 text-warning mt-0.5" />
                    <span>
                      Distribua melhor os gastos entre seus cartões. 
                      {analise.cartoesAlerta.length === 1 
                        ? ` O cartão ${analise.cartoesAlerta[0].nome} pode ser aliviado.`
                        : ` ${analise.cartoesAlerta.length} cartões estão sobrecarregados.`
                      }
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                  <span>
                    Mantenha o uso abaixo de 30% do limite para melhorar seu score de crédito.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

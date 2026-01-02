import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAnaliseGastos, useOrcamentos } from "@/hooks/useEconomia";
import { FiltroPeriodo } from "@/components/dashboard/FiltroPeriodo";
import {
  RankingGastos,
  InsightsEconomia,
  OrcamentosCategoria,
  ResumoEconomia,
} from "@/components/economia";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingDown,
  Target,
  Lightbulb,
  BarChart3,
  PiggyBank,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function Economia() {
  const [mesReferencia, setMesReferencia] = useState(new Date());

  const {
    data: analise,
    isLoading: analiseLoading,
    refetch,
  } = useAnaliseGastos(mesReferencia);

  const {
    data: orcamentos,
    isLoading: orcamentosLoading,
    refetch: refetchOrcamentos,
  } = useOrcamentos(mesReferencia);

  const isLoading = analiseLoading || orcamentosLoading;

  // Dados para o gráfico de pizza
  const pieData =
    analise?.topGastos.map((g) => ({
      name: g.categoriaNome,
      value: g.total,
      color: g.categoriaCor,
    })) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <PiggyBank className="w-7 h-7" />
              Economia & Relatórios
            </h1>
            <p className="text-muted-foreground">
              Analise seus gastos e economize mais
            </p>
          </div>

          <FiltroPeriodo
            mesAtual={mesReferencia}
            onMesChange={setMesReferencia}
            onRefresh={() => {
              refetch();
              refetchOrcamentos();
            }}
            isLoading={isLoading}
          />
        </div>

        {/* Resumo */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <ResumoEconomia
            totalReceitas={analise?.totalReceitas || 0}
            totalGasto={analise?.totalGasto || 0}
            saldo={analise?.saldo || 0}
            economizado={analise?.economizado || 0}
            mediaDiaria={analise?.mediaDiaria || 0}
            previsaoMensal={analise?.previsaoMensal || 0}
            comparativo={
              analise?.comparativoMesAnterior || {
                diferenca: 0,
                percentual: 0,
                tipo: "igual",
              }
            }
          />
        )}

        {/* Tabs */}
        <Tabs defaultValue="visao-geral">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visao-geral" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="orcamentos" className="gap-2">
              <Target className="w-4 h-4" />
              Orçamentos
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="visao-geral" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Pizza */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Distribuição de Gastos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] rounded-xl" />
                  ) : pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={2}
                          label={({ percent }) =>
                            `${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum gasto registrado</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ranking de Gastos */}
              {isLoading ? (
                <Skeleton className="h-[400px] rounded-xl" />
              ) : (
                <RankingGastos
                  gastos={analise?.gastosPorCategoria || []}
                  totalGasto={analise?.totalGasto || 0}
                />
              )}
            </div>

            {/* Previsão */}
            {!isLoading && analise && analise.previsaoMensal > 0 && (
              <Card className="border-0 shadow-lg mt-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        📊 Previsão de Gastos até o Fim do Mês
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analise.previsaoMensal)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Baseado na sua média diária de{" "}
                        {formatCurrency(analise.mediaDiaria)}
                      </p>
                    </div>
                    {analise.totalReceitas > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">
                          Você terá economizado
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            analise.totalReceitas - analise.previsaoMensal >= 0
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {formatCurrency(
                            Math.max(
                              analise.totalReceitas - analise.previsaoMensal,
                              0
                            )
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Orçamentos */}
          <TabsContent value="orcamentos" className="mt-6">
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-xl" />
            ) : (
              <OrcamentosCategoria
                orcamentos={orcamentos || []}
                mesReferencia={mesReferencia}
                onUpdate={() => {
                  refetch();
                  refetchOrcamentos();
                }}
              />
            )}

            {/* Dicas sobre orçamento */}
            <Card className="border-0 shadow-lg mt-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Dicas para Definir Orçamentos
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    💡 <strong>50/30/20:</strong> Destine 50% para necessidades,
                    30% para desejos e 20% para economias
                  </li>
                  <li>
                    💡 <strong>Comece pequeno:</strong> Defina limites para suas
                    3 maiores categorias de gasto primeiro
                  </li>
                  <li>
                    💡 <strong>Seja realista:</strong> Baseie os limites nos
                    seus gastos médios dos últimos meses
                  </li>
                  <li>
                    💡 <strong>Revise mensalmente:</strong> Ajuste os limites
                    conforme sua realidade financeira
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Insights */}
          <TabsContent value="insights" className="mt-6">
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-xl" />
            ) : (
              <InsightsEconomia insights={analise?.insights || []} />
            )}

            {/* Regras de economia */}
            <Card className="border-0 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5" />
                  Regras de Ouro para Economizar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="font-semibold text-emerald-600 mb-2">
                      ✅ Pague-se Primeiro
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Separe pelo menos 10% do seu salário para economias antes
                      de gastar com qualquer outra coisa.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <h4 className="font-semibold text-blue-600 mb-2">
                      ✅ Regra das 24 Horas
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Antes de compras não essenciais, espere 24 horas. Se ainda
                      quiser, compre.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <h4 className="font-semibold text-purple-600 mb-2">
                      ✅ Fundo de Emergência
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Tenha guardado o equivalente a 3-6 meses de despesas para
                      imprevistos.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <h4 className="font-semibold text-amber-600 mb-2">
                      ✅ Revise Assinaturas
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Cancele serviços que você não usa. Pequenos valores somam
                      muito ao longo do ano.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAnaliseGastos, useOrcamentos } from "@/hooks/useEconomia";
import { FiltroPeriodo, PieChartWithLegend } from "@/components/dashboard";
import {
  RankingGastos,
  InsightsEconomia,
  OrcamentosCategoria,
  ResumoEconomia,
} from "@/components/economia";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";

export default function Economia() {
  const [mesReferencia, setMesReferencia] = useState(new Date());

  const {
    data: analise,
    isLoading: analiseLoading,
    isFetching: analiseFetching,
    refetch,
  } = useAnaliseGastos(mesReferencia);

  const {
    data: orcamentos,
    isLoading: orcamentosLoading,
    isFetching: orcamentosFetching,
    refetch: refetchOrcamentos,
  } = useOrcamentos(mesReferencia);

  const isLoading = analiseLoading || orcamentosLoading;
  const isFetching = analiseFetching || orcamentosFetching;

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
            <h1 className="text-xl font-semibold text-foreground">
              Economia
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe seus gastos e orçamentos
            </p>
          </div>

          <FiltroPeriodo
            mesAtual={mesReferencia}
            onMesChange={setMesReferencia}
            onRefresh={() => {
              refetch();
              refetchOrcamentos();
            }}
            isLoading={isFetching}
          />
        </div>

        {/* Resumo */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto">
            <TabsTrigger
              value="visao-geral"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="orcamentos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              Orçamentos
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="visao-geral" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Pizza Padronizado */}
              {isLoading ? (
                <Skeleton className="h-[350px] rounded-xl" />
              ) : (
                <PieChartWithLegend data={pieData} />
              )}

              {/* Ranking de Gastos */}
              {isLoading ? (
                <Skeleton className="h-[350px] rounded-xl" />
              ) : (
                <RankingGastos
                  gastos={analise?.gastosPorCategoria || []}
                  totalGasto={analise?.totalGasto || 0}
                />
              )}
            </div>

            {/* Previsão */}
            {!isLoading && analise && analise.previsaoMensal > 0 && (
              <Card className="mt-6 shadow-sm rounded-xl">
                <CardContent className="py-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Previsão de gastos até o fim do mês
                      </p>
                      <p className="text-xl font-semibold mt-0.5">
                        {formatCurrency(analise.previsaoMensal)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Média diária de {formatCurrency(analise.mediaDiaria)}
                      </p>
                    </div>
                    {analise.totalReceitas > 0 && (
                      <div className="sm:text-right">
                        <p className="text-sm text-muted-foreground">
                          Economia prevista
                        </p>
                        <p
                          className={`text-xl font-semibold mt-0.5 ${
                            analise.totalReceitas - analise.previsaoMensal >= 0
                              ? "text-income"
                              : "text-expense"
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
            <Card className="mt-6 bg-muted/30 shadow-sm rounded-xl">
              <CardContent className="py-4 sm:py-6">
                <h3 className="font-medium mb-3 text-sm sm:text-base">
                  Dicas para definir orçamentos
                </h3>
                <div className="grid sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Regra 50/30/20:</strong>{" "}
                    50% para necessidades, 30% para desejos, 20% para economias
                  </p>
                  <p>
                    <strong className="text-foreground">Comece pequeno:</strong>{" "}
                    Defina limites para suas 3 maiores categorias primeiro
                  </p>
                  <p className="hidden sm:block">
                    <strong className="text-foreground">Seja realista:</strong>{" "}
                    Baseie os limites nos seus gastos médios
                  </p>
                  <p className="hidden sm:block">
                    <strong className="text-foreground">Revise mensalmente:</strong>{" "}
                    Ajuste conforme sua realidade financeira
                  </p>
                </div>
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

            {/* Regras de economia - esconder em mobile */}
            <Card className="mt-6 shadow-sm rounded-xl hidden sm:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">
                  Princípios para economizar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-muted/20">
                    <h4 className="font-medium text-sm mb-1.5">
                      Pague-se primeiro
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Separe pelo menos 10% do seu salário para economias antes
                      de gastar com qualquer outra coisa.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/20">
                    <h4 className="font-medium text-sm mb-1.5">
                      Regra das 24 horas
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Antes de compras não essenciais, espere 24 horas. Se ainda
                      quiser, compre.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/20">
                    <h4 className="font-medium text-sm mb-1.5">
                      Fundo de emergência
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Tenha guardado o equivalente a 3-6 meses de despesas para
                      imprevistos.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/20">
                    <h4 className="font-medium text-sm mb-1.5">
                      Revise assinaturas
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

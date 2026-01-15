import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvestimentos, Investimento } from "@/hooks/useInvestimentos";
import { formatCurrency } from "@/lib/formatters";
import {
  InvestimentoCard,
  NovoInvestimentoDialog,
  NovoAporteDialog,
  DetalhesInvestimentoDialog,
} from "@/components/investimentos";
import {
  Plus,
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowUpRight,
} from "lucide-react";

export default function Investimentos() {
  const { data: investimentos = [], isLoading } = useInvestimentos();

  const [novoOpen, setNovoOpen] = useState(false);
  const [investimentoSelecionado, setInvestimentoSelecionado] =
    useState<Investimento | null>(null);
  const [aporteOpen, setAporteOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);

  // Separar investimentos ativos e encerrados
  const investimentosAtivos = useMemo(
    () => investimentos.filter((inv) => inv.ativo),
    [investimentos]
  );
  const investimentosEncerrados = useMemo(
    () => investimentos.filter((inv) => !inv.ativo),
    [investimentos]
  );

  // Calcular totais
  const totais = useMemo(() => {
    const patrimonioTotal = investimentosAtivos.reduce(
      (acc, inv) => acc + inv.valorAtual,
      0
    );
    const investidoTotal = investimentosAtivos.reduce(
      (acc, inv) => acc + inv.valorInicial,
      0
    );
    const rendimentoTotal = patrimonioTotal - investidoTotal;
    const percentualRendimento =
      investidoTotal > 0
        ? ((rendimentoTotal / investidoTotal) * 100).toFixed(2)
        : "0.00";

    return {
      patrimonio: patrimonioTotal,
      investido: investidoTotal,
      rendimento: rendimentoTotal,
      percentual: percentualRendimento,
    };
  }, [investimentosAtivos]);

  const handleAportar = (investimento: Investimento) => {
    setInvestimentoSelecionado(investimento);
    setAporteOpen(true);
  };

  const handleDetalhes = (investimento: Investimento) => {
    setInvestimentoSelecionado(investimento);
    setDetalhesOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Investimentos</h1>
            <p className="text-muted-foreground">
              Acompanhe seu patrimônio e investimentos
            </p>
          </div>
          <Button onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo investimento
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Patrimônio total */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patrimônio total</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className="text-xl font-bold">
                    {formatCurrency(totais.patrimonio)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Total investido */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <PiggyBank className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total investido</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className="text-xl font-bold">
                    {formatCurrency(totais.investido)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rendimento total */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rendimento total</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p
                    className={`text-xl font-bold ${
                      totais.rendimento >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {totais.rendimento >= 0 ? "+" : ""}
                    {formatCurrency(totais.rendimento)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rentabilidade */}
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ArrowUpRight className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rentabilidade</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <p
                    className={`text-xl font-bold ${
                      parseFloat(totais.percentual) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {parseFloat(totais.percentual) >= 0 ? "+" : ""}
                    {totais.percentual}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de investimentos */}
        <Tabs defaultValue="ativos" className="w-full">
          <TabsList>
            <TabsTrigger value="ativos">
              Ativos ({investimentosAtivos.length})
            </TabsTrigger>
            <TabsTrigger value="encerrados">
              Encerrados ({investimentosEncerrados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : investimentosAtivos.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum investimento ainda
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comece a acompanhar seus investimentos
                </p>
                <Button onClick={() => setNovoOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro investimento
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {investimentosAtivos.map((investimento) => (
                  <InvestimentoCard
                    key={investimento.id}
                    investimento={investimento}
                    onAportar={() => handleAportar(investimento)}
                    onDetalhes={() => handleDetalhes(investimento)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="encerrados" className="mt-4">
            {investimentosEncerrados.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <p className="text-muted-foreground">
                  Nenhum investimento encerrado
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {investimentosEncerrados.map((investimento) => (
                  <InvestimentoCard
                    key={investimento.id}
                    investimento={investimento}
                    onAportar={() => {}}
                    onDetalhes={() => handleDetalhes(investimento)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <NovoInvestimentoDialog open={novoOpen} onOpenChange={setNovoOpen} />
      <NovoAporteDialog
        open={aporteOpen}
        onOpenChange={setAporteOpen}
        investimento={investimentoSelecionado}
      />
      <DetalhesInvestimentoDialog
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        investimento={investimentoSelecionado}
      />
    </Layout>
  );
}

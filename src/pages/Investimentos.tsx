import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

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
            <h1 className="text-xl font-semibold text-foreground">Investimentos</h1>
            <p className="text-muted-foreground">
              Acompanhe seu patrimônio e investimentos
            </p>
          </div>
          <Button size="sm" onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Novo investimento
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Patrimônio total */}
          <Card className="gradient-neutral shadow-lg rounded-xl border-0 animate-fade-in-up">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Patrimônio total</p>
              {isLoading ? (
                <Skeleton className="h-7 sm:h-8 w-24 sm:w-28 mt-1" />
              ) : (
                <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(totais.patrimonio)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Total investido */}
          <Card className="shadow-sm rounded-xl border-l-4 border-l-blue-500 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <PiggyBank className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total investido</p>
              {isLoading ? (
                <Skeleton className="h-7 sm:h-8 w-24 sm:w-28 mt-1" />
              ) : (
                <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(totais.investido)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rendimento total */}
          <Card className={cn(
            "shadow-lg rounded-xl border-0 animate-fade-in-up",
            totais.rendimento >= 0 ? "gradient-income" : "gradient-expense"
          )} style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center",
                  totais.rendimento >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                )}>
                  <TrendingUp className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6",
                    totais.rendimento >= 0 ? "text-emerald-600" : "text-rose-600"
                  )} />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Rendimento total</p>
              {isLoading ? (
                <Skeleton className="h-7 sm:h-8 w-24 sm:w-28 mt-1" />
              ) : (
                <p
                  className={cn(
                    "text-xl sm:text-2xl md:text-3xl font-bold mt-0.5 sm:mt-1 truncate",
                    totais.rendimento >= 0 ? "text-income" : "text-expense"
                  )}
                >
                  {totais.rendimento >= 0 ? "+" : ""}
                  {formatCurrency(totais.rendimento)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rentabilidade */}
          <Card className="shadow-sm rounded-xl border-l-4 border-l-purple-500 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Rentabilidade</p>
              {isLoading ? (
                <Skeleton className="h-7 sm:h-8 w-16 sm:w-20 mt-1" />
              ) : (
                <p
                  className={cn(
                    "text-xl sm:text-2xl md:text-3xl font-bold mt-0.5 sm:mt-1",
                    parseFloat(totais.percentual) >= 0 ? "text-income" : "text-expense"
                  )}
                >
                  {parseFloat(totais.percentual) >= 0 ? "+" : ""}
                  {totais.percentual}%
                </p>
              )}
            </CardContent>
          </Card>
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

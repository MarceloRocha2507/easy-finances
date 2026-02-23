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
import { StatCardPrimary } from "@/components/dashboard/StatCardPrimary";
import { StatCardSecondary } from "@/components/dashboard/StatCardSecondary";
import { EmptyState } from "@/components/ui/empty-state";
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
          {isLoading ? (
            <>
              {[0,1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </>
          ) : (
            <>
              <StatCardPrimary
                title="Patrimônio total"
                value={totais.patrimonio}
                icon={Wallet}
                type="neutral"
                delay={0}
              />
              <StatCardSecondary
                title="Total investido"
                value={totais.investido}
                icon={PiggyBank}
                status="pending"
                delay={0.05}
              />
              <StatCardPrimary
                title="Rendimento total"
                value={totais.rendimento}
                icon={TrendingUp}
                type={totais.rendimento >= 0 ? "income" : "expense"}
                delay={0.1}
              />
              <StatCardSecondary
                title="Rentabilidade"
                value={parseFloat(totais.percentual)}
                icon={ArrowUpRight}
                status={parseFloat(totais.percentual) >= 0 ? "success" : "danger"}
                formatValue={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`}
                delay={0.15}
              />
            </>
          )}
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
              <EmptyState
                icon={PiggyBank}
                title="Nenhum investimento ainda"
                message="Comece a acompanhar seus investimentos"
                action={{ label: "Criar primeiro investimento", onClick: () => setNovoOpen(true) }}
              />
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
              <EmptyState
                icon={PiggyBank}
                message="Nenhum investimento encerrado"
              />
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

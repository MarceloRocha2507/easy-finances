import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import {
  useTransactionStats,
  useExpensesByCategory,
  useMonthlyData,
  useCompleteStats,
} from "@/hooks/useTransactions";
import { useDashboardCompleto, CartaoDashboard } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Wallet, TrendingUp, TrendingDown, Plus, Pencil, Clock, AlertTriangle, CreditCard, BarChart3, CheckCircle, HelpCircle, Calculator } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  AlertasInteligentes,
  ProximasFaturas,
  UltimasCompras,
  GastosDiarios,
  ComparativoMensal,
  MetasEconomia,
  FiltroPeriodo,
  CartoesCredito,
  StatCardMinimal,
  PieChartWithLegend,
  ContasAPagar,
} from "@/components/dashboard";

import { NovaMetaDialog } from "@/components/dashboard/NovaMetaDialog";
import { GerenciarMetaDialog } from "@/components/dashboard/GerenciarMetaDialog";
import { DetalhesDespesasDialog } from "@/components/dashboard/DetalhesDespesasDialog";
import { Progress } from "@/components/ui/progress";
import { Meta } from "@/hooks/useDashboardCompleto";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";
import { EditarSaldoDialog } from "@/components/EditarSaldoDialog";

function formatYAxis(value: number): string {
  if (value === 0) return "R$0";
  if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium capitalize mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.fill }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoDashboard | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  const [gerenciarMetaOpen, setGerenciarMetaOpen] = useState(false);
  const [editarSaldoOpen, setEditarSaldoOpen] = useState(false);
  const [despesasDialogOpen, setDespesasDialogOpen] = useState(false);

  // Calcular range do mês selecionado
  const inicioMesSelecionado = `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, '0')}-01`;
  const fimMesSelecionado = (() => { const d = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

  const { data: stats } = useTransactionStats({
    startDate: inicioMesSelecionado,
    endDate: fimMesSelecionado,
  });
  const { data: expensesByCategory, isFetching: isCategoryFetching } = useExpensesByCategory({
    startDate: inicioMesSelecionado,
    endDate: fimMesSelecionado,
  });
  const { data: monthlyData, isFetching: isMonthlyFetching } = useMonthlyData(mesReferencia.getFullYear());
  const { data: completeStats, isFetching: isStatsFetching } = useCompleteStats(mesReferencia);

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    refetch,
  } = useDashboardCompleto(mesReferencia);

  const pieData =
    expensesByCategory?.map((cat) => ({
      name: cat.name,
      value: cat.total,
      color: cat.color,
    })) || [];

  function handleCartaoClick(cartao: CartaoDashboard) {
    setCartaoSelecionado(cartao);
    setDetalhesOpen(true);
  }

  const hasMonthlyData = monthlyData?.some(
    (m) => m.income > 0 || m.expense > 0
  );

  return (
    <Layout>
      <div className="page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Olá, {user?.user_metadata?.full_name || "Usuário"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FiltroPeriodo
            mesAtual={mesReferencia}
            onMesChange={setMesReferencia}
            onRefresh={() => refetch()}
            isLoading={isFetching}
          />
        </div>
      </div>

      {/* Alertas */}
      {dashboardData?.alertas && dashboardData.alertas.length > 0 && (
        <div className="mb-6">
          <AlertasInteligentes alertas={dashboardData.alertas} />
        </div>
      )}

      {/* Card Resultado do Mês */}
      {(() => {
        const resultado = (completeStats?.completedIncome || 0) - (completeStats?.completedExpense || 0);
        const isPositive = resultado >= 0;
        return (
          <Card
            className="mb-3 rounded-xl border shadow-sm animate-fade-in"
            style={{ backgroundColor: isPositive ? '#F0FDF4' : '#FEF2F2' }}
          >
            <CardContent className="flex flex-col items-center justify-center py-5 gap-1">
              {isStatsFetching ? (
                <Skeleton className="h-10 w-48" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isPositive ? <CheckCircle className="w-4 h-4 text-[hsl(var(--income))]" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                    <span>Resultado do Mês</span>
                  </div>
                  <p className={`text-2xl font-bold ${isPositive ? 'text-[hsl(var(--income))]' : 'text-destructive'}`}>
                    {formatCurrency(resultado)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPositive ? 'Suas finanças estão no azul este mês.' : 'Você gastou mais do que recebeu este mês.'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Stats Cards - Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <StatCardMinimal
          title="Saldo Disponível"
          value={completeStats?.saldoDisponivel || 0}
          icon={Wallet}
          delay={0.05}
          isLoading={isStatsFetching}
          actions={
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setEditarSaldoOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          }
          subInfo={
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                Estimado: {formatCurrency(completeStats?.estimatedBalance || 0)}
              </span>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Saldo real + receitas pendentes − despesas pendentes − fatura do cartão</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          }
        />

        <StatCardMinimal
          title="Receitas"
          value={completeStats?.completedIncome || 0}
          icon={TrendingUp}
          delay={0.1}
          isLoading={isStatsFetching}
          subInfo={<span className="hidden sm:inline">recebidas</span>}
        />

        <StatCardMinimal
          title="Despesas"
          value={completeStats?.completedExpense || 0}
          icon={TrendingDown}
          prefix="-"
          delay={0.15}
          isLoading={isStatsFetching}
          subInfo={<span className="hidden sm:inline">pagas</span>}
        />
      </div>

      {/* Cards Pendentes (condicional) */}
      {(() => {
        const pendingIncome = completeStats?.pendingIncome || 0;
        const pendingExpense = completeStats?.pendingExpense || 0;
        const faturaCartao = completeStats?.faturaCartao || 0;
        const hasAnyPending = pendingIncome > 0 || pendingExpense > 0 || faturaCartao > 0;

        if (!hasAnyPending) return null;

        const cards = [];
        if (pendingIncome > 0) cards.push(
          <StatCardMinimal key="receber" title="A Receber" value={pendingIncome} icon={Clock} prefix="+" subInfo="pendentes" delay={0.2} isLoading={isStatsFetching} />
        );
        if (pendingExpense > 0) cards.push(
          <StatCardMinimal key="pagar" title="A Pagar" value={pendingExpense} icon={AlertTriangle} prefix="-" subInfo={(completeStats?.overdueCount || 0) > 0 ? `${completeStats?.overdueCount} vencida(s)` : "pendentes"} delay={0.25} isLoading={isStatsFetching} />
        );
        if (faturaCartao > 0) cards.push(
          <StatCardMinimal key="fatura" title="Fatura Cartão" value={faturaCartao} icon={CreditCard} prefix="-" subInfo="titular do mês" delay={0.3} isLoading={isStatsFetching} />
        );

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {cards}
          </div>
        );
      })()}





      {/* Contas a Pagar */}
      <ContasAPagar mesReferencia={mesReferencia} rendaMensal={completeStats?.completedIncome || 0} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="border rounded-xl shadow-sm animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Receitas vs Despesas ({mesReferencia.getFullYear()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isMonthlyFetching ? (
              <div className="h-[220px] flex items-center justify-center">
                <Skeleton className="w-full h-[200px] rounded-xl" />
              </div>
            ) : hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
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
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="income"
                    fill="hsl(var(--income))"
                    name="Receitas"
                    radius={[4, 4, 0, 0]}
                    animationBegin={200}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="expense"
                    fill="hsl(var(--expense))"
                    name="Despesas"
                    radius={[4, 4, 0, 0]}
                    animationBegin={200}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhum dado registrado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <PieChartWithLegend data={pieData} delay={0.45} isLoading={isCategoryFetching} />
      </div>

      {/* Comparativo + Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {dashboardData?.comparativo && (
          <div className="hidden sm:block">
            <ComparativoMensal comparativo={dashboardData.comparativo} />
          </div>
        )}
        {dashboardData?.gastosDiarios && (
          <GastosDiarios dados={dashboardData.gastosDiarios} />
        )}
      </div>

      {/* Cartões */}
      <div className="mb-6">
        <CartoesCredito
          cartoes={dashboardData?.cartoes || []}
          resumo={
            dashboardData?.resumo || {
              totalFaturaMes: 0,
              totalPendente: 0,
              totalPago: 0,
              limiteTotal: 0,
              limiteDisponivel: 0,
              quantidadeCartoes: 0,
            }
          }
          isLoading={isLoading}
          onCartaoClick={handleCartaoClick}
        />
      </div>

      {/* Faturas + Compras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ProximasFaturas
          faturas={dashboardData?.proximasFaturas || []}
          onCartaoClick={(cartaoId) => {
            const cartao = dashboardData?.cartoes.find((c) => c.id === cartaoId);
            if (cartao) handleCartaoClick(cartao);
          }}
        />
        <UltimasCompras compras={dashboardData?.ultimasCompras || []} />
      </div>

      {/* Metas */}
      <div className="mb-6">
        <MetasEconomia
          metas={dashboardData?.metas || []}
          onNovaMeta={() => setNovaMetaOpen(true)}
          onMetaClick={(meta) => {
            setMetaSelecionada(meta);
            setGerenciarMetaOpen(true);
          }}
        />
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-6">
        <Link to="/transactions">
          <Button size="lg" className="rounded-full h-14 w-14 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-110">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      {/* Modals */}
      {cartaoSelecionado && (
        <DetalhesCartaoDialog
          cartao={cartaoSelecionado as any}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
          onUpdated={() => refetch()}
          mesInicial={mesReferencia}
        />
      )}

      <NovaMetaDialog
        open={novaMetaOpen}
        onOpenChange={setNovaMetaOpen}
        onSuccess={() => refetch()}
      />

      <GerenciarMetaDialog
        meta={metaSelecionada}
        open={gerenciarMetaOpen}
        onOpenChange={setGerenciarMetaOpen}
        onSuccess={() => refetch()}
      />

      <EditarSaldoDialog
        open={editarSaldoOpen}
        onOpenChange={setEditarSaldoOpen}
      />

      <DetalhesDespesasDialog
        open={despesasDialogOpen}
        onOpenChange={setDespesasDialogOpen}
        mesReferencia={mesReferencia}
        pendingExpense={completeStats?.pendingExpense || 0}
        faturaCartao={completeStats?.faturaCartao || 0}
      />
      </div>
    </Layout>
  );
}

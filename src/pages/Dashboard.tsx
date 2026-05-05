import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import {
  useTransactionStats,
  useExpensesByCategory,
  useMonthlyData,
  useCompleteStats,
} from "@/hooks/useTransactions";
import { useMesesComMovimentacao } from "@/hooks/useMesesComMovimentacao";
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
import { Wallet, TrendingUp, TrendingDown, Plus, Pencil, Clock, AlertTriangle, CreditCard, BarChart3, CheckCircle, HelpCircle, Calculator, RefreshCw } from "lucide-react";
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
  TotalAPagarCard,
  TotalAReceberCard,
  GlobalSearch,
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
  const isMobile = useIsMobile();
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

  const { data: mesesDisponiveis } = useMesesComMovimentacao();

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
      <div className="flex flex-col gap-4 mb-6">
        {/* Linha 1: Saudação e refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm text-muted-foreground truncate">
              Olá, {user?.user_metadata?.full_name || "Usuário"}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <GlobalSearch variant="icon" />
            <Link to="/transactions">
              <Button variant="ghost" size="sm" className="text-primary gap-1.5 px-2 sm:px-3">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Novo Registro</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Linha 2: Filtro de período */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <FiltroPeriodo
            mesAtual={mesReferencia}
            onMesChange={setMesReferencia}
            mesesDisponiveis={mesesDisponiveis}
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
        const resultado = (completeStats?.completedIncome || 0) - (completeStats?.completedExpenseWithFatura || 0);
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

      {/* Dois painéis agrupados: Visão Geral + Este Mês */}
      {(() => {
        const pendingIncome = completeStats?.pendingIncome || 0;
        const pendingExpense = completeStats?.pendingExpense || 0;
        const faturaCartao = completeStats?.faturaCartao || 0;
        const totalAPagar = pendingExpense + faturaCartao;
        const completedIncome = completeStats?.completedIncome || 0;
        const completedExpense = completeStats?.completedExpenseWithFatura || 0;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4 animate-fade-in">
            {/* PAINEL 1 — Visão Geral (2/5) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
              <div className="px-5 pt-4 pb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Visão Geral
                </h3>
              </div>

              {/* Hero - Saldo Disponível */}
              <div className="relative px-5 py-4">
                <div className="absolute top-4 right-5 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditarSaldoOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Wallet className="h-4 w-4 text-foreground/30" />
                </div>
                <p className="text-[#6B7280] text-xs mb-1.5">Saldo Disponível</p>
                {isStatsFetching ? (
                  <Skeleton className="h-8 w-44" />
                ) : (
                  <p className="text-2xl sm:text-[26px] font-bold tabular-nums text-[#111827]">
                    {formatCurrency(completeStats?.saldoDisponivel || 0)}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] text-[#6B7280]">
                    Estimado: {formatCurrency(completeStats?.estimatedBalance || 0)}
                  </span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                          <HelpCircle className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">Saldo real + receitas pendentes − despesas pendentes − fatura do cartão</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] dark:border-[#2a2a2a]" />

              {/* Despesas (este mês) + clique para detalhes */}
              <div className="grid grid-cols-1 flex-1">
                <UnifiedMetricTile
                  title="Despesas"
                  value={completedExpense}
                  icon={TrendingDown}
                  prefix="-"
                  valueColor="expense"
                  subInfo="total do mês (inclui fatura) · clique para detalhes"
                  onClick={() => setDespesasDialogOpen(true)}
                  isLoading={isStatsFetching}
                />
              </div>
            </div>

            {/* PAINEL 2 — Este Mês (3/5) */}
            <div className="lg:col-span-3 bg-white dark:bg-[#1a1a1a] border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col">
              <div className="px-5 pt-4 pb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Este Mês
                </h3>
              </div>

              <div className="border-t border-[#E5E7EB] dark:border-[#2a2a2a]" />

              <div className="grid grid-cols-2 sm:grid-cols-2 divide-x divide-y sm:divide-y-0 divide-[#E5E7EB] dark:divide-[#2a2a2a] flex-1">
                <UnifiedMetricTile
                  title="Receitas"
                  value={completedIncome}
                  icon={TrendingUp}
                  subInfo="recebidas"
                  isLoading={isStatsFetching}
                />
                <UnifiedMetricTile
                  title="A Receber"
                  value={pendingIncome}
                  icon={TrendingUp}
                  prefix="+"
                  valueColor="income"
                  subInfo="pendentes"
                  isLoading={isStatsFetching}
                />
                <UnifiedMetricTile
                  title="A Pagar"
                  value={totalAPagar}
                  icon={TrendingDown}
                  prefix="-"
                  valueColor="expense"
                  subInfo={
                    faturaCartao > 0 ? (
                      <>
                        {formatCurrency(pendingExpense)} pendente
                        <span className="text-muted-foreground/60"> + {formatCurrency(faturaCartao)} fatura</span>
                      </>
                    ) : (
                      "referente a este mês"
                    )
                  }
                  isLoading={isStatsFetching}
                />
                <UnifiedMetricTile
                  title="Saldo do Mês"
                  value={completedIncome - completedExpense}
                  icon={Calculator}
                  valueColor={completedIncome - completedExpense >= 0 ? "income" : "expense"}
                  subInfo="receitas − despesas"
                  isLoading={isStatsFetching}
                />
              </div>
            </div>
          </div>
        );
      })()}







      {/* Receitas vs Despesas - largura total */}
      <Card className="border rounded-xl shadow-sm animate-fade-in mb-4" style={{ animationDelay: '0.5s', opacity: 0 }}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2 whitespace-nowrap">
              <BarChart3 className="w-4 h-4 shrink-0" />
              Receitas vs Despesas ({mesReferencia.getFullYear()})
            </CardTitle>
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                Receitas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f87171' }} />
                Despesas
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isMonthlyFetching ? (
            <div className={`${isMobile ? 'h-[220px]' : 'h-[280px]'} flex items-center justify-center`}>
              <Skeleton className="w-full h-full rounded-xl" />
            </div>
          ) : hasMonthlyData ? (
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 5, left: isMobile ? -10 : 0, bottom: 0 }}
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
                  tick={{ fontSize: isMobile ? 10 : 11 }}
                  tickFormatter={(value: string) => isMobile ? value.slice(0, 3) + '.' : value}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: isMobile ? 10 : 11 }}
                  width={isMobile ? 45 : 60}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="income"
                  fill="#22c55e"
                  name="Receitas"
                  radius={[6, 6, 0, 0]}
                  animationBegin={200}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="expense"
                  fill="#f87171"
                  name="Despesas"
                  radius={[6, 6, 0, 0]}
                  animationBegin={200}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`${isMobile ? 'h-[220px]' : 'h-[280px]'} flex items-center justify-center text-sm text-muted-foreground`}>
              <div className="text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhum dado registrado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categoria + Comparativo lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <PieChartWithLegend data={pieData} delay={0.45} isLoading={isCategoryFetching} />
        {dashboardData?.comparativo && (
          <div className="hidden sm:block">
            <ComparativoMensal comparativo={dashboardData.comparativo} />
          </div>
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

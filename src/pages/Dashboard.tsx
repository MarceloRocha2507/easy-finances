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
import { UnifiedMetricTile } from "@/components/dashboard/UnifiedMetricTile";
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
        {/* Linha 1: Saudação e ações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-violet shrink-0 animate-pulse" />
              <p className="font-display font-bold text-base text-foreground truncate">
                {(() => {
                  const fullName = user?.user_metadata?.full_name || "Usuário";
                  return fullName.split(" ")[0];
                })()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <GlobalSearch variant="icon" />
            <Link to="/transactions">
              <Button
                size="sm"
                className="gap-1.5 px-3 sm:px-4 text-white font-display font-semibold text-xs"
                style={{ backgroundColor: 'hsl(var(--accent-violet))', boxShadow: '0 2px 8px hsl(var(--accent-violet) / 0.3)' }}
              >
                <Plus className="w-4 h-4" />
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

      {/* Card Resultado do Mês — Hero Banner */}
      {(() => {
        const resultado = (completeStats?.completedIncome || 0) - (completeStats?.completedExpenseWithFatura || 0);
        const isPositive = resultado >= 0;
        const dayOfMonth = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);
        return (
          <div
            className={`mb-3 rounded-2xl border overflow-hidden animate-fade-in relative ${isPositive ? 'resultado-hero-positive border-emerald-100 dark:border-emerald-900/40' : 'resultado-hero-negative border-rose-100 dark:border-rose-900/40'}`}
          >
            {/* Decorative blur circle */}
            <div
              className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
              style={{ backgroundColor: isPositive ? '#16a34a' : '#dc2626' }}
            />
            <div className="flex flex-col items-center justify-center py-6 px-4 gap-1.5 relative z-10">
              {isStatsFetching ? (
                <Skeleton className="h-12 w-48" />
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground">
                    {isPositive
                      ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--income))]" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    }
                    <span>Resultado do Mês</span>
                  </div>
                  <p className={`text-4xl sm:text-5xl font-display font-extrabold tabular-nums tracking-tight ${isPositive ? 'text-[hsl(var(--income))]' : 'text-destructive'}`}>
                    {formatCurrency(resultado)}
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    {isPositive ? 'Finanças no azul este mês.' : 'Gastos acima das receitas este mês.'}
                  </p>
                </>
              )}
            </div>
            {/* Month progress bar */}
            <div className="h-1 w-full bg-black/5 dark:bg-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-emerald-500/60' : 'bg-rose-500/60'}`}
                style={{ width: `${monthProgress}%` }}
              />
            </div>
          </div>
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
            <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
              <div className="px-5 pt-4 pb-3">
                <h3 className="section-title-accent text-[11px] text-accent-violet">
                  Visão Geral
                </h3>
              </div>

              {/* Hero - Saldo Disponível */}
              <div className="relative px-5 py-4">
                <div className="absolute top-4 right-5 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
                    onClick={() => setEditarSaldoOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Wallet className="h-3.5 w-3.5 text-foreground/20" />
                </div>
                <p className="font-display text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Saldo Disponível</p>
                {isStatsFetching ? (
                  <Skeleton className="h-10 w-44" />
                ) : (
                  <p className="text-3xl sm:text-4xl font-display font-extrabold tabular-nums tracking-tight text-foreground">
                    {formatCurrency(completeStats?.saldoDisponivel || 0)}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[11px] text-muted-foreground/70">
                    Estimado: {formatCurrency(completeStats?.estimatedBalance || 0)}
                  </span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
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

              <div className="border-t border-[#E5E7EB] dark:border-[#111827]" />

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
            <div className="lg:col-span-3 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#111827] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
              <div className="px-5 pt-4 pb-3">
                <h3 className="section-title-accent text-[11px] text-accent-violet">
                  Este Mês
                </h3>
              </div>

              <div className="border-t border-[#E5E7EB] dark:border-[#111827]" />

              <div className="grid grid-cols-2 sm:grid-cols-2 divide-x divide-y sm:divide-y-0 divide-[#E5E7EB] dark:divide-[#111827] flex-1">
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
      <Card className="border rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] animate-fade-in mb-4 overflow-hidden" style={{ animationDelay: '0.5s', opacity: 0 }}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <CardTitle className="section-title-accent text-sm sm:text-base text-accent-violet flex items-center gap-2">
              <BarChart3 className="w-4 h-4 shrink-0 text-accent-violet" />
              Receitas vs Despesas ({mesReferencia.getFullYear()})
            </CardTitle>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-display font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Receitas
              </span>
              <span className="flex items-center gap-1.5 text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full font-display font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
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
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: isMobile ? 10 : 11, fontFamily: 'Geist, sans-serif' }}
                  tickFormatter={(value: string) => isMobile ? value.slice(0, 3) + '.' : value}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: isMobile ? 10 : 11, fontFamily: 'Geist, sans-serif' }}
                  width={isMobile ? 45 : 60}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="income"
                  fill="url(#incomeGradient)"
                  name="Receitas"
                  radius={[6, 6, 0, 0]}
                  animationBegin={200}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <Bar
                  dataKey="expense"
                  fill="url(#expenseGradient)"
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

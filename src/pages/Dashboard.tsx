import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Wallet, TrendingUp, TrendingDown, Pencil, Clock, AlertTriangle, CreditCard, ArrowUpRight, ArrowDownRight, Target, PiggyBank } from "lucide-react";

import {
  AlertasInteligentes,
  ProximasFaturas,
  UltimasCompras,
  GastosDiarios,
  ComparativoMensal,
  MetasEconomia,
  FiltroPeriodo,
  CartoesCredito,
} from "@/components/dashboard";

import { NovaMetaDialog } from "@/components/dashboard/NovaMetaDialog";
import { GerenciarMetaDialog } from "@/components/dashboard/GerenciarMetaDialog";
import { DetalhesDespesasDialog } from "@/components/dashboard/DetalhesDespesasDialog";
import { Meta } from "@/hooks/useDashboardCompleto";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";
import { EditarSaldoDialog } from "@/components/EditarSaldoDialog";
import { cn } from "@/lib/utils";

function formatYAxis(value: number): string {
  if (value === 0) return "R$0";
  if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl p-3 text-sm shadow-lg">
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
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoDashboard | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  const [gerenciarMetaOpen, setGerenciarMetaOpen] = useState(false);
  const [editarSaldoOpen, setEditarSaldoOpen] = useState(false);
  const [despesasDialogOpen, setDespesasDialogOpen] = useState(false);

  // Calcular range do mês selecionado
  const inicioMesSelecionado = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1).toISOString().split('T')[0];
  const fimMesSelecionado = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: stats } = useTransactionStats({
    startDate: inicioMesSelecionado,
    endDate: fimMesSelecionado,
  });
  const { data: expensesByCategory } = useExpensesByCategory({
    startDate: inicioMesSelecionado,
    endDate: fimMesSelecionado,
  });
  const { data: monthlyData } = useMonthlyData(mesReferencia.getFullYear());
  const { data: completeStats } = useCompleteStats(mesReferencia);

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

  // Calcular percentual do saldo vs limite
  const saldoPercentual = completeStats?.saldoDisponivel && completeStats?.faturaCartao
    ? Math.min(100, Math.max(0, ((completeStats.saldoDisponivel) / (completeStats.saldoDisponivel + completeStats.faturaCartao)) * 100))
    : 50;

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {user?.user_metadata?.full_name?.split(' ')[0] || "Usuário"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aqui está o resumo das suas finanças
          </p>
        </div>

        <FiltroPeriodo
          mesAtual={mesReferencia}
          onMesChange={setMesReferencia}
          onRefresh={() => refetch()}
          isLoading={isFetching}
        />
      </div>

      {/* Alertas */}
      {dashboardData?.alertas && dashboardData.alertas.length > 0 && (
        <div className="mb-6">
          <AlertasInteligentes alertas={dashboardData.alertas} />
        </div>
      )}

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Saldo Card - Large */}
        <Card variant="gradient" className="md:col-span-2 lg:row-span-2 overflow-hidden">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Saldo Disponível</p>
                <p className={cn(
                  "display-value-sm md:display-value",
                  (completeStats?.saldoDisponivel || 0) >= 0 ? "gradient-text-income" : "text-expense"
                )}>
                  {formatCurrency(completeStats?.saldoDisponivel || 0)}
                </p>
              </div>
              <Button 
                variant="glass" 
                size="icon" 
                className="h-10 w-10"
                onClick={() => setEditarSaldoOpen(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              {(completeStats?.totalInvestido || 0) > 0 && (
                <div className="stat-blue rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-info" />
                    <span className="text-xs text-muted-foreground">Investido</span>
                  </div>
                  <p className="text-sm font-semibold text-info">
                    {formatCurrency(completeStats?.totalInvestido || 0)}
                  </p>
                </div>
              )}
              {(completeStats?.totalMetas || 0) > 0 && (
                <div className="stat-amber rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <PiggyBank className="h-4 w-4 text-warning" />
                    <span className="text-xs text-muted-foreground">Em Metas</span>
                  </div>
                  <p className="text-sm font-semibold text-warning">
                    {formatCurrency(completeStats?.totalMetas || 0)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receitas */}
        <Card variant="bento" className="animate-fade-in stagger-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl stat-emerald flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-income" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">recebidas</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Receitas</p>
            <p className="text-2xl font-bold text-income value-display">
              +{formatCurrency(completeStats?.completedIncome || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card variant="bento" className="animate-fade-in stagger-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl stat-rose flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-expense" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">pagas</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Despesas</p>
            <p className="text-2xl font-bold text-expense value-display">
              -{formatCurrency(completeStats?.completedExpense || 0)}
            </p>
          </CardContent>
        </Card>

        {/* A Receber */}
        <Card variant="bento" className="stat-blue animate-fade-in stagger-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-5 h-5 text-info" />
              <span className="text-xs font-medium text-muted-foreground">pendentes</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">A Receber</p>
            <p className="text-xl font-bold text-info value-display">
              +{formatCurrency(completeStats?.pendingIncome || 0)}
            </p>
          </CardContent>
        </Card>

        {/* A Pagar */}
        <Card variant="bento" className="stat-amber animate-fade-in stagger-4">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="text-xs font-medium text-muted-foreground">
                {(completeStats?.overdueCount || 0) > 0 
                  ? `${completeStats?.overdueCount} vencida(s)` 
                  : "pendentes"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">A Pagar</p>
            <p className="text-xl font-bold text-warning value-display">
              -{formatCurrency(completeStats?.pendingExpense || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Fatura Cartão */}
        <Card variant="bento" className="stat-violet animate-fade-in stagger-5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">titular</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Fatura Cartão</p>
            <p className="text-xl font-bold text-primary value-display">
              -{formatCurrency(completeStats?.faturaCartao || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Total a Pagar */}
        <Card 
          variant="bento"
          className="stat-rose cursor-pointer hover:shadow-lg transition-all animate-fade-in stagger-6"
          onClick={() => setDespesasDialogOpen(true)}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Wallet className="w-5 h-5 text-expense" />
              <span className="text-xs font-medium text-muted-foreground">total</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total a Pagar</p>
            <p className="text-xl font-bold text-expense value-display">
              {formatCurrency(
                -((completeStats?.pendingExpense || 0) + (completeStats?.faturaCartao || 0))
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Saldo Estimado - Highlight Card */}
      <Card className="mb-6 gradient-primary text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-white/80 mb-1">Saldo Estimado do Mês</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(completeStats?.estimatedBalance || 0)}
                </p>
              </div>
            </div>
            <p className="text-sm text-white/70 hidden md:block max-w-xs text-right">
              saldo real + receitas pendentes - despesas pendentes - cartão
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card variant="bento">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name }) => name}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                Nenhuma despesa registrada
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="bento">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={240}>
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
                  />
                  <Bar
                    dataKey="expense"
                    fill="hsl(var(--expense))"
                    name="Despesas"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                Nenhum dado registrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparativo + Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {dashboardData?.comparativo && (
          <ComparativoMensal comparativo={dashboardData.comparativo} />
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
        />
        <UltimasCompras
          compras={dashboardData?.ultimasCompras || []}
        />
      </div>

      {/* Metas */}
      {dashboardData?.metas && (
        <MetasEconomia
          metas={dashboardData.metas}
          onNovaMeta={() => setNovaMetaOpen(true)}
          onMetaClick={(meta) => {
            setMetaSelecionada(meta);
            setGerenciarMetaOpen(true);
          }}
        />
      )}

      {/* Dialogs */}
      <NovaMetaDialog open={novaMetaOpen} onOpenChange={setNovaMetaOpen} />
      
      {metaSelecionada && (
        <GerenciarMetaDialog
          meta={metaSelecionada}
          open={gerenciarMetaOpen}
          onOpenChange={setGerenciarMetaOpen}
        />
      )}
      
      {cartaoSelecionado && (
        <DetalhesCartaoDialog
          cartao={{
            id: cartaoSelecionado.id,
            nome: cartaoSelecionado.nome,
            bandeira: cartaoSelecionado.bandeira,
            limite: cartaoSelecionado.limite,
            dia_fechamento: cartaoSelecionado.dia_fechamento,
            dia_vencimento: cartaoSelecionado.dia_vencimento,
            cor: cartaoSelecionado.cor,
            banco_id: null,
          } as any}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
          onUpdated={() => refetch()}
        />
      )}
      
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
    </Layout>
  );
}

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
import { formatCurrency, getMonthRange } from "@/lib/formatters";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Wallet, TrendingUp, TrendingDown, Plus, Pencil, Clock, AlertTriangle, CreditCard } from "lucide-react";

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
      <div className="bg-popover border rounded-md shadow-sm p-3 text-sm">
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
  const [year] = useState(new Date().getFullYear());
  const monthRange = getMonthRange();

  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoDashboard | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  const [gerenciarMetaOpen, setGerenciarMetaOpen] = useState(false);
  const [editarSaldoOpen, setEditarSaldoOpen] = useState(false);

  const { data: stats } = useTransactionStats({
    startDate: monthRange.start,
    endDate: monthRange.end,
  });
  const { data: expensesByCategory } = useExpensesByCategory({
    startDate: monthRange.start,
    endDate: monthRange.end,
  });
  const { data: monthlyData } = useMonthlyData(year);
  const { data: completeStats } = useCompleteStats();

  const {
    data: dashboardData,
    isLoading,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Olá, {user?.user_metadata?.full_name || "Usuário"}
          </h1>
        </div>

        <FiltroPeriodo
          mesAtual={mesReferencia}
          onMesChange={setMesReferencia}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      </div>

      {/* Alertas */}
      {dashboardData?.alertas && dashboardData.alertas.length > 0 && (
        <div className="mb-6">
          <AlertasInteligentes alertas={dashboardData.alertas} />
        </div>
      )}

      {/* Stats Cards - Primeira Linha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="border card-hover animate-fade-in-up stagger-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saldo Real</p>
                <p
                  className={`text-xl font-semibold ${
                    (completeStats?.realBalance || 0) >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {formatCurrency(completeStats?.realBalance || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Base: {formatCurrency(completeStats?.saldoInicial || 0)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setEditarSaldoOpen(true)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border card-hover animate-fade-in-up stagger-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Receitas</p>
                <p className="text-xl font-semibold text-income">
                  {formatCurrency(completeStats?.completedIncome || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">recebidas</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-income/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-income" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border card-hover animate-fade-in-up stagger-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Despesas</p>
                <p className="text-xl font-semibold text-expense">
                  {formatCurrency(completeStats?.completedExpense || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">pagas</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-expense/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-expense" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards - Segunda Linha (Pendentes + Fatura) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border border-blue-200 dark:border-blue-900 card-hover animate-fade-in-up stagger-4">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">A Receber</p>
                <p className="text-xl font-semibold text-blue-600">
                  +{formatCurrency(completeStats?.pendingIncome || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">pendentes</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 dark:border-amber-900 card-hover animate-fade-in-up stagger-5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">A Pagar</p>
                <p className="text-xl font-semibold text-amber-600">
                  -{formatCurrency(completeStats?.pendingExpense || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(completeStats?.overdueCount || 0) > 0 
                    ? `${completeStats?.overdueCount} vencida(s)` 
                    : "pendentes"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-200 dark:border-purple-900 card-hover animate-fade-in-up stagger-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fatura do Cartão</p>
                <p className="text-xl font-semibold text-purple-600">
                  -{formatCurrency(completeStats?.faturaCartao || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">titular do mês</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-primary/30 card-hover animate-fade-in-up" style={{ animationDelay: '0.35s', opacity: 0 }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saldo Estimado</p>
                <p className={`text-xl font-semibold ${
                  (completeStats?.estimatedBalance || 0) >= 0 ? "text-primary" : "text-expense"
                }`}>
                  {formatCurrency(completeStats?.estimatedBalance || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">incluindo pendentes</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="border card-hover animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
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
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Nenhuma despesa registrada
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border card-hover animate-fade-in" style={{ animationDelay: '0.45s', opacity: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Receitas vs Despesas ({year})</CardTitle>
          </CardHeader>
          <CardContent>
            {hasMonthlyData ? (
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
                    fill="hsl(152, 60%, 36%)"
                    name="Receitas"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    fill="hsl(0, 65%, 51%)"
                    name="Despesas"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
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
          <Button size="lg" className="rounded-full h-12 w-12 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-110">
            <Plus className="w-5 h-5" />
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
    </Layout>
  );
}

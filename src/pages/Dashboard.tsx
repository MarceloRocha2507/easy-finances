import { useState } from "react";
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
import { Wallet, TrendingUp, Pencil, Clock, AlertTriangle, CreditCard, ArrowUpRight, ArrowDownRight, Target, PiggyBank } from "lucide-react";

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
      <div className="bg-card rounded-xl p-3 text-sm shadow-lg border">
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Saldo */}
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={() => setEditarSaldoOpen(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
            <p className={cn(
              "text-2xl font-bold value-display",
              (completeStats?.saldoDisponivel || 0) >= 0 ? "text-income" : "text-expense"
            )}>
              {formatCurrency(completeStats?.saldoDisponivel || 0)}
            </p>
            
            {/* Sub-labels */}
            <div className="flex gap-3 mt-3">
              {(completeStats?.totalInvestido || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>{formatCurrency(completeStats?.totalInvestido || 0)} investido</span>
                </div>
              )}
              {(completeStats?.totalMetas || 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <PiggyBank className="h-3 w-3" />
                  <span>{formatCurrency(completeStats?.totalMetas || 0)} em metas</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receitas */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-income-light flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-income" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Receitas</p>
            <p className="text-2xl font-bold text-income value-display">
              +{formatCurrency(completeStats?.completedIncome || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-expense-light flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-expense" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Despesas</p>
            <p className="text-2xl font-bold text-expense value-display">
              -{formatCurrency(completeStats?.completedExpense || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Fatura Cartão */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary-light flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Fatura Cartão</p>
            <p className="text-2xl font-bold text-primary value-display">
              -{formatCurrency(completeStats?.faturaCartao || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* A Receber */}
        <Card className="bg-info-light border-info/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-info" />
              <span className="text-xs font-medium text-muted-foreground">pendentes</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">A Receber</p>
            <p className="text-lg font-bold text-info value-display">
              +{formatCurrency(completeStats?.pendingIncome || 0)}
            </p>
          </CardContent>
        </Card>

        {/* A Pagar */}
        <Card className="bg-warning-light border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium text-muted-foreground">
                {(completeStats?.overdueCount || 0) > 0 
                  ? `${completeStats?.overdueCount} vencida(s)` 
                  : "pendentes"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">A Pagar</p>
            <p className="text-lg font-bold text-warning value-display">
              -{formatCurrency(completeStats?.pendingExpense || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Total a Pagar */}
        <Card 
          className="bg-expense-light border-expense/20 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setDespesasDialogOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-expense" />
              <span className="text-xs font-medium text-muted-foreground">total</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total a Pagar</p>
            <p className="text-lg font-bold text-expense value-display">
              {formatCurrency(
                -((completeStats?.pendingExpense || 0) + (completeStats?.faturaCartao || 0))
              )}
            </p>
          </CardContent>
        </Card>

        {/* Saldo Estimado */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium text-primary-foreground/70">estimado</span>
            </div>
            <p className="text-xs text-primary-foreground/70 mb-1">Saldo Final</p>
            <p className="text-lg font-bold value-display">
              {formatCurrency(completeStats?.estimatedBalance || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
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

        <Card>
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
      <NovaMetaDialog
        open={novaMetaOpen}
        onOpenChange={setNovaMetaOpen}
        onSuccess={() => refetch()}
      />

      {metaSelecionada && (
        <GerenciarMetaDialog
          meta={metaSelecionada}
          open={gerenciarMetaOpen}
          onOpenChange={setGerenciarMetaOpen}
          onSuccess={() => refetch()}
        />
      )}

      {detalhesOpen && cartaoSelecionado && (
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
          }}
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

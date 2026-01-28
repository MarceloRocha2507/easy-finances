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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Wallet, TrendingUp, TrendingDown, Plus, Pencil, Clock, AlertTriangle, CreditCard, BarChart3 } from "lucide-react";

import {
  AlertasInteligentes,
  ProximasFaturas,
  UltimasCompras,
  GastosDiarios,
  ComparativoMensal,
  MetasEconomia,
  FiltroPeriodo,
  CartoesCredito,
  StatCardPrimary,
  StatCardSecondary,
  EstimatedBalanceBanner,
  PieChartWithLegend,
} from "@/components/dashboard";

import { NovaMetaDialog } from "@/components/dashboard/NovaMetaDialog";
import { GerenciarMetaDialog } from "@/components/dashboard/GerenciarMetaDialog";
import { DetalhesDespesasDialog } from "@/components/dashboard/DetalhesDespesasDialog";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Olá, {user?.user_metadata?.full_name || "Usuário"}
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

      {/* Stats Cards - Primeira Linha (Cards Principais com Gradiente) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCardPrimary
          title="Saldo Disponível"
          value={completeStats?.saldoDisponivel || 0}
          icon={Wallet}
          type="neutral"
          delay={0.05}
          actions={
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setEditarSaldoOpen(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          }
          subInfo={
            <div className="flex flex-col gap-0.5">
              {(completeStats?.totalInvestido || 0) > 0 && (
                <p className="text-xs text-primary">
                  Investido: {formatCurrency(completeStats?.totalInvestido || 0)}
                </p>
              )}
              {(completeStats?.totalMetas || 0) > 0 && (
                <p className="text-xs text-amber-600">
                  Em Metas: {formatCurrency(completeStats?.totalMetas || 0)}
                </p>
              )}
            </div>
          }
        />

        <StatCardPrimary
          title="Receitas"
          value={completeStats?.completedIncome || 0}
          icon={TrendingUp}
          type="income"
          delay={0.1}
          subInfo={<p className="text-xs text-muted-foreground">recebidas</p>}
        />

        <StatCardPrimary
          title="Despesas"
          value={completeStats?.completedExpense || 0}
          icon={TrendingDown}
          type="expense"
          delay={0.15}
          subInfo={<p className="text-xs text-muted-foreground">pagas</p>}
        />
      </div>

      {/* Stats Cards - Segunda Linha (Cards Secundários com Borda Colorida) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCardSecondary
          title="A Receber"
          value={completeStats?.pendingIncome || 0}
          icon={Clock}
          status="pending"
          subInfo="pendentes"
          delay={0.2}
          prefix="+"
        />

        <StatCardSecondary
          title="A Pagar"
          value={completeStats?.pendingExpense || 0}
          icon={AlertTriangle}
          status="warning"
          subInfo={
            (completeStats?.overdueCount || 0) > 0 
              ? `${completeStats?.overdueCount} vencida(s)` 
              : "pendentes"
          }
          delay={0.25}
          prefix="-"
        />

        <StatCardSecondary
          title="Fatura Cartão"
          value={completeStats?.faturaCartao || 0}
          icon={CreditCard}
          status="info"
          subInfo="titular do mês"
          delay={0.3}
          prefix="-"
        />

        <StatCardSecondary
          title="Total a Pagar"
          value={(completeStats?.pendingExpense || 0) + (completeStats?.faturaCartao || 0)}
          icon={Wallet}
          status="danger"
          subInfo="contas + cartão"
          delay={0.35}
          prefix="-"
          onClick={() => setDespesasDialogOpen(true)}
        />
      </div>

      {/* Banner de Saldo Estimado */}
      <div className="mb-6">
        <EstimatedBalanceBanner
          value={completeStats?.estimatedBalance || 0}
          delay={0.4}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <PieChartWithLegend data={pieData} delay={0.45} />

        <Card className="border rounded-xl shadow-sm animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Receitas vs Despesas ({mesReferencia.getFullYear()})
            </CardTitle>
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
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhum dado registrado</p>
                </div>
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
    </Layout>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import {
  useTransactionStats,
  useExpensesByCategory,
  useMonthlyData,
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
import { Wallet, TrendingUp, TrendingDown, Plus } from "lucide-react";

// Importar componentes do Dashboard
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

// Dialog de nova meta
import { NovaMetaDialog } from "@/components/dashboard/NovaMetaDialog";

// Dialog de gerenciar meta (editar, depositar, retirar)
import { GerenciarMetaDialog } from "@/components/dashboard/GerenciarMetaDialog";

// Tipo Meta do hook
import { Meta } from "@/hooks/useDashboardCompleto";

// Dialog de detalhes do cartão
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";

// Função para formatar valores do eixo Y
function formatYAxis(value: number): string {
  if (value === 0) return "R$0";
  if (value >= 1000000) {
    return `R$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(0)}k`;
  }
  return `R$${value.toFixed(0)}`;
}

// Tooltip customizado para o gráfico de barras
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium capitalize mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.fill }}>
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

  // Estado do filtro de período
  const [mesReferencia, setMesReferencia] = useState(new Date());

  // Estado do modal de detalhes do cartão
  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoDashboard | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);

  // Estado do modal de nova meta
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);

  // Estado do modal de gerenciar meta
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  const [gerenciarMetaOpen, setGerenciarMetaOpen] = useState(false);

  // Hooks existentes (transações gerais)
  const { data: stats } = useTransactionStats({
    startDate: monthRange.start,
    endDate: monthRange.end,
  });
  const { data: expensesByCategory } = useExpensesByCategory({
    startDate: monthRange.start,
    endDate: monthRange.end,
  });
  const { data: monthlyData } = useMonthlyData(year);

  // Novo hook completo do dashboard (cartões)
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

  // Handler para clique no cartão
  function handleCartaoClick(cartao: CartaoDashboard) {
    setCartaoSelecionado(cartao);
    setDetalhesOpen(true);
  }

  // Verificar se há dados no gráfico mensal
  const hasMonthlyData = monthlyData?.some(
    (m) => m.income > 0 || m.expense > 0
  );

  return (
    <Layout>
      {/* Welcome + Filtro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Olá, {user?.user_metadata?.full_name || "Usuário"}!
          </h2>
          <p className="text-muted-foreground">
            Aqui está o resumo das suas finanças
          </p>
        </div>

        <FiltroPeriodo
          mesAtual={mesReferencia}
          onMesChange={setMesReferencia}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      </div>

      {/* Alertas Inteligentes */}
      {dashboardData?.alertas && dashboardData.alertas.length > 0 && (
        <div className="mb-6">
          <AlertasInteligentes alertas={dashboardData.alertas} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-lg animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
                <p
                  className={`text-2xl font-bold ${
                    (stats?.balance || 0) >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {formatCurrency(stats?.balance || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-lg animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Receitas do Mês
                </p>
                <p className="text-2xl font-bold text-income">
                  {formatCurrency(stats?.totalIncome || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-income flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-income-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-lg animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Despesas do Mês
                </p>
                <p className="text-2xl font-bold text-expense">
                  {formatCurrency(stats?.totalExpense || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-expense flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-expense-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Pizza - Despesas por Categoria */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name }) => name}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhuma despesa registrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Receitas vs Despesas */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Receitas vs Despesas ({year})</CardTitle>
          </CardHeader>
          <CardContent>
            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={250}>
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
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatYAxis}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    width={70}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="income"
                    fill="#22c55e"
                    name="Receitas"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#ef4444"
                    name="Despesas"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhum dado registrado em {year}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NOVOS WIDGETS */}

      {/* Comparativo Mensal + Gastos Diários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {dashboardData?.comparativo && (
          <ComparativoMensal comparativo={dashboardData.comparativo} />
        )}
        {dashboardData?.gastosDiarios && (
          <GastosDiarios dados={dashboardData.gastosDiarios} />
        )}
      </div>

      {/* Cartões de Crédito */}
      <div className="mb-8">
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

      {/* Próximas Faturas + Últimas Compras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProximasFaturas
          faturas={dashboardData?.proximasFaturas || []}
          onCartaoClick={(cartaoId) => {
            const cartao = dashboardData?.cartoes.find((c) => c.id === cartaoId);
            if (cartao) handleCartaoClick(cartao);
          }}
        />
        <UltimasCompras compras={dashboardData?.ultimasCompras || []} />
      </div>

      {/* Metas de Economia */}
      <div className="mb-8">
        <MetasEconomia
          metas={dashboardData?.metas || []}
          onNovaMeta={() => setNovaMetaOpen(true)}
          onMetaClick={(meta) => {
            setMetaSelecionada(meta);
            setGerenciarMetaOpen(true);
          }}
        />
      </div>

      {/* Quick Action */}
      <div className="fixed bottom-6 right-6">
        <Link to="/transactions">
          <Button
            size="lg"
            className="gradient-primary shadow-glow rounded-full h-14 w-14"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      {/* Modal de Detalhes do Cartão */}
      {cartaoSelecionado && (
        <DetalhesCartaoDialog
          cartao={cartaoSelecionado as any}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
          onUpdated={() => refetch()}
        />
      )}

      {/* Modal de Nova Meta */}
      <NovaMetaDialog
        open={novaMetaOpen}
        onOpenChange={setNovaMetaOpen}
        onSuccess={() => refetch()}
      />

      {/* Modal de Gerenciar Meta */}
      <GerenciarMetaDialog
        meta={metaSelecionada}
        open={gerenciarMetaOpen}
        onOpenChange={setGerenciarMetaOpen}
        onSuccess={() => refetch()}
      />
    </Layout>
  );
}
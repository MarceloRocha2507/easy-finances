import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useExpensesByCategory, useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, DollarSign, Wallet, Briefcase,
  ShoppingCart, Home, Car, Utensils, Heart, GraduationCap, Gift, Plane,
  Gamepad2, Shirt, Pill, Book, Package, Zap, Tag, CreditCard, PiggyBank,
  BarChart3, type LucideIcon
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChartWithLegend } from '@/components/dashboard';
import { StatCardPrimary } from '@/components/dashboard/StatCardPrimary';
import { StatCardSecondary } from '@/components/dashboard/StatCardSecondary';
import { FiltroDataRange } from '@/components/FiltroDataRange';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const ICON_MAP: Record<string, LucideIcon> = {
  'dollar-sign': DollarSign, 'wallet': Wallet, 'briefcase': Briefcase,
  'shopping-cart': ShoppingCart, 'home': Home, 'car': Car, 'utensils': Utensils,
  'heart': Heart, 'graduation-cap': GraduationCap, 'gift': Gift, 'plane': Plane,
  'gamepad': Gamepad2, 'shirt': Shirt, 'pill': Pill, 'book': Book, 'package': Package,
  'zap': Zap, 'trending-up': TrendingUp, 'tag': Tag, 'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
};

function getIconComponent(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Package;
  return ICON_MAP[iconName] || Package;
}

export default function RelatorioCategorias() {
  const hoje = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(hoje));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(hoje));

  const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
  const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

  // Mês anterior para comparação
  const prevStart = startDate ? subMonths(startOfMonth(startDate), 1) : undefined;
  const prevEnd = prevStart ? endOfMonth(prevStart) : undefined;
  const prevStartStr = prevStart ? format(prevStart, 'yyyy-MM-dd') : undefined;
  const prevEndStr = prevEnd ? format(prevEnd, 'yyyy-MM-dd') : undefined;

  const { data: expensesByCategory, isLoading: loadingCat, refetch: r1 } = useExpensesByCategory({ startDate: startDateStr, endDate: endDateStr });
  const { data: prevExpensesByCategory, isLoading: loadingPrev } = useExpensesByCategory({ startDate: prevStartStr, endDate: prevEndStr });
  const { data: transactions, isLoading: loadingTx, refetch: r2 } = useTransactions({ startDate: startDateStr, endDate: endDateStr });

  const isLoading = loadingCat || loadingPrev || loadingTx;

  const handleRefresh = () => { r1(); r2(); };

  const pieData = useMemo(() =>
    expensesByCategory?.map((cat) => ({ name: cat.name, value: cat.total, color: cat.color || '#666' })) || [],
    [expensesByCategory]
  );

  const totalExpenses = useMemo(() => pieData.reduce((acc, cur) => acc + cur.value, 0), [pieData]);
  const prevTotalExpenses = useMemo(() => prevExpensesByCategory?.reduce((acc, cur) => acc + cur.total, 0) || 0, [prevExpensesByCategory]);

  const categoryComparison = useMemo(() =>
    expensesByCategory?.map((cat) => {
      const prevCat = prevExpensesByCategory?.find(p => p.name === cat.name);
      const prevTotal = prevCat?.total || 0;
      const variation = prevTotal > 0 ? ((cat.total - prevTotal) / prevTotal) * 100 : 0;
      return { ...cat, prevTotal, variation };
    }) || [],
    [expensesByCategory, prevExpensesByCategory]
  );

  const transactionsByCategory = useMemo(() =>
    transactions?.reduce((acc, t) => {
      if (t.type === 'expense') {
        const catName = t.category?.name || 'Sem categoria';
        if (!acc[catName]) acc[catName] = { count: 0 };
        acc[catName].count++;
      }
      return acc;
    }, {} as Record<string, { count: number }>) || {},
    [transactions]
  );

  const topCategory = useMemo(() => {
    if (!pieData.length) return null;
    return [...pieData].sort((a, b) => b.value - a.value)[0];
  }, [pieData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border bg-popover p-3 shadow-md">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatório por Categoria</h1>
          <p className="text-sm text-muted-foreground">Análise detalhada dos gastos por categoria</p>
        </div>

        <FiltroDataRange
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCardPrimary
              title="Total de Despesas"
              value={totalExpenses}
              icon={TrendingDown}
              type="expense"
              delay={0}
              subInfo={prevTotalExpenses > 0 ? (
                <span className={`text-xs ${totalExpenses > prevTotalExpenses ? 'text-expense' : 'text-income'}`}>
                  {totalExpenses > prevTotalExpenses ? '+' : ''}
                  {((totalExpenses - prevTotalExpenses) / prevTotalExpenses * 100).toFixed(1)}% vs mês anterior
                </span>
              ) : undefined}
            />
            <StatCardSecondary
              title="Categorias Ativas"
              value={pieData.length}
              icon={Tag}
              status="info"
              subInfo="com gastos no período"
              delay={0.05}
              prefix=""
            />
            <StatCardSecondary
              title="Maior Categoria"
              value={topCategory?.value || 0}
              icon={ShoppingCart}
              status="warning"
              subInfo={topCategory?.name || '-'}
              delay={0.1}
            />
          </div>
        )}

        {/* Charts */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartWithLegend data={pieData} />

            <Card className="border shadow-sm rounded-xl h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Comparativo com Mês Anterior</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {categoryComparison.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryComparison.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="prevTotal" fill="hsl(var(--muted-foreground))" name="Mês Anterior" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" name="Mês Atual" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Nenhum dado para comparação" />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Details */}
        {isLoading ? (
          <Skeleton className="h-[200px] rounded-xl" />
        ) : (
          <Card className="border shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-medium">Detalhamento por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryComparison.length > 0 ? (
                <div className="space-y-4">
                  {categoryComparison.sort((a, b) => b.total - a.total).map((category) => {
                    const percentage = totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0;
                    const IconComp = getIconComponent(category.icon);
                    return (
                      <div key={category.name} className="p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category.color}20` }}>
                              <IconComp className="w-5 h-5" style={{ color: category.color }} />
                            </div>
                            <div>
                              <span className="font-medium">{category.name}</span>
                              <p className="text-sm text-muted-foreground">
                                {transactionsByCategory[category.name]?.count || 0} transações
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-expense">{formatCurrency(category.total)}</p>
                            <div className="flex items-center gap-1 text-sm">
                              {category.variation > 0 ? (
                                <TrendingUp className="w-3 h-3 text-expense" />
                              ) : category.variation < 0 ? (
                                <TrendingDown className="w-3 h-3 text-income" />
                              ) : (
                                <Minus className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span className={category.variation > 0 ? 'text-expense' : category.variation < 0 ? 'text-income' : 'text-muted-foreground'}>
                                {category.variation > 0 ? '+' : ''}{category.variation.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}% do total</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState message="Nenhuma despesa registrada no período selecionado" />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <BarChart3 className="w-10 h-10 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

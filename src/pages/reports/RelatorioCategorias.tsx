import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useExpensesByCategory, useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Calendar, TrendingUp, TrendingDown, Minus, DollarSign, Wallet, Briefcase,
  ShoppingCart, Home, Car, Utensils, Heart, GraduationCap, Gift, Plane,
  Gamepad2, Shirt, Pill, Book, Package, Zap, Tag, CreditCard, PiggyBank,
  type LucideIcon
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChartWithLegend } from '@/components/dashboard';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Icon mapping for dynamic icon rendering
const ICON_MAP: Record<string, LucideIcon> = {
  'dollar-sign': DollarSign,
  'wallet': Wallet,
  'briefcase': Briefcase,
  'shopping-cart': ShoppingCart,
  'home': Home,
  'car': Car,
  'utensils': Utensils,
  'heart': Heart,
  'graduation-cap': GraduationCap,
  'gift': Gift,
  'plane': Plane,
  'gamepad': Gamepad2,
  'shirt': Shirt,
  'pill': Pill,
  'book': Book,
  'package': Package,
  'zap': Zap,
  'trending-up': TrendingUp,
  'tag': Tag,
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
};

function getIconComponent(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Package;
  return ICON_MAP[iconName] || Package;
}

export default function RelatorioCategorias() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
  const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

  // Mês anterior para comparação
  const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const prevStartDate = new Date(prevYear, prevMonth, 1).toISOString().split('T')[0];
  const prevEndDate = new Date(prevYear, prevMonth + 1, 0).toISOString().split('T')[0];

  const { data: expensesByCategory } = useExpensesByCategory({ startDate, endDate });
  const { data: prevExpensesByCategory } = useExpensesByCategory({ startDate: prevStartDate, endDate: prevEndDate });
  const { data: transactions } = useTransactions({ startDate, endDate });

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const pieData = expensesByCategory?.map((cat) => ({
    name: cat.name,
    value: cat.total,
    color: cat.color || '#666',
  })) || [];

  const totalExpenses = pieData.reduce((acc, cur) => acc + cur.value, 0);
  const prevTotalExpenses = prevExpensesByCategory?.reduce((acc, cur) => acc + cur.total, 0) || 0;

  // Comparativo por categoria
  const categoryComparison = expensesByCategory?.map((cat) => {
    const prevCat = prevExpensesByCategory?.find(p => p.name === cat.name);
    const prevTotal = prevCat?.total || 0;
    const variation = prevTotal > 0 ? ((cat.total - prevTotal) / prevTotal) * 100 : 0;
    return {
      ...cat,
      prevTotal,
      variation,
    };
  }) || [];

  // Transações agrupadas por categoria
  const transactionsByCategory = transactions?.reduce((acc, t) => {
    if (t.type === 'expense') {
      const catName = t.category?.name || 'Sem categoria';
      if (!acc[catName]) {
        acc[catName] = { transactions: [], total: 0, color: t.category?.color || '#666' };
      }
      acc[catName].transactions.push(t);
      acc[catName].total += t.amount;
    }
    return acc;
  }, {} as Record<string, { transactions: any[]; total: number; color: string }>) || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatório por Categoria</h1>
          <p className="text-sm text-muted-foreground">Análise detalhada dos gastos por categoria</p>
        </div>

        {/* Period Selector */}
        <Card className="border shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Período:</span>
              </div>
              <div className="flex gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total de Despesas</p>
              <p className="text-2xl font-bold text-expense">{formatCurrency(totalExpenses)}</p>
              {prevTotalExpenses > 0 && (
                <p className={`text-sm mt-1 ${totalExpenses > prevTotalExpenses ? 'text-expense' : 'text-income'}`}>
                  {totalExpenses > prevTotalExpenses ? '+' : ''}
                  {((totalExpenses - prevTotalExpenses) / prevTotalExpenses * 100).toFixed(1)}% vs mês anterior
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Categorias Ativas</p>
              <p className="text-2xl font-bold text-foreground">{pieData.length}</p>
              <p className="text-sm text-muted-foreground mt-1">com gastos no período</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Maior Categoria</p>
              <p className="text-2xl font-bold text-foreground">
                {pieData.length > 0 ? pieData.sort((a, b) => b.value - a.value)[0].name : '-'}
              </p>
              {pieData.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(pieData.sort((a, b) => b.value - a.value)[0].value)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Using PieChartWithLegend from Dashboard */}
          <PieChartWithLegend data={pieData} />

          {/* Bar Chart - Comparativo */}
          <Card className="border shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-medium">Comparativo com Mês Anterior</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryComparison.slice(0, 6)} layout="vertical">
                    <XAxis type="number" tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="prevTotal" fill="hsl(var(--muted-foreground))" name="Mês Anterior" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Mês Atual" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado para comparação
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Details */}
        <Card className="border shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-medium">Detalhamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryComparison.length > 0 ? (
              <div className="space-y-4">
                {categoryComparison
                  .sort((a, b) => b.total - a.total)
                  .map((category) => {
                    const percentage = totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0;
                    const IconComp = getIconComponent(category.icon);
                    return (
                      <div key={category.name} className="p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <IconComp 
                                className="w-5 h-5" 
                                style={{ color: category.color }} 
                              />
                            </div>
                            <div>
                              <span className="font-medium">{category.name}</span>
                              <p className="text-sm text-muted-foreground">
                                {transactionsByCategory[category.name]?.transactions.length || 0} transações
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
              <p className="text-center text-muted-foreground py-8">
                Nenhuma despesa registrada no período selecionado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

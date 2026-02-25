import { useState, useRef, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useTransactionStats, useExpensesByCategory, useMonthlyData, useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid } from 'recharts';
import { PieChartWithLegend } from '@/components/dashboard';
import { StatCardMinimal } from '@/components/dashboard/StatCardMinimal';
import { FiltroDataRange } from '@/components/FiltroDataRange';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, Table, Wallet, TrendingUp, TrendingDown,
  DollarSign, Briefcase, ShoppingCart, Home, Car, Utensils, 
  Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, 
  Book, Package, Zap, Tag, CreditCard, PiggyBank, BarChart3,
  type LucideIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function Reports() {
  const hoje = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(hoje));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(hoje));
  const reportRef = useRef<HTMLDivElement>(null);

  const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
  const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
  const selectedYear = startDate?.getFullYear() || hoje.getFullYear();

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useTransactionStats({ startDate: startDateStr, endDate: endDateStr });
  const { data: expensesByCategory, isLoading: loadingCategories, refetch: refetchCategories } = useExpensesByCategory({ startDate: startDateStr, endDate: endDateStr });
  const { data: monthlyData, isLoading: loadingMonthly, refetch: refetchMonthly } = useMonthlyData(selectedYear);
  const { data: transactions, isLoading: loadingTransactions, refetch: refetchTransactions } = useTransactions({ startDate: startDateStr, endDate: endDateStr });

  const isLoading = loadingStats || loadingCategories || loadingMonthly || loadingTransactions;

  const handleRefresh = () => {
    refetchStats();
    refetchCategories();
    refetchMonthly();
    refetchTransactions();
  };

  const pieData = useMemo(() => 
    expensesByCategory?.map((cat) => ({
      name: cat.name, value: cat.total, color: cat.color, icon: cat.icon,
    })) || [], 
    [expensesByCategory]
  );

  const totalExpenses = useMemo(() => pieData.reduce((acc, cur) => acc + cur.value, 0), [pieData]);

  // Evolução do saldo acumulado
  const balanceEvolution = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const dayMap = new Map<string, number>();
    sorted.forEach((t) => {
      const day = t.date;
      const delta = t.type === 'income' ? t.amount : -t.amount;
      dayMap.set(day, (dayMap.get(day) || 0) + delta);
    });
    let accumulated = 0;
    return Array.from(dayMap.entries()).map(([date, delta]) => {
      accumulated += delta;
      return { date: format(new Date(date + 'T12:00:00'), 'dd/MM', { locale: ptBR }), saldo: accumulated };
    });
  }, [transactions]);

  const periodLabel = startDate && endDate
    ? `${format(startDate, 'dd/MM/yy')} - ${format(endDate, 'dd/MM/yy')}`
    : 'Período';

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`relatorio-${periodLabel}.pdf`);
  };

  const handleExportCSV = () => {
    if (!transactions) return;
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];
    const rows = transactions.map((t) => [
      formatDate(t.date),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category?.name || 'Sem categoria',
      t.description || '',
      t.amount.toString(),
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes-${periodLabel}.csv`;
    link.click();
  };

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Análise detalhada das suas finanças</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Table className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <FiltroDataRange
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        {/* Report Content */}
        <div ref={reportRef} className="space-y-6">
          {/* Summary Cards */}
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCardMinimal title="Resultado do Período" value={stats?.balance || 0} icon={Wallet} delay={0} />
              <StatCardMinimal title="Total de Receitas" value={stats?.totalIncome || 0} icon={TrendingUp} delay={0.05} />
              <StatCardMinimal title="Total de Despesas" value={stats?.totalExpense || 0} icon={TrendingDown} prefix="-" delay={0.1} />
            </div>
          )}

          {/* Charts Row */}
          {loadingCategories || loadingMonthly ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-[300px] rounded-xl" />
              <Skeleton className="h-[300px] rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PieChartWithLegend data={pieData} />

              <Card className="border shadow-sm rounded-xl h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Comparativo Anual ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {monthlyData && monthlyData.some(m => m.income > 0 || m.expense > 0) ? (
                    <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="income" fill="hsl(var(--income))" name="Receitas" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="hsl(var(--expense))" name="Despesas" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Nenhum dado anual disponível" />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Balance Evolution */}
          {loadingTransactions ? (
            <Skeleton className="h-[300px] rounded-xl" />
          ) : (
            <Card className="border shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Evolução do Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                {balanceEvolution.length > 1 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={balanceEvolution}>
                      <defs>
                        <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="saldo"
                        stroke="hsl(var(--primary))"
                        fill="url(#saldoGradient)"
                        name="Saldo"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Dados insuficientes para evolução do saldo" />
                )}
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown */}
          {loadingCategories ? (
            <Skeleton className="h-[200px] rounded-xl" />
          ) : (
            <Card className="border shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium">Detalhamento por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="space-y-3">
                    {pieData.sort((a, b) => b.value - a.value).map((category) => {
                      const IconComp = getIconComponent(category.icon);
                      return (
                        <div key={category.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category.color}20` }}>
                              <IconComp className="w-5 h-5" style={{ color: category.color }} />
                            </div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-expense">{formatCurrency(category.value)}</p>
                            <p className="text-sm text-muted-foreground">{totalExpenses > 0 ? ((category.value / totalExpenses) * 100).toFixed(1) : 0}%</p>
                          </div>
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

          {/* Top Transactions */}
          {loadingTransactions ? (
            <Skeleton className="h-[200px] rounded-xl" />
          ) : (
            <Card className="border shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium">Maiores Transações do Período</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.sort((a, b) => b.amount - a.amount).slice(0, 5).map((transaction) => {
                      const IconComp = getIconComponent(transaction.category?.icon);
                      return (
                        <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-rose-100 dark:bg-rose-900/50'}`}>
                              <IconComp className={`w-5 h-5 ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description || transaction.category?.name || 'Sem descrição'}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState message="Nenhuma transação registrada no período selecionado" />
                )}
              </CardContent>
            </Card>
          )}
        </div>
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

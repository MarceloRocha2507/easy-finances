import { useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useTransactionStats, useExpensesByCategory, useMonthlyData, useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, getMonthRange, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChartWithLegend } from '@/components/dashboard';
import { 
  FileText, Table, Wallet, TrendingUp, TrendingDown, Calendar,
  DollarSign, Briefcase, ShoppingCart, Home, Car, Utensils, 
  Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, 
  Book, Package, Zap, Tag, CreditCard, PiggyBank,
  type LucideIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Reports() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const reportRef = useRef<HTMLDivElement>(null);

  const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
  const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

  const { data: stats } = useTransactionStats({ startDate, endDate });
  const { data: expensesByCategory } = useExpensesByCategory({ startDate, endDate });
  const { data: monthlyData } = useMonthlyData(selectedYear);
  const { data: transactions } = useTransactions({ startDate, endDate });

  const pieData = expensesByCategory?.map((cat) => ({
    name: cat.name,
    value: cat.total,
    color: cat.color,
    icon: cat.icon,
  })) || [];

  const totalExpenses = pieData.reduce((acc, cur) => acc + cur.value, 0);

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`relatorio-${MONTHS[selectedMonth]}-${selectedYear}.pdf`);
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

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes-${MONTHS[selectedMonth]}-${selectedYear}.csv`;
    link.click();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Análise detalhada das suas finanças</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Table className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <Card className="border">
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

        {/* Report Content */}
        <div ref={reportRef} className="space-y-6 bg-background p-4 rounded-xl">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Saldo do Período</p>
                    <p className={`text-2xl font-bold ${(stats?.balance || 0) >= 0 ? 'text-income' : 'text-expense'}`}>
                      {formatCurrency(stats?.balance || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total de Receitas</p>
                    <p className="text-2xl font-bold text-income">{formatCurrency(stats?.totalIncome || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl gradient-income flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-income-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total de Despesas</p>
                    <p className="text-2xl font-bold text-expense">{formatCurrency(stats?.totalExpense || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl gradient-expense flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-expense-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <PieChartWithLegend data={pieData} />

            {/* Bar Chart */}
            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Comparativo Anual ({selectedYear})</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$${value / 1000}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="income" fill="hsl(142 76% 36%)" name="Receitas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="hsl(0 84% 60%)" name="Despesas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown Table */}
          <Card className="border">
            <CardHeader>
              <CardTitle>Detalhamento por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="space-y-3">
                  {pieData
                    .sort((a, b) => b.value - a.value)
                    .map((category) => (
                      <div key={category.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const IconComp = getIconComponent(category.icon);
                            return (
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <IconComp className="w-5 h-5" style={{ color: category.color }} />
                              </div>
                            );
                          })()}
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-expense">{formatCurrency(category.value)}</p>
                          <p className="text-sm text-muted-foreground">
                            {((category.value / totalExpenses) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma despesa registrada no período selecionado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Transactions */}
          <Card className="border">
            <CardHeader>
              <CardTitle>Maiores Transações do Período</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const IconComp = getIconComponent(transaction.category?.icon);
                            return (
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  transaction.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              >
                                <IconComp className="w-5 h-5 text-white" />
                              </div>
                            );
                          })()}
                          <div>
                            <p className="font-medium">{transaction.description || transaction.category?.name || 'Sem descrição'}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação registrada no período selecionado
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

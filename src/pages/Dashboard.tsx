import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTransactionStats, useExpensesByCategory, useMonthlyData } from '@/hooks/useTransactions';
import { formatCurrency, getMonthRange } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Plus, LogOut, List, Tag, FileText, User } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [year] = useState(new Date().getFullYear());
  const monthRange = getMonthRange();

  const { data: stats } = useTransactionStats({ startDate: monthRange.start, endDate: monthRange.end });
  const { data: expensesByCategory } = useExpensesByCategory({ startDate: monthRange.start, endDate: monthRange.end });
  const { data: monthlyData } = useMonthlyData(year);

  const pieData = expensesByCategory?.map((cat) => ({
    name: cat.name,
    value: cat.total,
    color: cat.color,
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">FinanceApp</h1>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/dashboard"><Button variant="ghost" size="sm"><List className="w-4 h-4 mr-2" />Dashboard</Button></Link>
            <Link to="/transactions"><Button variant="ghost" size="sm"><TrendingUp className="w-4 h-4 mr-2" />Registros</Button></Link>
            <Link to="/categories"><Button variant="ghost" size="sm"><Tag className="w-4 h-4 mr-2" />Categorias</Button></Link>
            <Link to="/reports"><Button variant="ghost" size="sm"><FileText className="w-4 h-4 mr-2" />Relatórios</Button></Link>
            <Link to="/profile"><Button variant="ghost" size="sm"><User className="w-4 h-4 mr-2" />Perfil</Button></Link>
          </nav>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Olá, {user?.user_metadata?.full_name || 'Usuário'}!</h2>
          <p className="text-muted-foreground">Aqui está o resumo das suas finanças</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
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

          <Card className="border-0 shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Receitas do Mês</p>
                  <p className="text-2xl font-bold text-income">{formatCurrency(stats?.totalIncome || 0)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl gradient-income flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-income-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Despesas do Mês</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Nenhuma despesa registrada
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Receitas vs Despesas ({year})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${value / 1000}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="income" fill="hsl(142 76% 36%)" name="Receitas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(0 84% 60%)" name="Despesas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action */}
        <div className="fixed bottom-6 right-6">
          <Link to="/transactions">
            <Button size="lg" className="gradient-primary shadow-glow rounded-full h-14 w-14">
              <Plus className="w-6 h-6" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
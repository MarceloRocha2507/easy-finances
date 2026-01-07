import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, useMarkAsPaid, useCompleteStats, Transaction, TransactionInsert, TransactionStatus } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, TrendingUp, TrendingDown, Calendar, CreditCard, Wallet, RefreshCw, ShoppingCart, Home, Car, Utensils, Briefcase, Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, Book, Package, Zap, DollarSign, Tag, LayoutList, Clock, Check, AlertTriangle, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isToday, isYesterday, parseISO, isBefore, isEqual, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { EditarSaldoDialog } from '@/components/EditarSaldoDialog';


interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  category_id: string;
  description: string;
  date: Date;
  status: TransactionStatus;
  due_date: Date | undefined;
  is_recurring: boolean;
  recurrence_day: number;
}

const initialFormData: TransactionFormData = {
  type: 'expense',
  amount: '',
  category_id: '',
  description: '',
  date: new Date(),
  status: 'completed',
  due_date: undefined,
  is_recurring: false,
  recurrence_day: 1,
};

// Mapa de ícones para renderização
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
};

function getIconComponent(iconValue: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconValue] || Package;
}

// Categorias consideradas "despesas fixas"
const FIXED_EXPENSE_CATEGORIES = ['Moradia', 'Contas'];

type TabType = 'all' | 'income' | 'expense' | 'pending' | 'fixed';

// Formatar label de data
function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "dd 'de' MMMM", { locale: ptBR });
}

export default function Transactions() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cartaoDialogOpen, setCartaoDialogOpen] = useState(false);
  const [editarSaldoOpen, setEditarSaldoOpen] = useState(false);

  const { data: transactions, isLoading } = useTransactions();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: stats } = useCompleteStats();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const markAsPaidMutation = useMarkAsPaid();

  // Filtrar transações por busca
  const searchedTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter((t) =>
      t.description?.toLowerCase().includes(query) ||
      t.category?.name?.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  // Separar por tipo
  const incomeTransactions = useMemo(() => 
    searchedTransactions.filter(t => t.type === 'income'), 
    [searchedTransactions]
  );
  
  const expenseTransactions = useMemo(() => 
    searchedTransactions.filter(t => t.type === 'expense'), 
    [searchedTransactions]
  );
  
  const fixedExpenseTransactions = useMemo(() => 
    expenseTransactions.filter(t => 
      FIXED_EXPENSE_CATEGORIES.includes(t.category?.name || '')
    ), 
    [expenseTransactions]
  );

  const pendingTransactions = useMemo(() => 
    searchedTransactions.filter(t => t.status === 'pending'), 
    [searchedTransactions]
  );

  // Transações ativas baseado na tab
  const activeTransactions = useMemo(() => {
    switch (activeTab) {
      case 'income': return incomeTransactions;
      case 'expense': return expenseTransactions;
      case 'pending': return pendingTransactions;
      case 'fixed': return fixedExpenseTransactions;
      default: return searchedTransactions;
    }
  }, [activeTab, searchedTransactions, incomeTransactions, expenseTransactions, pendingTransactions, fixedExpenseTransactions]);

  // Agrupar transações por data
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    activeTransactions.forEach(t => {
      const dateKey = t.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [activeTransactions]);

  // Filtrar categorias pelo tipo selecionado
  const filteredCategories = categories?.filter((c) => c.type === formData.type) || [];

  const handleSubmit = () => {
    const today = startOfDay(new Date());
    const transactionDate = startOfDay(formData.date);
    
    // Lógica automática: data futura OU recorrente = pendente
    const isFutureDate = transactionDate > today;
    const autoStatus: TransactionStatus = (formData.is_recurring || isFutureDate) 
      ? 'pending' 
      : 'completed';
    
    const data: TransactionInsert = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id || undefined,
      description: formData.description || undefined,
      date: format(formData.date, 'yyyy-MM-dd'),
      status: autoStatus,
      due_date: autoStatus === 'pending' 
        ? format(formData.date, 'yyyy-MM-dd') 
        : undefined,
      paid_date: autoStatus === 'completed' 
        ? format(formData.date, 'yyyy-MM-dd') 
        : undefined,
      is_recurring: formData.is_recurring,
      recurrence_day: formData.is_recurring ? formData.recurrence_day : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data }, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category_id: transaction.category_id || '',
      description: transaction.description || '',
      date: new Date(transaction.date),
      status: transaction.status || 'completed',
      due_date: transaction.due_date ? new Date(transaction.due_date) : undefined,
      is_recurring: transaction.is_recurring || false,
      recurrence_day: transaction.recurrence_day || 1,
    });
    setEditingId(transaction.id);
    setDialogOpen(true);
  };

  const handleMarkAsPaid = (id: string) => {
    markAsPaidMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const tabs: { value: TabType; label: string; icon: React.ReactNode; count: number; activeClass: string }[] = [
    { 
      value: 'all', 
      label: 'Todos', 
      icon: <LayoutList className="w-4 h-4" />, 
      count: searchedTransactions.length,
      activeClass: 'border-primary text-foreground'
    },
    { 
      value: 'income', 
      label: 'Receitas', 
      icon: <TrendingUp className="w-4 h-4" />, 
      count: incomeTransactions.length,
      activeClass: 'border-emerald-500 text-emerald-600'
    },
    { 
      value: 'expense', 
      label: 'Despesas', 
      icon: <TrendingDown className="w-4 h-4" />, 
      count: expenseTransactions.length,
      activeClass: 'border-red-500 text-red-600'
    },
    { 
      value: 'pending', 
      label: 'Pendentes', 
      icon: <Clock className="w-4 h-4" />, 
      count: pendingTransactions.length,
      activeClass: 'border-amber-500 text-amber-600'
    },
    { 
      value: 'fixed', 
      label: 'Fixas', 
      icon: <RefreshCw className="w-4 h-4" />, 
      count: fixedExpenseTransactions.length,
      activeClass: 'border-orange-500 text-orange-600'
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Compacto */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Transações</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCartaoDialogOpen(true)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Cartão
            </Button>

            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Type Toggle */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.type === 'income' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1 gap-2",
                        formData.type === 'income' && 'gradient-income'
                      )}
                      onClick={() => setFormData({ ...formData, type: 'income', category_id: '' })}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Receita
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === 'expense' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1 gap-2",
                        formData.type === 'expense' && 'gradient-expense'
                      )}
                      onClick={() => setFormData({ ...formData, type: 'expense', category_id: '' })}
                    >
                      <TrendingDown className="w-4 h-4" />
                      Despesa
                    </Button>
                  </div>

                  {/* Botão de despesa no cartão dentro do formulário */}
                  {formData.type === 'expense' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 border-dashed"
                      onClick={() => {
                        setDialogOpen(false);
                        setCartaoDialogOpen(true);
                      }}
                    >
                      <CreditCard className="w-4 h-4" />
                      Ou registrar no cartão de crédito
                    </Button>
                  )}

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="" disabled>Carregando...</SelectItem>
                        ) : filteredCategories.length === 0 ? (
                          <SelectItem value="" disabled>
                            Nenhuma categoria de {formData.type === 'income' ? 'receita' : 'despesa'}
                          </SelectItem>
                        ) : (
                          filteredCategories.map((cat) => {
                            const CategoryIcon = getIconComponent(cat.icon || 'package');
                            return (
                              <SelectItem key={cat.id} value={cat.id}>
                                <span className="flex items-center gap-2">
                                  <CategoryIcon className="w-4 h-4" />
                                  <span>{cat.name}</span>
                                </span>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    {filteredCategories.length === 0 && !categoriesLoading && (
                      <p className="text-xs text-muted-foreground">
                        Vá em Categorias para criar categorias de {formData.type === 'income' ? 'receita' : 'despesa'}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(formData.date, 'PPP', { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => date && setFormData({ ...formData, date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      placeholder="Adicione uma descrição..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Feedback Visual de Status Automático */}
                  {(() => {
                    const today = startOfDay(new Date());
                    const transactionDate = startOfDay(formData.date);
                    const isFutureDate = transactionDate > today;
                    
                    if (isFutureDate) {
                      return (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                          <Clock className="w-4 h-4" />
                          <span>Será registrada como <strong>pendente</strong> (data futura)</span>
                        </div>
                      );
                    }
                    
                    if (formData.is_recurring) {
                      return (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                          <RefreshCw className="w-4 h-4" />
                          <span>Transação recorrente - sempre inicia como <strong>pendente</strong></span>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}

                  {/* Recurring Toggle */}
                  <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="recurring-toggle" className="font-normal cursor-pointer">
                        É uma transação recorrente?
                      </Label>
                    </div>
                    <Switch
                      id="recurring-toggle"
                      checked={formData.is_recurring}
                      onCheckedChange={(checked) => setFormData({ 
                        ...formData, 
                        is_recurring: checked
                      })}
                    />
                  </div>

                  {/* Recurrence Day (only if recurring) */}
                  {formData.is_recurring && (
                    <div className="space-y-2">
                      <Label>Dia do mês</Label>
                      <Select 
                        value={formData.recurrence_day.toString()} 
                        onValueChange={(v) => setFormData({ ...formData, recurrence_day: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              Dia {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!formData.amount || createMutation.isPending || updateMutation.isPending}
                    className="gradient-primary"
                  >
                    {editingId ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Saldo Inicial + Resumo Completo */}
        <div className="space-y-3">
          {/* Card de Saldo Inicial */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Saldo Inicial da Conta</span>
                <p className="font-semibold">{formatCurrency(stats?.saldoInicial || 0)}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEditarSaldoOpen(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurar
            </Button>
          </div>

          {/* Resumo - 6 Indicadores */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Receitas Realizadas */}
            <div className="flex flex-col p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <span className="text-xs text-muted-foreground">Receitas</span>
              <span className="font-semibold text-emerald-600">
                +{formatCurrency(stats?.completedIncome || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground">recebidas</span>
            </div>
            
            {/* Despesas Realizadas */}
            <div className="flex flex-col p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <span className="text-xs text-muted-foreground">Despesas</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(stats?.completedExpense || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground">pagas</span>
            </div>
            
            {/* A Receber */}
            <div className="flex flex-col p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <span className="text-xs text-muted-foreground">A Receber</span>
              <span className="font-semibold text-blue-600">
                +{formatCurrency(stats?.pendingIncome || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground">pendentes</span>
            </div>
            
            {/* A Pagar */}
            <div className="flex flex-col p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <span className="text-xs text-muted-foreground">A Pagar</span>
              <span className="font-semibold text-amber-600">
                -{formatCurrency(stats?.pendingExpense || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground">pendentes</span>
            </div>
            
            {/* Saldo Real */}
            <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Saldo Real</span>
              <span className={cn("font-semibold", 
                (stats?.realBalance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {formatCurrency(stats?.realBalance || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground">base + receitas - despesas</span>
            </div>
            
            {/* Saldo Estimado */}
            <div className="flex flex-col p-3 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-xs text-muted-foreground">Saldo Estimado</span>
              <span className={cn("font-semibold", 
                (stats?.estimatedBalance || 0) >= 0 ? 'text-primary' : 'text-red-600'
              )}>
                {formatCurrency(stats?.estimatedBalance || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground">real + a receber - a pagar</span>
            </div>
          </div>
        </div>

        {/* Dialog Editar Saldo */}
        <EditarSaldoDialog open={editarSaldoOpen} onOpenChange={setEditarSaldoOpen} />

        {/* Tabs + Busca Integrados */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-0">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.value 
                    ? tab.activeClass
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === tab.value 
                    ? "bg-foreground/10" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-64 pb-3 sm:pb-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar..." 
              className="pl-9 h-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Transações Agrupadas por Data */}
        <div className="space-y-6">
          {isLoading ? (
            <LoadingList />
          ) : groupedTransactions.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {activeTab === 'all' && 'Nenhuma transação encontrada'}
                  {activeTab === 'income' && 'Nenhuma receita registrada'}
                  {activeTab === 'expense' && 'Nenhuma despesa registrada'}
                  {activeTab === 'pending' && 'Nenhuma transação pendente'}
                  {activeTab === 'fixed' && 'Nenhuma despesa fixa registrada'}
                </p>
              </CardContent>
            </Card>
          ) : (
            groupedTransactions.map(([date, transactions]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-2 z-10">
                  {formatDateLabel(date)}
                </h3>
                <div className="space-y-1">
                  {transactions.map((transaction) => (
                    <TransactionRow 
                      key={transaction.id} 
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMarkAsPaid={handleMarkAsPaid}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dialog para Despesa no Cartão */}
        <Dialog open={cartaoDialogOpen} onOpenChange={setCartaoDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Despesa no Cartão
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">
                Para registrar despesas no cartão de crédito com parcelamento, 
                vá até a seção de <strong>Cartões</strong>.
              </p>
              <Button 
                className="gradient-primary"
                onClick={() => {
                  setCartaoDialogOpen(false);
                  window.location.href = '/cartoes';
                }}
              >
                Ir para Cartões
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

// Componente de linha de transação
interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

function TransactionRow({ transaction, onEdit, onDelete, onMarkAsPaid }: TransactionRowProps) {
  const IconComponent = getIconComponent(transaction.category?.icon || 'package');
  const isPending = transaction.status === 'pending';
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = isPending && transaction.due_date && transaction.due_date < today;
  
  return (
    <div className="group flex items-center py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors">
      {/* Ícone da categoria */}
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center mr-3 shrink-0",
        isPending 
          ? isOverdue 
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30'
          : transaction.type === 'income' 
            ? 'bg-emerald-100 dark:bg-emerald-900/30' 
            : 'bg-red-100 dark:bg-red-900/30'
      )}>
        <IconComponent className={cn(
          "w-4 h-4",
          isPending 
            ? isOverdue 
              ? 'text-red-600'
              : 'text-amber-600'
            : transaction.type === 'income' 
              ? 'text-emerald-600' 
              : 'text-red-600'
        )} />
      </div>
      
      {/* Descrição + Categoria + Status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">
            {transaction.description || transaction.category?.name || 'Sem descrição'}
          </p>
          {isPending && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full shrink-0",
              isOverdue 
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}>
              {isOverdue ? 'Vencido' : 'Pendente'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground truncate">
            {transaction.category?.name || 'Sem categoria'}
          </p>
          {transaction.due_date && isPending && (
            <span className="text-xs text-muted-foreground">
              • Vence {format(parseISO(transaction.due_date), "dd/MM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
      
      {/* Valor */}
      <span className={cn(
        "font-semibold tabular-nums ml-4",
        isPending 
          ? 'text-amber-600'
          : transaction.type === 'income' 
            ? 'text-emerald-600' 
            : 'text-red-600'
      )}>
        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
      </span>
      
      {/* Ações */}
      <div className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isPending && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" 
            onClick={() => onMarkAsPaid(transaction.id)}
            title="Marcar como pago"
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(transaction)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(transaction.id)} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Componente de loading
function LoadingList() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, groupIdx) => (
        <div key={groupIdx}>
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="space-y-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center py-3 px-4">
                <Skeleton className="w-9 h-9 rounded-lg mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

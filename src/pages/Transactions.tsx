import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { useTransactions, useTransactionsWithBalance, useCreateTransaction, useCreateInstallmentTransaction, useUpdateTransaction, useDeleteTransaction, useMarkAsPaid, useCompleteStats, Transaction, TransactionInsert, TransactionStatus, TipoLancamento } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/lib/formatters';
import { FiltroDataRange } from '@/components/FiltroDataRange';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, TrendingUp, TrendingDown, Calendar, CreditCard, Wallet, RefreshCw, ShoppingCart, Home, Car, Utensils, Briefcase, Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, Book, Package, Zap, DollarSign, Tag, LayoutList, Clock, Check, AlertTriangle, Settings, Copy, Scale, Info, MoreHorizontal, Eye } from 'lucide-react';
import { TransactionDetailsDialog } from '@/components/transactions/TransactionDetailsDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isToday, isYesterday, parseISO, isBefore, isEqual, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { EditarSaldoDialog } from '@/components/EditarSaldoDialog';
import { AjustarSaldoDialog } from '@/components/AjustarSaldoDialog';


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
  tipoLancamento: TipoLancamento;
  totalParcelas: number;
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
  tipoLancamento: 'unica',
  totalParcelas: 2,
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

// Formatar label de mês
function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

// Formatar dia da transação com horário de cadastro
function formatTransactionDay(dateStr: string, createdAt?: string): string {
  const date = parseISO(dateStr);
  const hour = createdAt ? format(parseISO(createdAt), "HH:mm") : null;
  
  let dayLabel: string;
  if (isToday(date)) dayLabel = 'Hoje';
  else if (isYesterday(date)) dayLabel = 'Ontem';
  else dayLabel = format(date, "dd/MM", { locale: ptBR });
  
  return hour ? `${dayLabel}, ${hour}` : dayLabel;
}

export default function Transactions() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cartaoDialogOpen, setCartaoDialogOpen] = useState(false);
  const [editarSaldoOpen, setEditarSaldoOpen] = useState(false);
  const [ajustarSaldoOpen, setAjustarSaldoOpen] = useState(false);
  const [dataInicial, setDataInicial] = useState<Date | undefined>(() => startOfMonth(new Date()));
  const [dataFinal, setDataFinal] = useState<Date | undefined>(() => endOfMonth(new Date()));
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);

  // Formatar datas para o hook
  const startDate = dataInicial ? format(dataInicial, 'yyyy-MM-dd') : undefined;
  const endDate = dataFinal ? format(dataFinal, 'yyyy-MM-dd') : undefined;

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactionsData, isLoading, isFetching } = useTransactionsWithBalance({
    startDate,
    endDate,
  });
  
  const transactions = transactionsData?.transactions;
  const saldoMap = transactionsData?.saldoMap;
  const totalGuardado = transactionsData?.totalGuardado || 0;
  const ultimaTransacaoId = transactionsData?.ultimaTransacaoId;
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
  };
  const { data: stats } = useCompleteStats();
  const createMutation = useCreateTransaction();
  const createInstallmentMutation = useCreateInstallmentTransaction();
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

  // Ordenar transações por data de criação (mais recente primeiro)
  const sortedTransactions = useMemo(() => {
    return [...activeTransactions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activeTransactions]);

  // Filtrar categorias pelo tipo selecionado
  const filteredCategories = categories?.filter((c) => c.type === formData.type) || [];

  const handleSubmit = () => {
    const today = startOfDay(new Date());
    const transactionDate = startOfDay(formData.date);
    
    // Lógica automática: data futura, recorrente OU parcelada/fixa = pendente
    const isFutureDate = transactionDate > today;
    const isParceladaOuFixa = formData.tipoLancamento !== 'unica';
    const autoStatus: TransactionStatus = (formData.is_recurring || isFutureDate || isParceladaOuFixa) 
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
      is_recurring: formData.tipoLancamento === 'fixa' || formData.is_recurring,
      recurrence_day: formData.is_recurring ? formData.recurrence_day : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data }, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      });
    } else if (formData.tipoLancamento !== 'unica') {
      // Usar hook de parcelamento
      createInstallmentMutation.mutate({
        baseTransaction: data,
        totalParcelas: formData.totalParcelas,
        tipoLancamento: formData.tipoLancamento,
      }, {
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
      tipoLancamento: (transaction.tipo_lancamento as TipoLancamento) || 'unica',
      totalParcelas: transaction.total_parcelas || 2,
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

  const handleDuplicate = (transaction: Transaction) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category_id: transaction.category_id || '',
      description: transaction.description || '',
      date: new Date(), // Data atual para a duplicação
      status: 'completed',
      due_date: undefined,
      is_recurring: transaction.is_recurring || false,
      recurrence_day: transaction.recurrence_day || 1,
      tipoLancamento: 'unica', // Reset para única na duplicação
      totalParcelas: 2,
    });
    setEditingId(null); // Nova transação
    setDialogOpen(true);
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
        {/* Header - título e botões na mesma linha */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-foreground">Transações</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCartaoDialogOpen(true)}
            >
              <CreditCard className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cartão</span>
            </Button>

            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nova</span>
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

                  {/* Tipo de Lançamento - Somente para despesas e nova transação */}
                  {formData.type === 'expense' && !editingId && (
                    <div className="space-y-3">
                      <Label>Tipo de lançamento</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={formData.tipoLancamento === 'unica' ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            "flex-1",
                            formData.tipoLancamento === 'unica' && 'bg-primary'
                          )}
                          onClick={() => setFormData({ ...formData, tipoLancamento: 'unica', is_recurring: false })}
                        >
                          Única
                        </Button>
                        <Button
                          type="button"
                          variant={formData.tipoLancamento === 'parcelada' ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            "flex-1",
                            formData.tipoLancamento === 'parcelada' && 'bg-primary'
                          )}
                          onClick={() => setFormData({ ...formData, tipoLancamento: 'parcelada', is_recurring: false })}
                        >
                          Parcelada
                        </Button>
                        <Button
                          type="button"
                          variant={formData.tipoLancamento === 'fixa' ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            "flex-1",
                            formData.tipoLancamento === 'fixa' && 'bg-primary'
                          )}
                          onClick={() => setFormData({ ...formData, tipoLancamento: 'fixa', is_recurring: true })}
                        >
                          Fixa
                        </Button>
                      </div>

                      {/* Seletor de Parcelas */}
                      {formData.tipoLancamento === 'parcelada' && (
                        <div className="space-y-2">
                          <Label>Número de parcelas</Label>
                          <Select 
                            value={formData.totalParcelas.toString()} 
                            onValueChange={(v) => setFormData({ ...formData, totalParcelas: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 47 }, (_, i) => i + 2).map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}x
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Resumo Visual */}
                      {formData.tipoLancamento !== 'unica' && formData.amount && (
                        <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {formData.tipoLancamento === 'parcelada' ? (
                              <>
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>
                                  {formData.totalParcelas}x de {formatCurrency(parseFloat(formData.amount) / formData.totalParcelas)}
                                </span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 text-primary" />
                                <span>{formatCurrency(parseFloat(formData.amount))}/mês</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formData.tipoLancamento === 'parcelada' 
                              ? `Serão criadas ${formData.totalParcelas} transações pendentes`
                              : 'Serão criadas 12 transações mensais pendentes'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Visual de Status Automático */}
                  {(() => {
                    const today = startOfDay(new Date());
                    const transactionDate = startOfDay(formData.date);
                    const isFutureDate = transactionDate > today;
                    
                    if (formData.tipoLancamento !== 'unica' && formData.type === 'expense') {
                      return null; // O resumo já mostra a informação
                    }
                    
                    if (isFutureDate) {
                      return (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                          <Clock className="w-4 h-4" />
                          <span>Será registrada como <strong>pendente</strong> (data futura)</span>
                        </div>
                      );
                    }
                    
                    if (formData.is_recurring && formData.tipoLancamento === 'unica') {
                      return (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                          <RefreshCw className="w-4 h-4" />
                          <span>Transação recorrente - sempre inicia como <strong>pendente</strong></span>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}

                  {/* Recurring Toggle - Somente para receitas ou transações únicas */}
                  {(formData.type === 'income' || formData.tipoLancamento === 'unica') && (
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
                  )}

                  {/* Recurrence Day (only if recurring and not fixed) */}
                  {formData.is_recurring && formData.tipoLancamento !== 'fixa' && (
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

        {/* Filtro de datas em linha separada */}
        <FiltroDataRange
          startDate={dataInicial}
          endDate={dataFinal}
          onStartDateChange={setDataInicial}
          onEndDateChange={setDataFinal}
          onRefresh={handleRefresh}
          isLoading={isFetching}
        />

        {/* Saldo Inicial + Resumo Completo */}
        <div className="space-y-3">
          {/* Card de Saldo Inicial e Metas */}
          <div className="flex items-center justify-between p-2 sm:p-3 gap-2 bg-muted/30 rounded-lg border border-border/50">
            {/* Saldo Inicial */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Saldo Inicial</span>
                <p className="font-semibold text-sm sm:text-base truncate">
                  {formatCurrency(stats?.saldoInicial || 0)}
                </p>
              </div>
            </div>
            
            {/* Em Metas + Botão */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {(stats?.totalMetas || 0) > 0 && (
                <div className="text-right">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Em Metas</span>
                  <p className="font-semibold text-primary text-sm sm:text-base">
                    {formatCurrency(stats?.totalMetas || 0)}
                  </p>
                </div>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setEditarSaldoOpen(true)}
                className="h-8 w-8"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Resumo - 6 Indicadores */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
            {/* Receitas Realizadas */}
            <div className="flex flex-col p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Receitas</span>
              <span className="font-semibold text-emerald-600 text-sm sm:text-base truncate">
                +{formatCurrency(stats?.completedIncome || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">recebidas</span>
            </div>
            
            {/* Despesas Realizadas */}
            <div className="flex flex-col p-2 sm:p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Despesas</span>
              <span className="font-semibold text-red-600 text-sm sm:text-base truncate">
                -{formatCurrency(stats?.completedExpense || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">pagas</span>
            </div>
            
            {/* A Receber */}
            <div className="flex flex-col p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <span className="text-[10px] sm:text-xs text-muted-foreground">A Receber</span>
              <span className="font-semibold text-blue-600 text-sm sm:text-base truncate">
                +{formatCurrency(stats?.pendingIncome || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">pendentes</span>
            </div>
            
            {/* A Pagar */}
            <div className="flex flex-col p-2 sm:p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <span className="text-[10px] sm:text-xs text-muted-foreground">A Pagar</span>
              <span className="font-semibold text-amber-600 text-sm sm:text-base truncate">
                -{formatCurrency(stats?.pendingExpense || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">pendentes</span>
            </div>
            
            {/* Saldo Real */}
            <div 
              className="flex flex-col p-2 sm:p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors group"
              onClick={() => setAjustarSaldoOpen(true)}
              title="Clique para ajustar"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-muted-foreground">Saldo Real</span>
                <Scale className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className={cn("font-semibold text-sm sm:text-base truncate", 
                (stats?.realBalance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {formatCurrency(stats?.realBalance || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">clique para ajustar</span>
            </div>
            
            {/* Saldo Estimado */}
            <div className="flex flex-col p-2 sm:p-3 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Estimado</span>
              <span className={cn("font-semibold text-sm sm:text-base truncate", 
                (stats?.estimatedBalance || 0) >= 0 ? 'text-primary' : 'text-red-600'
              )}>
                {formatCurrency(stats?.estimatedBalance || 0)}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">real + a receber - a pagar</span>
            </div>
          </div>
        </div>

        {/* Dialog Editar Saldo */}
        <EditarSaldoDialog open={editarSaldoOpen} onOpenChange={setEditarSaldoOpen} />

        {/* Dialog Ajustar Saldo Real */}
        <AjustarSaldoDialog 
          open={ajustarSaldoOpen} 
          onOpenChange={setAjustarSaldoOpen}
          saldoRealCalculado={stats?.realBalance || 0}
          totalReceitas={stats?.completedIncome || 0}
          totalDespesas={stats?.completedExpense || 0}
        />

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

        {/* Lista de Transações */}
        <div className="space-y-1">
          {isLoading ? (
            <LoadingList />
          ) : sortedTransactions.length === 0 ? (
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
            sortedTransactions.map((transaction) => (
              <TransactionRow 
                key={transaction.id} 
                transaction={transaction}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMarkAsPaid={handleMarkAsPaid}
                onDuplicate={handleDuplicate}
                onView={setViewingTransaction}
                saldoApos={saldoMap?.get(transaction.id)}
                isUltimaTransacao={transaction.id === ultimaTransacaoId}
                totalGuardado={totalGuardado}
              />
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

        {/* Dialog Ver Detalhes */}
        <TransactionDetailsDialog
          transaction={viewingTransaction}
          open={!!viewingTransaction}
          onOpenChange={(open) => !open && setViewingTransaction(null)}
          onEdit={handleEdit}
        />
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
  onDuplicate: (transaction: Transaction) => void;
  onView: (transaction: Transaction) => void;
  saldoApos?: number;
  isUltimaTransacao?: boolean;
  totalGuardado?: number;
}

function TransactionRow({ transaction, onEdit, onDelete, onMarkAsPaid, onDuplicate, onView, saldoApos, isUltimaTransacao, totalGuardado = 0 }: TransactionRowProps) {
  const IconComponent = getIconComponent(transaction.category?.icon || 'package');
  const isPending = transaction.status === 'pending';
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = isPending && transaction.due_date && transaction.due_date < today;
  
  return (
    <div className="group flex items-center py-2 sm:py-3 px-2 sm:px-4 hover:bg-muted/50 rounded-lg transition-colors">
      {/* Ícone da categoria */}
      <div className={cn(
        "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shrink-0",
        isPending 
          ? isOverdue 
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30'
          : transaction.type === 'income' 
            ? 'bg-emerald-100 dark:bg-emerald-900/30' 
            : 'bg-red-100 dark:bg-red-900/30'
      )}>
        <IconComponent className={cn(
          "w-3.5 h-3.5 sm:w-4 sm:h-4",
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
        <div className="flex items-center gap-1 sm:gap-2">
          <p className="font-medium text-foreground truncate text-sm sm:text-base">
            {transaction.description || transaction.category?.name || 'Sem descrição'}
          </p>
          {/* Badge de Parcela - visível em mobile */}
          {transaction.tipo_lancamento === 'parcelada' && transaction.numero_parcela && transaction.total_parcelas && (
            <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {transaction.numero_parcela}/{transaction.total_parcelas}
            </span>
          )}
          {/* Ícone de Fixa */}
          {transaction.tipo_lancamento === 'fixa' && (
            <RefreshCw className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
          {/* Badge de Status - esconder em mobile (ícone colorido já indica) */}
          {isPending && (
            <span className={cn(
              "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline",
              isOverdue 
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}>
              {isOverdue ? 'Vencido' : 'Pendente'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
          <span>
            {formatTransactionDay(transaction.date, transaction.created_at)}
          </span>
          {/* Categoria - esconder em mobile */}
          <span className="hidden sm:contents">
            <span className="text-muted-foreground/50">•</span>
            <span className="truncate max-w-[100px]">
              {transaction.category?.name || 'Sem categoria'}
            </span>
          </span>
          {/* Vencimento - esconder em mobile */}
          {transaction.due_date && isPending && (
            <span className="hidden sm:inline">
              • Vence {format(parseISO(transaction.due_date), "dd/MM", { locale: ptBR })}
            </span>
          )}
          {/* Saldo após a transação - esconder em mobile */}
          {saldoApos !== undefined && transaction.status === 'completed' && (
            <span className="hidden sm:contents">
              <span className="text-muted-foreground/50">•</span>
              {isUltimaTransacao && totalGuardado > 0 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn(
                        "text-xs font-medium flex items-center gap-1 cursor-help",
                        saldoApos >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        Saldo: {formatCurrency(saldoApos)}
                        <Info className="w-3 h-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="p-3">
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">Patrimônio: {formatCurrency(saldoApos + totalGuardado)}</p>
                        <p className="text-muted-foreground">Guardado: {formatCurrency(totalGuardado)}</p>
                        <p className="font-semibold">Disponível: {formatCurrency(saldoApos)}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className={cn(
                  "text-xs font-medium",
                  saldoApos >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  Saldo: {formatCurrency(saldoApos)}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
      
      {/* Valor */}
      <span className={cn(
        "font-semibold tabular-nums ml-2 sm:ml-4 text-sm sm:text-base",
        isPending 
          ? 'text-amber-600'
          : transaction.type === 'income' 
            ? 'text-emerald-600' 
            : 'text-red-600'
      )}>
        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
      </span>
      
      {/* Ações - Mobile: dropdown, Desktop: hover buttons */}
      <div className="ml-2 flex gap-1">
        {/* Mobile dropdown */}
        <div className="flex md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(transaction)}>
                <Eye className="w-4 h-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              {isPending && (
                <DropdownMenuItem onClick={() => onMarkAsPaid(transaction.id)}>
                  <Check className="w-4 h-4 mr-2 text-emerald-600" />
                  Marcar como pago
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate(transaction)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(transaction.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Desktop hover buttons */}
        <div className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => onView(transaction)}
            title="Ver detalhes"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => onDuplicate(transaction)}
            title="Duplicar transação"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(transaction)} title="Editar">
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

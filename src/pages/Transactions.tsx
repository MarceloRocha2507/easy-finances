import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RecurringDeleteDialog } from '@/components/transactions/RecurringDeleteDialog';
import { Layout } from '@/components/Layout';
import { useTransactions, useTransactionsWithBalance, useCreateTransaction, useCreateInstallmentTransaction, useUpdateTransaction, useDeleteTransaction, useDeleteRecurringTransactions, useMarkAsPaid, useCompleteStats, Transaction, TransactionInsert, TransactionStatus, TipoLancamento } from '@/hooks/useTransactions';
import { useFaturasNaListagem, FaturaVirtual } from '@/hooks/useFaturasNaListagem';
import { Badge } from '@/components/ui/badge';
import { StatCardMinimal } from '@/components/dashboard/StatCardMinimal';
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
import { Plus, Pencil, Trash2, Search, TrendingUp, TrendingDown, Calendar, CreditCard, Wallet, RefreshCw, ShoppingCart, Home, Car, Utensils, Briefcase, Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, Book, Package, Zap, DollarSign, Tag, LayoutList, Clock, Check, AlertTriangle, Settings, Copy, Scale, Info, MoreHorizontal, Eye, ChevronDown, ChevronRight, Repeat, Sparkles } from 'lucide-react';
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
import { AnimatedSection, AnimatedItem } from '@/components/ui/animated-section';
import { AjustarSaldoDialog } from '@/components/AjustarSaldoDialog';
import { useAssinaturas } from '@/hooks/useAssinaturas';
import { useAutoCategory } from '@/hooks/useAutoCategory';
import { BancoSelector } from '@/components/bancos/BancoSelector';

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  category_id: string;
  banco_id: string | null;
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
  banco_id: null,
  description: '',
  date: new Date(),
  status: 'completed',
  due_date: undefined,
  is_recurring: false,
  recurrence_day: 1,
  tipoLancamento: 'unica',
  totalParcelas: 12,
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

// Tipos e configuração de agrupamento
type GrupoTransacao = {
  key: string;
  label: string;
  items: (Transaction | FaturaVirtual)[];
  subtotal: number;
};

const GRUPO_CONFIG = {
  faturas: {
    key: 'faturas',
    label: 'Faturas de Cartão',
  },
  fixas: {
    key: 'fixas',
    label: 'Fixas / Recorrentes',
  },
  despesas: {
    key: 'despesas',
    label: 'Despesas',
  },
  receitas: {
    key: 'receitas',
    label: 'Receitas',
  },
  receitas_fixas: {
    key: 'receitas_fixas',
    label: 'Receitas Fixas',
  },
  receitas_avulsas: {
    key: 'receitas_avulsas',
    label: 'Receitas',
  },
  despesas_pendentes: {
    key: 'despesas_pendentes',
    label: 'Despesas Pendentes',
  },
  receitas_pendentes: {
    key: 'receitas_pendentes',
    label: 'Receitas Pendentes',
  },
} as const;

function classificarItem(item: Transaction | FaturaVirtual): string {
  if ('isFaturaCartao' in item) return 'faturas';
  const t = item as Transaction;
  if (t.category?.name === 'Fatura de Cartão') return 'faturas';
  if (t.tipo_lancamento === 'fixa' || t.is_recurring) {
    return t.type === 'income' ? 'receitas_fixas' : 'fixas';
  }
  if (t.type === 'income') return 'receitas_avulsas';
  return 'despesas';
}

function agruparTransacoes(items: (Transaction | FaturaVirtual)[], activeTab: TabType): GrupoTransacao[] {
  const gruposMap = new Map<string, (Transaction | FaturaVirtual)[]>();

  for (const item of items) {
    let grupoKey = classificarItem(item);
    
    // Na tab "all", receitas fixas e avulsas ficam como "receitas"
    if (activeTab === 'all' && (grupoKey === 'receitas_fixas' || grupoKey === 'receitas_avulsas')) {
      grupoKey = 'receitas';
    }
    // Na tab "expense", não separar receitas
    if (activeTab === 'expense' && grupoKey.startsWith('receitas')) {
      grupoKey = 'despesas';
    }
    // Na tab "pending", agrupar por tipo
    if (activeTab === 'pending') {
      const isIncome = 'type' in item && item.type === 'income';
      grupoKey = isIncome ? 'receitas_pendentes' : 'despesas_pendentes';
    }

    if (!gruposMap.has(grupoKey)) {
      gruposMap.set(grupoKey, []);
    }
    gruposMap.get(grupoKey)!.push(item);
  }

  // Ordem dos grupos
  const ordemGrupos = ['faturas', 'fixas', 'despesas', 'receitas_fixas', 'receitas_avulsas', 'receitas', 'despesas_pendentes', 'receitas_pendentes'];

  return ordemGrupos
    .filter(key => gruposMap.has(key))
    .map(key => {
      const config = GRUPO_CONFIG[key as keyof typeof GRUPO_CONFIG];
      const groupItems = gruposMap.get(key)!;
      // Ordenar por data dentro do grupo
      groupItems.sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        key: config.key,
        label: config.label,
        items: groupItems,
        subtotal: groupItems.reduce((sum, item) => sum + item.amount, 0),
      };
    });
}

// Componente GroupHeader — estilo minimalista tipo extrato bancário
function GroupHeader({ grupo, collapsed, onToggle }: { grupo: GrupoTransacao; collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2 px-1 border-b border-border/50 hover:bg-muted/30 transition-colors"
    >
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {grupo.label} ({grupo.items.length})
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {formatCurrency(grupo.subtotal)}
        </span>
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />
        )}
      </div>
    </button>
  );
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [recurringDeleteTransaction, setRecurringDeleteTransaction] = useState<Transaction | null>(null);
  const [isSuggested, setIsSuggested] = useState(false);
  // Formatar datas para o hook
  const startDate = dataInicial ? format(dataInicial, 'yyyy-MM-dd') : undefined;
  const endDate = dataFinal ? format(dataFinal, 'yyyy-MM-dd') : undefined;

  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: faturasVirtuais } = useFaturasNaListagem();
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
  const filteredCategoriesForAuto = useMemo(() => categories?.filter((c) => c.type === formData.type) || [], [categories, formData.type]);
  const { suggestedCategoryId, isSuggestion } = useAutoCategory(formData.description, filteredCategoriesForAuto, !editingId);

  // Aplicar sugestão automática quando disponível e nenhuma categoria foi escolhida manualmente
  useEffect(() => {
    if (suggestedCategoryId && isSuggestion && !formData.category_id) {
      setFormData(prev => ({ ...prev, category_id: suggestedCategoryId }));
      setIsSuggested(true);
    }
  }, [suggestedCategoryId, isSuggestion]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
  };
  const { data: stats, isFetching: isStatsFetching } = useCompleteStats(dataInicial);
  const { assinaturas, isLoading: isAssinaturasLoading } = useAssinaturas();

  const assinaturasAtivas = useMemo(() => assinaturas.filter(a => a.status === 'ativa'), [assinaturas]);
  const totalMensalAssinaturas = useMemo(() => assinaturasAtivas.reduce((sum, a) => {
    const divisor = ({ mensal: 1, trimestral: 3, semestral: 6, anual: 12 } as Record<string, number>)[a.frequencia] || 1;
    return sum + a.valor / divisor;
  }, 0), [assinaturasAtivas]);
  const renovamEssaSemana = useMemo(() => assinaturasAtivas.filter(a => {
    const prox = new Date(a.proxima_cobranca + 'T12:00:00');
    const diff = (prox.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length, [assinaturasAtivas]);
  const createMutation = useCreateTransaction();
  const createInstallmentMutation = useCreateInstallmentTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const deleteRecurringMutation = useDeleteRecurringTransactions();
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
  
  // Filtrar faturas virtuais pelo período selecionado
  const faturasFiltradas = useMemo(() => {
    return (faturasVirtuais || []).filter(f => {
      if (startDate && f.date < startDate) return false;
      if (endDate && f.date > endDate) return false;
      return true;
    });
  }, [faturasVirtuais, startDate, endDate]);

  const expenseTransactions = useMemo(() => {
    const expenses = searchedTransactions.filter(t => t.type === 'expense');
    const combinadas = [...expenses, ...faturasFiltradas] as (Transaction | FaturaVirtual)[];
    return combinadas;
  }, [searchedTransactions, faturasFiltradas]);
  
  const fixedExpenseTransactions = useMemo(() => 
    expenseTransactions.filter(t => 
      !('isFaturaCartao' in t) && FIXED_EXPENSE_CATEGORIES.includes((t as Transaction).category?.name || '')
    ) as Transaction[], 
    [expenseTransactions]
  );

  const pendingTransactions = useMemo(() => 
    searchedTransactions.filter(t => t.status === 'pending'), 
    [searchedTransactions]
  );

  // Transações ativas baseado na tab
  const activeTransactions = useMemo((): (Transaction | FaturaVirtual)[] => {
    switch (activeTab) {
      case 'income': return incomeTransactions;
      case 'expense': return expenseTransactions;
      case 'pending': return pendingTransactions;
      case 'fixed': return fixedExpenseTransactions;
      default: return [...searchedTransactions, ...faturasFiltradas];
    }
  }, [activeTab, searchedTransactions, incomeTransactions, expenseTransactions, pendingTransactions, fixedExpenseTransactions, faturasFiltradas]);

  // Ordenar transações por data (mais recente primeiro), faturas futuras ao final
  const sortedTransactions = useMemo(() => {
    return [...activeTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      const now = Date.now();
      const aFuture = dateA > now;
      const bFuture = dateB > now;
      if (aFuture !== bFuture) return aFuture ? 1 : -1;
      if (aFuture && bFuture) return dateA - dateB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [activeTransactions]);

  // Tabs que usam agrupamento
  const useGrouping = activeTab === 'all' || activeTab === 'expense' || activeTab === 'income' || activeTab === 'pending';

  const grupos = useMemo(() => {
    if (!useGrouping) return [];
    return agruparTransacoes(sortedTransactions, activeTab);
  }, [sortedTransactions, activeTab, useGrouping]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
      banco_id: formData.banco_id || null,
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
    } else if (formData.tipoLancamento !== 'unica' || formData.is_recurring) {
      // Usar hook de parcelamento para parceladas, fixas E recorrentes
      createInstallmentMutation.mutate({
        baseTransaction: data,
        totalParcelas: formData.totalParcelas,
        tipoLancamento: formData.is_recurring && formData.tipoLancamento === 'unica' 
          ? 'fixa' 
          : formData.tipoLancamento,
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
    setIsSuggested(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category_id: transaction.category_id || '',
      banco_id: transaction.banco_id || null,
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

  const handleDelete = (transaction: Transaction) => {
    const isRecurring = transaction.is_recurring || transaction.tipo_lancamento === 'fixa' || transaction.tipo_lancamento === 'parcelada';
    if (isRecurring) {
      setRecurringDeleteTransaction(transaction);
    } else {
      if (window.confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
        deleteMutation.mutate(transaction.id);
      }
    }
  };

  const handleDuplicate = (transaction: Transaction) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category_id: transaction.category_id || '',
      banco_id: transaction.banco_id || null,
      description: transaction.description || '',
      date: new Date(),
      status: 'completed',
      due_date: undefined,
      is_recurring: transaction.is_recurring || false,
      recurrence_day: transaction.recurrence_day || 1,
      tipoLancamento: 'unica',
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
      <div className="space-y-6 page-enter">
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
                        formData.type === 'income' && 'gradient-income text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
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
                        formData.type === 'expense' && 'gradient-expense text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
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

                  {/* Description - antes da categoria para acionar auto-sugestão */}
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Ex: Almoço no restaurante, Uber para o trabalho..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Categoria</Label>
                      {isSuggested && formData.category_id && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-1 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border-0">
                          <Sparkles className="w-3 h-3" />
                          Sugestão automática
                        </Badge>
                      )}
                    </div>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(v) => {
                        setFormData({ ...formData, category_id: v });
                        setIsSuggested(false);
                      }}
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

                  {/* Conta Bancária */}
                  <BancoSelector
                    value={formData.banco_id}
                    onChange={(bancoId) => setFormData({ ...formData, banco_id: bancoId })}
                    label="Conta Bancária"
                    placeholder="Selecione a conta"
                  />

                  {/* Data */}
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(formData.date, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => date && setFormData({ ...formData, date })}
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
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

                      {/* Seletor de Meses - Fixa */}
                      {formData.tipoLancamento === 'fixa' && (
                        <div className="space-y-2">
                          <Label>Quantos meses?</Label>
                          <Select 
                            value={formData.totalParcelas.toString()} 
                            onValueChange={(v) => setFormData({ ...formData, totalParcelas: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {[3, 6, 12, 18, 24, 36, 48].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} meses
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
                              : `Serão criadas ${formData.totalParcelas} transações mensais pendentes`
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

                  {/* Seletor de repetições para recorrentes */}
                  {formData.is_recurring && formData.tipoLancamento === 'unica' && (
                    <div className="space-y-2">
                      <Label>Quantos meses?</Label>
                      <Select 
                        value={formData.totalParcelas.toString()} 
                        onValueChange={(v) => setFormData({ ...formData, totalParcelas: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {[3, 6, 12, 18, 24, 36, 48].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n} meses
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
        <AnimatedSection className="space-y-3">
          {/* Card de Saldo Inicial e Metas */}
          <div className="flex items-center justify-between p-2 sm:p-3 gap-2 bg-muted/30 rounded-lg border border-border/50">
            {/* Saldo Inicial */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Saldo Inicial</span>
                {isStatsFetching ? (
                  <Skeleton className="h-5 w-24 sm:h-6 sm:w-28" />
                ) : (
                  <p className="font-semibold text-sm sm:text-base truncate">
                    {formatCurrency(stats?.saldoInicial || 0)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Em Metas + Botão */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {isStatsFetching ? (
                <div className="text-right">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Em Metas</span>
                  <Skeleton className="h-5 w-20 sm:h-6 sm:w-24" />
                </div>
              ) : (stats?.totalMetas || 0) > 0 && (
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

          {/* Resumo - StatCards Minimalistas */}
          <AnimatedSection delay={0.1} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCardMinimal
              title="Receitas"
              value={stats?.completedIncome || 0}
              icon={TrendingUp}
              subInfo="recebidas"
              delay={0}
              isLoading={isStatsFetching}
            />
             <StatCardMinimal
              title="Despesas"
              value={stats?.completedExpense || 0}
              icon={TrendingDown}
              subInfo="pagas"
              valueColor="expense"
              delay={0.05}
              isLoading={isStatsFetching}
            />
            <StatCardMinimal
              title="A Receber"
              value={stats?.pendingIncome || 0}
              icon={Clock}
              prefix="+"
              subInfo="pendentes"
              delay={0.1}
              isLoading={isStatsFetching}
            />
            <StatCardMinimal
              title="A Pagar"
              value={stats?.pendingExpense || 0}
              icon={AlertTriangle}
              prefix="-"
              subInfo="pendentes"
              delay={0.15}
              isLoading={isStatsFetching}
            />
            <StatCardMinimal
              title="Saldo Real"
              value={stats?.realBalance || 0}
              icon={Scale}
              subInfo="clique para ajustar"
              onClick={() => setAjustarSaldoOpen(true)}
              delay={0.2}
              isLoading={isStatsFetching}
            />
            <StatCardMinimal
              title="Estimado"
              value={stats?.estimatedBalance || 0}
              icon={Info}
              subInfo="real + a receber - a pagar"
              delay={0.25}
              isLoading={isStatsFetching}
            />
            <StatCardMinimal
              title="Assinaturas"
              value={totalMensalAssinaturas}
              icon={Repeat}
              subInfo={
                <>
                  {assinaturasAtivas.length} ativas
                  {renovamEssaSemana > 0 && (
                    <span className="text-amber-500 ml-1">
                      · {renovamEssaSemana} renovam essa semana
                    </span>
                  )}
                </>
              }
              onClick={() => navigate('/assinaturas')}
              delay={0.3}
              isLoading={isAssinaturasLoading}
              valueColor="expense"
            />
          </AnimatedSection>
        </AnimatedSection>

        {/* Dialog Editar Saldo */}
        <EditarSaldoDialog open={editarSaldoOpen} onOpenChange={setEditarSaldoOpen} />

        {/* Dialog Ajustar Saldo Real */}
        <AjustarSaldoDialog 
          open={ajustarSaldoOpen} 
          onOpenChange={setAjustarSaldoOpen}
          saldoRealCalculado={stats?.realBalance || 0}
          totalReceitas={stats?.allCompletedIncome || 0}
          totalDespesas={stats?.allCompletedExpense || 0}
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
        <div className="space-y-2">
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
          ) : useGrouping && grupos.length > 0 ? (
            grupos.map((grupo, grupoIdx) => {
              const isCollapsed = collapsedGroups.has(grupo.key);
              return (
                <AnimatedItem key={grupo.key} index={grupoIdx} className="mb-4">
                  <GroupHeader grupo={grupo} collapsed={isCollapsed} onToggle={() => toggleGroup(grupo.key)} />
                  {!isCollapsed && (
                    <div className="divide-y divide-border/30">
                      {grupo.items.map((item, itemIdx) => (
                        <div
                          key={item.id}
                          className="stagger-item"
                          style={{ "--stagger-index": Math.min(itemIdx, 12) } as React.CSSProperties}
                        >
                          {'isFaturaCartao' in item ? (
                            <FaturaCartaoRow 
                              fatura={item as FaturaVirtual}
                              onClick={() => navigate(`/cartoes`)}
                            />
                          ) : (
                            <TransactionRow 
                              transaction={item as Transaction}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onMarkAsPaid={handleMarkAsPaid}
                              onDuplicate={handleDuplicate}
                              onView={setViewingTransaction}
                              saldoApos={saldoMap?.get(item.id)}
                              isUltimaTransacao={item.id === ultimaTransacaoId}
                              totalGuardado={totalGuardado}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </AnimatedItem>
              );
            })
          ) : (
            sortedTransactions.map((item, itemIdx) => (
              <AnimatedItem key={item.id} index={itemIdx}>
                {'isFaturaCartao' in item ? (
                  <FaturaCartaoRow 
                    fatura={item as FaturaVirtual}
                    onClick={() => navigate(`/cartoes`)}
                  />
                ) : (
                  <TransactionRow 
                    transaction={item as Transaction}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMarkAsPaid={handleMarkAsPaid}
                    onDuplicate={handleDuplicate}
                    onView={setViewingTransaction}
                    saldoApos={saldoMap?.get(item.id)}
                    isUltimaTransacao={item.id === ultimaTransacaoId}
                    totalGuardado={totalGuardado}
                  />
                )}
              </AnimatedItem>
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

        {/* Dialog exclusão recorrente */}
        <RecurringDeleteDialog
          transaction={recurringDeleteTransaction}
          onClose={() => setRecurringDeleteTransaction(null)}
          onDelete={(mode) => {
            if (recurringDeleteTransaction) {
              deleteRecurringMutation.mutate({ transactionId: recurringDeleteTransaction.id, mode });
              setRecurringDeleteTransaction(null);
            }
          }}
        />
      </div>
    </Layout>
  );
}

// Componente de linha de transação
interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onMarkAsPaid: (id: string) => void;
  onDuplicate: (transaction: Transaction) => void;
  onView: (transaction: Transaction) => void;
  saldoApos?: number;
  isUltimaTransacao?: boolean;
  totalGuardado?: number;
}

function TransactionRow({ transaction, onEdit, onDelete, onMarkAsPaid, onDuplicate, onView, saldoApos, isUltimaTransacao, totalGuardado = 0 }: TransactionRowProps) {
  const isFaturaCartaoPaga = transaction.category?.name === 'Fatura de Cartão' || transaction.description?.startsWith('Fatura ');
  const IconComponent = isFaturaCartaoPaga ? CreditCard : getIconComponent(transaction.category?.icon || 'package');
  const isPending = transaction.status === 'pending';
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = isPending && transaction.due_date && transaction.due_date < today;
  
  return (
    <div className="group flex items-center py-2 sm:py-3 px-2 sm:px-4 hover:bg-muted/50 rounded-lg transition-colors">
      {/* Ícone da categoria */}
      <div className={cn(
        "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shrink-0",
        isFaturaCartaoPaga
          ? 'bg-violet-100 dark:bg-violet-900/30'
          : isPending 
            ? isOverdue 
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
            : transaction.type === 'income' 
              ? 'bg-emerald-100 dark:bg-emerald-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
      )}>
        <IconComponent className={cn(
          "w-3.5 h-3.5 sm:w-4 sm:h-4",
          isFaturaCartaoPaga
            ? 'text-violet-600'
            : isPending 
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
          {/* Badge de fatura paga */}
          {isFaturaCartaoPaga && (
            <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 shrink-0 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hidden sm:inline-flex">
              <CreditCard className="w-3 h-3 mr-0.5" />
              Cartão
            </Badge>
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
      
      {/* Valor + Ações container */}
      <div className="flex items-center gap-1 ml-2 sm:ml-4 relative">
        {/* Valor - sempre visível */}
        <span className={cn(
          "font-semibold tabular-nums text-sm sm:text-base shrink-0",
          isPending 
            ? 'text-amber-600'
            : transaction.type === 'income' 
              ? 'text-emerald-600' 
              : 'text-red-600'
        )}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>

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
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(transaction)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop hover - posição absoluta, aparece sobre o valor */}
        <div className="hidden md:flex items-center gap-0.5 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card rounded-md pl-1 pr-0.5 py-0.5 shadow-sm border border-border/50">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => onView(transaction)}
            title="Ver detalhes"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {isPending && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" 
              onClick={() => onMarkAsPaid(transaction.id)}
              title="Marcar como pago"
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => onDuplicate(transaction)}
            title="Duplicar transação"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(transaction)} title="Editar">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive hover:text-destructive" 
            onClick={() => onDelete(transaction)}
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente para fatura virtual de cartão
interface FaturaCartaoRowProps {
  fatura: FaturaVirtual;
  onClick: () => void;
}

function FaturaCartaoRow({ fatura, onClick }: FaturaCartaoRowProps) {
  const statusConfig = {
    aberta: { label: 'Em aberto', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    fechada: { label: 'Fechada', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    pendente: { label: 'Pendente', className: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[fatura.statusFatura];

  return (
    <div 
      className="group flex items-center py-2 sm:py-3 px-2 sm:px-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Ícone de cartão com fundo roxo */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shrink-0 bg-violet-100 dark:bg-violet-900/30">
        <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" />
      </div>
      
      {/* Descrição + Status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <p className="font-medium text-foreground truncate text-sm sm:text-base">
            {fatura.description}
          </p>
          <Badge variant="outline" className={cn("text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 shrink-0 border-0", status.className)}>
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
          <span>Vence {format(parseISO(fatura.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
          <span className="hidden sm:inline text-muted-foreground/50">•</span>
          <span className="hidden sm:inline" style={{ color: fatura.cartaoCor }}>
            {fatura.cartaoNome}
          </span>
        </div>
      </div>

      {/* Valor da fatura */}
      <span className="font-semibold tabular-nums ml-2 sm:ml-4 text-sm sm:text-base text-muted-foreground">
        {formatCurrency(fatura.amount)}
      </span>
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

import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RecurringDeleteDialog } from '@/components/transactions/RecurringDeleteDialog';
import { RecurringEditDialog } from '@/components/transactions/RecurringEditDialog';
import { LixeiraDialog } from '@/components/transactions/LixeiraDialog';
import { Layout } from '@/components/Layout';
import { useTransactions, useTransactionsWithBalance, useCreateTransaction, useCreateInstallmentTransaction, useUpdateTransaction, useUpdateRecurringTransactions, useDeleteTransaction, useDeleteRecurringTransactions, useMarkAsPaid, useToggleDesconsiderada, useCompleteStats, Transaction, TransactionInsert, TransactionStatus, TipoLancamento } from '@/hooks/useTransactions';
import { useFaturasNaListagem, FaturaVirtual } from '@/hooks/useFaturasNaListagem';
import { Badge } from '@/components/ui/badge';
import { StatCardMinimal } from '@/components/dashboard/StatCardMinimal';
import { TotalAPagarCard } from '@/components/dashboard/TotalAPagarCard';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/lib/formatters';
import { FiltroDataRange } from '@/components/FiltroDataRange';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, TrendingUp, TrendingDown, Calendar, CreditCard, Wallet, RefreshCw, ShoppingCart, Home, Car, Utensils, Briefcase, Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, Book, Package, Zap, DollarSign, Tag, LayoutList, Clock, Check, AlertTriangle, Settings, Copy, Scale, Info, MoreHorizontal, Eye, EyeOff, ChevronDown, ChevronRight, Repeat, Sparkles, X } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  faturas_pagas: {
    key: 'faturas_pagas',
    label: 'Faturas Pagas',
  },
  faturas_pendentes: {
    key: 'faturas_pendentes',
    label: 'Faturas Pendentes',
  },
  fixas: {
    key: 'fixas',
    label: 'Fixas / Recorrentes',
  },
  despesas: {
    key: 'despesas',
    label: 'Despesas',
  },
  despesas_cartao: {
    key: 'despesas_cartao',
    label: 'Despesas no Cartão',
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

function normalizeText(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function isTransacaoFaturaCartao(transaction: Transaction): boolean {
  const nomeCategoria = normalizeText(transaction.category?.name);
  const descricao = normalizeText(transaction.description);

  const categoriaEhFaturaCartao = nomeCategoria.includes('fatura') && nomeCategoria.includes('cart');
  const descricaoEhFatura = descricao.startsWith('fatura ');

  return categoriaEhFaturaCartao || descricaoEhFatura;
}

function isFaturaPaga(item: Transaction | FaturaVirtual): boolean {
  if ('isFaturaCartao' in item) {
    const fatura = item as FaturaVirtual;
    return fatura.paga === true || fatura.statusFatura === 'paga';
  }

  const t = item as Transaction;
  return isTransacaoFaturaCartao(t) && t.status === 'completed';
}

function classificarItem(item: Transaction | FaturaVirtual): string {
  // Faturas (virtuais e lançadas) sempre respeitam status pago x pendente
  if ('isFaturaCartao' in item) {
    return isFaturaPaga(item) ? 'faturas_pagas' : 'faturas_pendentes';
  }

  const t = item as Transaction;

  // Transações com categoria "Fatura de Cartão" → pagas ou pendentes
  if (isTransacaoFaturaCartao(t)) {
    return isFaturaPaga(item) ? 'faturas_pagas' : 'faturas_pendentes';
  }

  // Fixas / recorrentes
  if (t.tipo_lancamento === 'fixa' || t.is_recurring) {
    return t.type === 'income' ? 'receitas_fixas' : 'fixas';
  }

  // Receitas
  if (t.type === 'income') return 'receitas_avulsas';

  // Despesas normais
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

  // Ordem dos grupos: pagas primeiro, depois pendentes, depois o resto
  const ordemGrupos = [
    'faturas_pagas',
    'faturas_pendentes',
    'fixas',
    'despesas',
    'despesas_cartao',
    'receitas_fixas',
    'receitas_avulsas',
    'receitas',
    'despesas_pendentes',
    'receitas_pendentes',
  ];

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
  const [recurringEditTransaction, setRecurringEditTransaction] = useState<Transaction | null>(null);
  const [pendingEditData, setPendingEditData] = useState<Partial<Transaction> | null>(null);
  const [isSuggested, setIsSuggested] = useState(false);
  const [displayLimit, setDisplayLimit] = useState<number>(() => {
    const saved = localStorage.getItem('txn_display_limit');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [showAll, setShowAll] = useState(false);
  // Formatar datas para o hook
  const startDate = dataInicial ? format(dataInicial, 'yyyy-MM-dd') : undefined;
  const endDate = dataFinal ? format(dataFinal, 'yyyy-MM-dd') : undefined;

  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const updateRecurringMutation = useUpdateRecurringTransactions();
  const deleteMutation = useDeleteTransaction();
  const deleteRecurringMutation = useDeleteRecurringTransactions();
  const markAsPaidMutation = useMarkAsPaid();
  const toggleDesconsideradaMutation = useToggleDesconsiderada();

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

  // Remover lançamentos de pagamento de fatura da lista principal
  // (as faturas passam a ser exibidas somente via useFaturasNaListagem)
  const searchedTransactionsSemFatura = useMemo(
    () => searchedTransactions.filter((t) => !isTransacaoFaturaCartao(t)),
    [searchedTransactions]
  );

  // Separar por tipo
  const incomeTransactions = useMemo(() =>
    searchedTransactionsSemFatura.filter(t => t.type === 'income'),
    [searchedTransactionsSemFatura]
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
    const expenses = searchedTransactionsSemFatura.filter(t => t.type === 'expense');
    const combinadas = [...expenses, ...faturasFiltradas] as (Transaction | FaturaVirtual)[];
    return combinadas;
  }, [searchedTransactionsSemFatura, faturasFiltradas]);
  
  const fixedExpenseTransactions = useMemo(() =>
    expenseTransactions.filter(t =>
      !('isFaturaCartao' in t) && FIXED_EXPENSE_CATEGORIES.includes((t as Transaction).category?.name || '')
    ) as Transaction[],
    [expenseTransactions]
  );

  const pendingTransactions = useMemo(() =>
    searchedTransactionsSemFatura.filter(t => t.status === 'pending'),
    [searchedTransactionsSemFatura]
  );

  // Transações ativas baseado na tab
  const activeTransactions = useMemo((): (Transaction | FaturaVirtual)[] => {
    switch (activeTab) {
      case 'income': return incomeTransactions;
      case 'expense': return expenseTransactions;
      case 'pending': return pendingTransactions;
      case 'fixed': return fixedExpenseTransactions;
      default: return [...searchedTransactionsSemFatura, ...faturasFiltradas];
    }
  }, [activeTab, searchedTransactionsSemFatura, incomeTransactions, expenseTransactions, pendingTransactions, fixedExpenseTransactions, faturasFiltradas]);

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

      // For paid faturas, use dataPagamento or date instead of created_at
      const sortDateA = 'isFaturaCartao' in a && (a as FaturaVirtual).paga
        ? new Date((a as FaturaVirtual).dataPagamento || a.date).getTime()
        : new Date(a.created_at).getTime();
      const sortDateB = 'isFaturaCartao' in b && (b as FaturaVirtual).paga
        ? new Date((b as FaturaVirtual).dataPagamento || b.date).getTime()
        : new Date(b.created_at).getTime();

      return sortDateB - sortDateA;
    });
  }, [activeTransactions]);

  // Reset showAll when filters change
  useEffect(() => {
    setShowAll(false);
  }, [activeTab, searchQuery, dataInicial, dataFinal]);

  const totalTransactions = sortedTransactions.length;

  // Apply display limit
  const displayedTransactions = useMemo(() => {
    if (showAll || totalTransactions <= displayLimit) return sortedTransactions;
    return sortedTransactions.slice(0, displayLimit);
  }, [sortedTransactions, showAll, displayLimit, totalTransactions]);

  // Tabs que usam agrupamento
  const useGrouping = activeTab === 'all' || activeTab === 'expense' || activeTab === 'income' || activeTab === 'pending';

  const grupos = useMemo(() => {
    if (!useGrouping) return [];
    return agruparTransacoes(displayedTransactions, activeTab);
  }, [displayedTransactions, activeTab, useGrouping]);

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
      const isRecurring = formData.tipoLancamento === 'fixa' || formData.tipoLancamento === 'parcelada' || formData.is_recurring;
      if (isRecurring) {
        // Find the original transaction to pass to the dialog
        const originalTxn = transactions?.find(t => t.id === editingId);
        if (originalTxn) {
          setPendingEditData({ id: editingId, ...data });
          setRecurringEditTransaction(originalTxn);
          setDialogOpen(false);
          return;
        }
      }
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
      if (window.confirm('Mover este registro para a lixeira?')) {
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
      count: searchedTransactionsSemFatura.length + faturasFiltradas.length,
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
            <LixeiraDialog />
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
              <DialogContent
                noPadding
                className={cn(
                  "gap-0 border-0 [&>button]:hidden flex flex-col rounded-2xl",
                  isMobile
                    ? "!w-auto max-w-none fixed !translate-x-0 !translate-y-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:duration-300 data-[state=closed]:duration-200"
                    : "w-[calc(100%-2rem)] max-w-[460px]"
                )}
                style={isMobile
                  ? {
                      borderRadius: 16,
                      left: "max(1.25rem, env(safe-area-inset-left))",
                      right: "max(1.25rem, env(safe-area-inset-right))",
                      top: "1rem",
                      bottom: "1rem",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    }
                  : {
                      borderRadius: 16,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      maxWidth: 460,
                      maxHeight: "90dvh",
                    }
                }
              >
                {/* Drag handle - mobile only */}
                {isMobile && (
                  <div className="flex justify-center pt-2 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                )}

                {/* Sticky Header */}
                <div className={cn(
                  "flex items-center justify-between shrink-0 bg-white z-10",
                  isMobile ? "sticky top-0 px-5 pt-2 pb-2 rounded-t-2xl" : "px-6 pt-6 pb-0"
                )}>
                  <h2 style={{ color: "#111827", fontWeight: 700, fontSize: 16 }}>
                    {editingId ? 'Editar Registro' : 'Novo Registro'}
                  </h2>
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="transition-colors"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#9CA3AF" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <X style={{ width: 18, height: 18 }} />
                    </button>
                  </DialogClose>
                </div>

                {/* Scrollable form content */}
                <div className={cn(
                  "flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col",
                  isMobile ? "px-5 pt-2 pb-2 gap-3" : "px-6 pt-4 pb-5 gap-3"
                )}>
                  {/* Receita / Despesa underline tabs */}
                  <div className="flex" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    {[
                      { value: 'income' as const, label: 'Receita' },
                      { value: 'expense' as const, label: 'Despesa' },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: tab.value, category_id: '' })}
                        className="flex-1 transition-all"
                        style={{
                          padding: "8px 0",
                          fontSize: 13,
                          fontWeight: formData.type === tab.value ? 600 : 400,
                          color: formData.type === tab.value ? "#111827" : "#6B7280",
                          background: "none",
                          border: "none",
                          borderBottom: formData.type === tab.value ? "2px solid #111827" : "2px solid transparent",
                          cursor: "pointer",
                          transition: "all 150ms",
                          minHeight: isMobile ? 48 : undefined,
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Botão cartão de crédito */}
                  {formData.type === 'expense' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDialogOpen(false);
                        setCartaoDialogOpen(true);
                      }}
                      className="w-full flex items-center gap-2 transition-colors"
                      style={{
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        background: "#fff",
                        padding: isMobile ? "8px 12px" : "10px 12px",
                        fontSize: 13,
                        color: "#6B7280",
                        cursor: "pointer",
                        textAlign: "left",
                        minHeight: isMobile ? 48 : undefined,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      <CreditCard style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                      Ou registrar no cartão de crédito
                    </button>
                  )}

                  {/* Valor */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>
                      Valor (R$) <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full"
                      style={{
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        padding: isMobile ? "8px 12px" : "10px 12px",
                        fontSize: 14,
                        color: "#111827",
                        background: "#fff",
                        outline: "none",
                        minHeight: isMobile ? 48 : undefined,
                      }}
                      onFocus={(e) => { e.currentTarget.style.border = "1.5px solid #111827"; }}
                      onBlur={(e) => { e.currentTarget.style.border = "1px solid #E5E7EB"; }}
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>
                      Descrição
                    </label>
                    <textarea
                      placeholder="Ex: Almoço no restaurante, Uber para o trabalho..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full"
                      style={{
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        padding: isMobile ? "8px 12px" : "10px 12px",
                        fontSize: 14,
                        color: "#111827",
                        background: "#fff",
                        outline: "none",
                        minHeight: 80,
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                      onFocus={(e) => { e.currentTarget.style.border = "1.5px solid #111827"; }}
                      onBlur={(e) => { e.currentTarget.style.border = "1px solid #E5E7EB"; }}
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Categoria</label>
                      {isSuggested && formData.category_id && (
                        <span style={{ fontSize: 10, color: "#3B82F6", background: "#EFF6FF", padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>
                          ✦ Sugestão automática
                        </span>
                      )}
                    </div>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(v) => {
                        setFormData({ ...formData, category_id: v });
                        setIsSuggested(false);
                      }}
                    >
                      <SelectTrigger className={cn(
                        "border-[#E5E7EB] rounded-lg text-sm focus:ring-0 focus:border-[#111827]",
                        isMobile ? "h-12 px-3" : "h-[42px]"
                      )}>
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
                      <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
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
                    autoSelectDefault
                  />

                  {/* Data */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Data</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between transition-all"
                          style={{
                            border: "1px solid #E5E7EB",
                            borderRadius: 8,
                            padding: isMobile ? "8px 12px" : "10px 12px",
                            fontSize: 14,
                            color: "#111827",
                            background: "#fff",
                            cursor: "pointer",
                            minHeight: isMobile ? 48 : undefined,
                          }}
                          onFocus={(e) => { e.currentTarget.style.border = "1.5px solid #111827"; }}
                          onBlur={(e) => { e.currentTarget.style.border = "1px solid #E5E7EB"; }}
                        >
                          <span>{format(formData.date, "dd/MM/yyyy", { locale: ptBR })}</span>
                          <Calendar style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                        </button>
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

                  {/* Tipo de Lançamento - underline tabs */}
                  {formData.type === 'expense' && !editingId && (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Tipo de lançamento</label>
                        <div className="flex" style={{ borderBottom: "1px solid #F3F4F6" }}>
                          {[
                            { value: 'unica' as const, label: 'Única' },
                            { value: 'parcelada' as const, label: 'Parcelada' },
                            { value: 'fixa' as const, label: 'Fixa' },
                          ].map((tab) => (
                            <button
                              key={tab.value}
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                tipoLancamento: tab.value,
                                is_recurring: tab.value === 'fixa',
                              })}
                              className="flex-1 transition-all"
                              style={{
                                padding: "8px 0",
                                fontSize: 13,
                                fontWeight: formData.tipoLancamento === tab.value ? 600 : 400,
                                color: formData.tipoLancamento === tab.value ? "#111827" : "#6B7280",
                                background: "none",
                                border: "none",
                                borderBottom: formData.tipoLancamento === tab.value ? "2px solid #111827" : "2px solid transparent",
                                cursor: "pointer",
                                transition: "all 150ms",
                                minHeight: isMobile ? 48 : undefined,
                              }}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Parcelas */}
                      {formData.tipoLancamento === 'parcelada' && (
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Número de parcelas</label>
                          <Select 
                            value={formData.totalParcelas.toString()} 
                            onValueChange={(v) => setFormData({ ...formData, totalParcelas: parseInt(v) })}
                          >
                            <SelectTrigger className={cn(
                              "border-[#E5E7EB] rounded-lg text-sm focus:ring-0 focus:border-[#111827]",
                              isMobile ? "h-12 px-3" : "h-[42px]"
                            )}>
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

                      {/* Meses - Fixa */}
                      {formData.tipoLancamento === 'fixa' && (
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Quantos meses?</label>
                          <Select 
                            value={formData.totalParcelas.toString()} 
                            onValueChange={(v) => setFormData({ ...formData, totalParcelas: parseInt(v) })}
                          >
                            <SelectTrigger className={cn(
                              "border-[#E5E7EB] rounded-lg text-sm focus:ring-0 focus:border-[#111827]",
                              isMobile ? "h-12 px-3" : "h-[42px]"
                            )}>
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

                      {/* Resumo */}
                      {formData.tipoLancamento !== 'unica' && formData.amount && (
                        <div style={{ background: "#F9FAFB", borderRadius: 8, border: "1px solid #F3F4F6", padding: "10px 14px" }}>
                          <p style={{ fontSize: 13, color: "#6B7280" }}>
                            {formData.tipoLancamento === 'parcelada' ? (
                              <>
                                {formData.totalParcelas}x de{' '}
                                <strong style={{ color: "#111827" }}>{formatCurrency(parseFloat(formData.amount) / formData.totalParcelas)}</strong>
                              </>
                            ) : (
                              <>
                                <strong style={{ color: "#111827" }}>{formatCurrency(parseFloat(formData.amount))}</strong>/mês
                              </>
                            )}
                          </p>
                          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                            {formData.tipoLancamento === 'parcelada' 
                              ? `Serão criadas ${formData.totalParcelas} transações pendentes`
                              : `Serão criadas ${formData.totalParcelas} transações mensais pendentes`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status feedback */}
                  {(() => {
                    const today = startOfDay(new Date());
                    const transactionDate = startOfDay(formData.date);
                    const isFutureDate = transactionDate > today;
                    
                    if (formData.tipoLancamento !== 'unica' && formData.type === 'expense') return null;
                    
                    if (isFutureDate) {
                      return (
                        <div className="flex items-center gap-2" style={{ background: "#F9FAFB", borderRadius: 8, border: "1px solid #F3F4F6", padding: "10px 14px" }}>
                          <Clock style={{ width: 16, height: 16, color: "#D97706" }} />
                          <span style={{ fontSize: 13, color: "#6B7280" }}>Será registrada como <strong style={{ color: "#111827" }}>pendente</strong> (data futura)</span>
                        </div>
                      );
                    }
                    
                    if (formData.is_recurring && formData.tipoLancamento === 'unica') {
                      return (
                        <div className="flex items-center gap-2" style={{ background: "#F9FAFB", borderRadius: 8, border: "1px solid #F3F4F6", padding: "10px 14px" }}>
                          <RefreshCw style={{ width: 16, height: 16, color: "#6B7280" }} />
                          <span style={{ fontSize: 13, color: "#6B7280" }}>Transação recorrente - sempre inicia como <strong style={{ color: "#111827" }}>pendente</strong></span>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}

                  {/* Recurring toggle */}
                  {(formData.type === 'income' || formData.tipoLancamento === 'unica') && (
                    <div
                      className="flex items-center justify-between"
                      style={{ padding: "10px 0", minHeight: isMobile ? 48 : undefined }}
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                        <label htmlFor="recurring-toggle" style={{ fontSize: 13, fontWeight: 400, color: "#374151", cursor: "pointer" }}>
                          É uma transação recorrente?
                        </label>
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

                  {/* Recurrence Day */}
                  {formData.is_recurring && formData.tipoLancamento !== 'fixa' && (
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Dia do mês</label>
                      <Select 
                        value={formData.recurrence_day.toString()} 
                        onValueChange={(v) => setFormData({ ...formData, recurrence_day: parseInt(v) })}
                      >
                        <SelectTrigger className={cn(
                          "border-[#E5E7EB] rounded-lg text-sm focus:ring-0 focus:border-[#111827]",
                          isMobile ? "h-12 px-3" : "h-[42px]"
                        )}>
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

                  {/* Meses recorrentes */}
                  {formData.is_recurring && formData.tipoLancamento === 'unica' && (
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Quantos meses?</label>
                      <Select 
                        value={formData.totalParcelas.toString()} 
                        onValueChange={(v) => setFormData({ ...formData, totalParcelas: parseInt(v) })}
                      >
                        <SelectTrigger className={cn(
                          "border-[#E5E7EB] rounded-lg text-sm focus:ring-0 focus:border-[#111827]",
                          isMobile ? "h-12 px-3" : "h-[42px]"
                        )}>
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

                  {/* Small spacer for sticky footer on mobile */}
                  {isMobile && <div className="h-2 shrink-0" />}
                </div>

                {/* Sticky Footer - Submit button */}
                <div className={cn(
                  "shrink-0 bg-white border-t border-border/50",
                  isMobile ? "sticky bottom-0 px-5 pt-2 z-10 rounded-b-2xl" : "px-6 pt-3 pb-5"
                )}
                  style={isMobile ? { paddingBottom: "max(12px, env(safe-area-inset-bottom))" } : undefined}
                >
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!formData.amount || createMutation.isPending || updateMutation.isPending}
                    className="w-full flex items-center justify-center transition-colors disabled:opacity-50"
                    style={{
                      height: "48px",
                      minHeight: "48px",
                      borderRadius: "8px",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#fff",
                      background: "#111827",
                      border: "none",
                      cursor: !formData.amount ? "not-allowed" : "pointer",
                      lineHeight: "1",
                      padding: "0 16px",
                    }}
                    onMouseEnter={(e) => { if (formData.amount) e.currentTarget.style.background = "#1F2937"; }}
                    onMouseLeave={(e) => { if (formData.amount) e.currentTarget.style.background = "#111827"; }}
                  >
                    {editingId ? 'Salvar' : 'Criar'}
                  </button>
                </div>
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
        <AnimatedSection className="space-y-4">
          {/* Card de Saldo Inicial e Metas */}
          <div className="flex items-center justify-between p-3 sm:p-3 gap-2 bg-muted/30 rounded-lg border border-border/50 mt-1">
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
                <div className="flex flex-col items-end">
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
              value={stats?.completedExpenseWithFatura || 0}
              icon={TrendingDown}
              subInfo="total do mês (inclui fatura)"
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
            <TotalAPagarCard mesReferencia={dataInicial || new Date()} isLoading={isStatsFetching} />
            <StatCardMinimal
              title="Saldo Real"
              value={stats?.realBalance || 0}
              icon={Scale}
              subInfo="clique para ajustar"
              onClick={() => setAjustarSaldoOpen(true)}
              delay={0.2}
              isLoading={isStatsFetching}
              className="col-span-2 lg:col-span-1"
            />
            <StatCardMinimal
              title="Estimado"
              value={stats?.estimatedBalance || 0}
              icon={Info}
              subInfo={
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {formatCurrency(
                      (stats?.completedIncome || 0) + (stats?.pendingIncome || 0)
                      - (stats?.completedExpenseWithFatura || 0) - (stats?.pendingExpense || 0)
                      - (stats?.faturaCartao || 0)
                    )}{" "}
                    <span className="text-muted-foreground/60">referente apenas a este mês</span>
                  </span>
                  <span>real + a receber - a pagar</span>
                </div>
              }
              delay={0.25}
              isLoading={isStatsFetching}
              className="col-span-2 lg:col-span-1"
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
              isLoading={isStatsFetching || isAssinaturasLoading}
              valueColor="expense"
              className="col-span-2 lg:col-span-1"
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
        <div className="flex flex-col gap-3 border-b pb-3">
          {/* Line 1: Filter tabs */}
          <div className="flex overflow-x-auto gap-1 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
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
          
          {/* Line 2: Search + limit dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="pl-9 h-9 w-full" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={String(displayLimit)}
              onValueChange={(val) => {
                const limit = parseInt(val, 10);
                setDisplayLimit(limit);
                setShowAll(false);
                localStorage.setItem('txn_display_limit', val);
              }}
            >
              <SelectTrigger className="h-9 w-[130px] shrink-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Últimas 5</SelectItem>
                <SelectItem value="10">Últimas 10</SelectItem>
                <SelectItem value="15">Últimas 15</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="space-y-2">
          {isLoading ? (
            <LoadingList />
          ) : displayedTransactions.length === 0 ? (
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
              const displayItems = grupo.key === 'faturas_pendentes'
                ? grupo.items.filter(item => !isFaturaPaga(item))
                : grupo.items;
              
              if (grupo.key === 'faturas_pendentes' && displayItems.length === 0) {
                return null;
              }

              return (
                <AnimatedItem key={grupo.key} index={grupoIdx} className="mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <GroupHeader grupo={{...grupo, items: displayItems}} collapsed={isCollapsed} onToggle={() => toggleGroup(grupo.key)} />
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="divide-y divide-border/30">
                      {displayItems.map((item, itemIdx) => (
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
                              onToggleDesconsiderada={(id, desc) => toggleDesconsideradaMutation.mutate({ id, desconsiderada: desc })}
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
            displayedTransactions.map((item, itemIdx) => (
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
                    onToggleDesconsiderada={(id, desc) => toggleDesconsideradaMutation.mutate({ id, desconsiderada: desc })}
                    saldoApos={saldoMap?.get(item.id)}
                    isUltimaTransacao={item.id === ultimaTransacaoId}
                    totalGuardado={totalGuardado}
                  />
                )}
              </AnimatedItem>
            ))
          )}

          {/* Botão Ver todas / Ver menos */}
          {totalTransactions > displayLimit && (
            <div className="flex justify-center pt-2 pb-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-sm"
                onClick={() => setShowAll(prev => !prev)}
              >
                {showAll
                  ? 'Ver menos'
                  : `Ver todas as transações (${totalTransactions})`}
              </Button>
            </div>
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
  onToggleDesconsiderada: (id: string, desconsiderada: boolean) => void;
  saldoApos?: number;
  isUltimaTransacao?: boolean;
  totalGuardado?: number;
}

function TransactionRow({ transaction, onEdit, onDelete, onMarkAsPaid, onDuplicate, onView, onToggleDesconsiderada, saldoApos, isUltimaTransacao, totalGuardado = 0 }: TransactionRowProps) {
  const isFaturaCartaoPaga = transaction.category?.name === 'Fatura de Cartão' || transaction.category?.name === 'Fatura do Cartão' || transaction.description?.startsWith('Fatura ');
  const IconComponent = isFaturaCartaoPaga ? CreditCard : getIconComponent(transaction.category?.icon || 'package');
  const isPending = transaction.status === 'pending';
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = isPending && transaction.due_date && transaction.due_date < today;
  
  return (
    <div className={cn("group flex items-center py-2 sm:py-3 px-2 sm:px-4 hover:bg-muted/50 rounded-lg transition-colors", transaction.desconsiderada && "opacity-50")}>
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
          {/* Badge de Desconsiderada */}
          {transaction.desconsiderada && (
            <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 bg-muted text-muted-foreground flex items-center gap-0.5">
              <EyeOff className="w-3 h-3" />
              <span className="hidden sm:inline">Desconsiderada</span>
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
          {/* Saldo da conta antes da transação - esconder em mobile */}
          {saldoApos !== undefined && transaction.status === 'completed' && (
            <span className="hidden sm:contents">
              <span className="text-muted-foreground/50">•</span>
              <span className={cn(
                "text-xs font-medium",
                saldoApos >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                Saldo: {formatCurrency(saldoApos)}
              </span>
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
              {transaction.type === 'expense' && (
                <DropdownMenuItem onClick={() => onToggleDesconsiderada(transaction.id, !transaction.desconsiderada)}>
                  <EyeOff className="w-4 h-4 mr-2" />
                  {transaction.desconsiderada ? 'Reconsiderar no saldo' : 'Desconsiderar do saldo'}
                </DropdownMenuItem>
              )}
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
          {transaction.type === 'expense' && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => onToggleDesconsiderada(transaction.id, !transaction.desconsiderada)}
              title={transaction.desconsiderada ? 'Reconsiderar no saldo' : 'Desconsiderar do saldo'}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </Button>
          )}
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
    paga: { label: 'Paga', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  };

  const status = statusConfig[fatura.statusFatura];
  const isPaga = fatura.statusFatura === 'paga';

  return (
    <div 
      className={cn(
        "group flex items-center py-2 sm:py-3 px-2 sm:px-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer",
        isPaga && "opacity-70"
      )}
      onClick={onClick}
    >
      {/* Ícone de cartão */}
      <div className={cn(
        "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shrink-0",
        isPaga ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-violet-100 dark:bg-violet-900/30"
      )}>
        {isPaga ? (
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
        ) : (
          <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" />
        )}
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
          <span>
            {isPaga ? 'Paga em' : 'Vence'} {format(parseISO(isPaga ? (fatura.dataPagamento || fatura.due_date) : fatura.due_date), "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span style={{ color: fatura.cartaoCor }}>
            {fatura.cartaoNome}
          </span>
        </div>
      </div>

      {/* Valor da fatura */}
      <span className={cn(
        "font-semibold tabular-nums ml-2 sm:ml-4 text-sm sm:text-base",
        isPaga ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
      )}>
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

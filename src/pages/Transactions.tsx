import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, Transaction, TransactionInsert } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, TrendingUp, TrendingDown, Calendar, CreditCard, Wallet, RefreshCw, ShoppingCart, Home, Car, Utensils, Briefcase, Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, Book, Package, Zap, DollarSign, Tag, LayoutList } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Dialog para nova compra no cartão (importar se existir)
// import { NovaCompraCartaoDialog } from '@/components/cartoes/NovaCompraCartaoDialog';

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  category_id: string;
  description: string;
  date: Date;
}

const initialFormData: TransactionFormData = {
  type: 'expense',
  amount: '',
  category_id: '',
  description: '',
  date: new Date(),
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

export default function Transactions() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filters, setFilters] = useState<{ type?: 'income' | 'expense'; search: string }>({ search: '' });
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cartaoDialogOpen, setCartaoDialogOpen] = useState(false);

  const { data: transactions, isLoading } = useTransactions({ type: filters.type });
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  // Filtrar transações
  const filteredTransactions = transactions?.filter((t) =>
    t.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
    t.category?.name?.toLowerCase().includes(filters.search.toLowerCase())
  );

  // Separar por tipo
  const incomeTransactions = filteredTransactions?.filter(t => t.type === 'income') || [];
  const expenseTransactions = filteredTransactions?.filter(t => t.type === 'expense') || [];
  const fixedExpenseTransactions = expenseTransactions.filter(t => 
    FIXED_EXPENSE_CATEGORIES.includes(t.category?.name || '')
  );

  // Filtrar categorias pelo tipo selecionado
  const filteredCategories = categories?.filter((c) => c.type === formData.type) || [];

  // Totais
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const handleSubmit = () => {
    const data: TransactionInsert = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id || undefined,
      description: formData.description || undefined,
      date: format(formData.date, 'yyyy-MM-dd'),
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
    });
    setEditingId(transaction.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Componente de lista de transações
  const TransactionList = ({ items, emptyMessage }: { items: Transaction[], emptyMessage: string }) => {
    if (items.length === 0) {
      return (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((transaction, index) => (
          <Card 
            key={transaction.id} 
            className="border-0 shadow-lg animate-slide-up hover:shadow-xl transition-shadow"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {(() => {
                    const IconComponent = getIconComponent(transaction.category?.icon || 'package');
                    return (
                      <div 
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          transaction.type === 'income' ? 'gradient-income' : 'gradient-expense'
                        )}
                      >
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {transaction.description || transaction.category?.name || 'Sem descrição'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category?.name || 'Sem categoria'} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "font-bold text-lg",
                    transaction.type === 'income' ? 'text-income' : 'text-expense'
                  )}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
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
                          <AlertDialogAction onClick={() => handleDelete(transaction.id)} className="bg-destructive text-destructive-foreground">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <h1 className="text-2xl font-bold text-foreground">Registros Financeiros</h1>
            <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
          </div>

          <div className="flex gap-2">
            {/* Botão Despesa no Cartão */}
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setCartaoDialogOpen(true)}
            >
              <CreditCard className="w-4 h-4" />
              Despesa no Cartão
            </Button>

            {/* Dialog de Nova Transação */}
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Registro
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

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Receitas</p>
                  <p className="text-2xl font-bold text-income">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl gradient-income flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500/10 to-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Despesas</p>
                  <p className="text-2xl font-bold text-expense">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl gradient-expense flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    totalIncome - totalExpense >= 0 ? "text-income" : "text-expense"
                  )}>
                    {formatCurrency(totalIncome - totalExpense)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou categoria..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para separar Receitas e Despesas */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="gap-2">
              <LayoutList className="w-4 h-4" />
              Todos
              <Badge variant="secondary" className="ml-1">
                {filteredTransactions?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-2 data-[state=active]:text-emerald-600 data-[state=active]:border-emerald-500">
              <TrendingUp className="w-4 h-4" />
              Receitas
              <Badge variant="secondary" className="ml-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {incomeTransactions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="expense" className="gap-2 data-[state=active]:text-red-600 data-[state=active]:border-red-500">
              <TrendingDown className="w-4 h-4" />
              Despesas
              <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {expenseTransactions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="fixed" className="gap-2 data-[state=active]:text-orange-600 data-[state=active]:border-orange-500">
              <RefreshCw className="w-4 h-4" />
              Fixas
              <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                {fixedExpenseTransactions.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <LoadingList />
            ) : (
              <TransactionList 
                items={filteredTransactions || []} 
                emptyMessage="Nenhum registro encontrado" 
              />
            )}
          </TabsContent>

          <TabsContent value="income" className="mt-4">
            {isLoading ? (
              <LoadingList />
            ) : (
              <TransactionList 
                items={incomeTransactions} 
                emptyMessage="Nenhuma receita registrada" 
              />
            )}
          </TabsContent>

          <TabsContent value="expense" className="mt-4">
            {isLoading ? (
              <LoadingList />
            ) : (
              <TransactionList 
                items={expenseTransactions} 
                emptyMessage="Nenhuma despesa registrada" 
              />
            )}
          </TabsContent>

          <TabsContent value="fixed" className="mt-4">
            {isLoading ? (
              <LoadingList />
            ) : (
              <TransactionList 
                items={fixedExpenseTransactions} 
                emptyMessage="Nenhuma despesa fixa registrada" 
              />
            )}
          </TabsContent>
        </Tabs>

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

// Componente de loading
function LoadingList() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="border-0 shadow-lg animate-pulse">
          <CardContent className="p-4">
            <div className="h-16 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

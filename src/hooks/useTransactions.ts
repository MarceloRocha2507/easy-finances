import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Category } from './useCategories';

export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export type TipoLancamento = 'unica' | 'parcelada' | 'fixa';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  status: TransactionStatus;
  due_date: string | null;
  paid_date: string | null;
  is_recurring: boolean;
  recurrence_day: number | null;
  tipo_lancamento: TipoLancamento | null;
  total_parcelas: number | null;
  numero_parcela: number | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface TransactionInsert {
  type: 'income' | 'expense';
  amount: number;
  category_id?: string;
  description?: string;
  date?: string;
  status?: TransactionStatus;
  due_date?: string;
  paid_date?: string;
  is_recurring?: boolean;
  recurrence_day?: number;
  tipo_lancamento?: TipoLancamento;
  total_parcelas?: number;
  numero_parcela?: number;
  parent_id?: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  categoryId?: string;
  status?: TransactionStatus;
}

export function useTransactions(filters?: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useTransactionStats(filters?: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transaction-stats', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('type, amount');

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      };

      data?.forEach((t) => {
        if (t.type === 'income') {
          stats.totalIncome += Number(t.amount);
        } else {
          stats.totalExpense += Number(t.amount);
        }
      });

      stats.balance = stats.totalIncome - stats.totalExpense;

      return stats;
    },
    enabled: !!user,
  });
}

export function useExpensesByCategory(filters?: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses-by-category', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          amount,
          category:categories(id, name, icon, color)
        `)
        .eq('type', 'expense');

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const categoryMap = new Map<string, { name: string; icon: string; color: string; total: number }>();

      data?.forEach((t) => {
        const cat = t.category as unknown as { id: string; name: string; icon: string; color: string } | null;
        const categoryId = cat?.id || 'uncategorized';
        const categoryName = cat?.name || 'Sem categoria';
        const categoryIcon = cat?.icon || '📦';
        const categoryColor = cat?.color || '#6366f1';

        if (categoryMap.has(categoryId)) {
          categoryMap.get(categoryId)!.total += Number(t.amount);
        } else {
          categoryMap.set(categoryId, {
            name: categoryName,
            icon: categoryIcon,
            color: categoryColor,
            total: Number(t.amount),
          });
        }
      });

      return Array.from(categoryMap.entries()).map(([id, data]) => ({
        id,
        ...data,
      }));
    },
    enabled: !!user,
  });
}

export function useMonthlyData(year: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthly-data', user?.id, year],
    queryFn: async () => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(year, i).toLocaleString('pt-BR', { month: 'short' }),
        income: 0,
        expense: 0,
      }));

      data?.forEach((t) => {
        const month = new Date(t.date).getMonth();
        if (t.type === 'income') {
          monthlyData[month].income += Number(t.amount);
        } else {
          monthlyData[month].expense += Number(t.amount);
        }
      });

      return monthlyData;
    },
    enabled: !!user,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      toast({
        title: 'Registro criado',
        description: 'O registro financeiro foi criado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o registro.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para criar transações parceladas
export function useCreateInstallmentTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      baseTransaction: TransactionInsert;
      totalParcelas: number;
      tipoLancamento: TipoLancamento;
    }) => {
      const { baseTransaction, totalParcelas, tipoLancamento } = params;
      const userId = user!.id;

      if (tipoLancamento === 'unica') {
        // Transação única - comportamento padrão
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            ...baseTransaction,
            user_id: userId,
            tipo_lancamento: 'unica',
            total_parcelas: 1,
            numero_parcela: 1,
          })
          .select()
          .single();

        if (error) throw error;
        return [data];
      }

      // Parcelada ou Fixa - criar múltiplas transações
      const parcelas = tipoLancamento === 'fixa' ? 12 : totalParcelas;
      const valorParcela = baseTransaction.amount! / (tipoLancamento === 'parcelada' ? parcelas : 1);
      const baseDate = baseTransaction.date ? new Date(baseTransaction.date) : new Date();

      // Criar transação pai primeiro
      const { data: parentTransaction, error: parentError } = await supabase
        .from('transactions')
        .insert({
          ...baseTransaction,
          user_id: userId,
          tipo_lancamento: tipoLancamento,
          total_parcelas: parcelas,
          numero_parcela: 1,
          amount: valorParcela,
          description: tipoLancamento === 'parcelada' 
            ? `${baseTransaction.description || 'Parcela'} (1/${parcelas})`
            : baseTransaction.description,
          is_recurring: tipoLancamento === 'fixa',
        })
        .select()
        .single();

      if (parentError) throw parentError;

      // Criar parcelas restantes
      const parcelasToInsert = [];
      for (let i = 2; i <= parcelas; i++) {
        const parcelaDate = new Date(baseDate);
        parcelaDate.setMonth(parcelaDate.getMonth() + (i - 1));
        
        parcelasToInsert.push({
          ...baseTransaction,
          user_id: userId,
          tipo_lancamento: tipoLancamento,
          total_parcelas: parcelas,
          numero_parcela: i,
          parent_id: parentTransaction.id,
          amount: valorParcela,
          date: parcelaDate.toISOString().split('T')[0],
          due_date: parcelaDate.toISOString().split('T')[0],
          status: 'pending' as TransactionStatus,
          paid_date: null,
          description: tipoLancamento === 'parcelada'
            ? `${baseTransaction.description || 'Parcela'} (${i}/${parcelas})`
            : baseTransaction.description,
          is_recurring: tipoLancamento === 'fixa',
        });
      }

      if (parcelasToInsert.length > 0) {
        const { error: parcelasError } = await supabase
          .from('transactions')
          .insert(parcelasToInsert);

        if (parcelasError) throw parcelasError;
      }

      return [parentTransaction];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      
      const msg = variables.tipoLancamento === 'parcelada'
        ? `${variables.totalParcelas} parcelas foram criadas.`
        : variables.tipoLancamento === 'fixa'
        ? '12 lançamentos futuros foram criados.'
        : 'O registro financeiro foi criado com sucesso.';
        
      toast({
        title: 'Registro criado',
        description: msg,
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o registro.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      toast({
        title: 'Registro atualizado',
        description: 'O registro financeiro foi atualizado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o registro.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      toast({
        title: 'Registro removido',
        description: 'O registro financeiro foi removido com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o registro.',
        variant: 'destructive',
      });
    },
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          paid_date: today
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      toast({
        title: 'Marcado como pago',
        description: 'A transação foi marcada como realizada.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a transação.',
        variant: 'destructive',
      });
    },
  });
}

export function usePendingStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, due_date')
        .eq('status', 'pending');

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      
      const stats = {
        totalPendingIncome: 0,
        totalPendingExpense: 0,
        overdueCount: 0,
        pendingCount: data?.length || 0,
      };

      data?.forEach((t) => {
        if (t.type === 'income') {
          stats.totalPendingIncome += Number(t.amount);
        } else {
          stats.totalPendingExpense += Number(t.amount);
        }
        if (t.due_date && t.due_date < today) {
          stats.overdueCount++;
        }
      });

      return stats;
    },
    enabled: !!user,
  });
}

export function useCompleteStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['complete-stats', user?.id],
    queryFn: async () => {
      // Buscar saldo inicial do profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('saldo_inicial')
        .eq('user_id', user!.id)
        .single();

      const saldoInicial = Number(profile?.saldo_inicial) || 0;

      // Buscar transações
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, status, due_date');

      if (error) throw error;

      // Buscar fatura do cartão do mês atual (apenas titular)
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: parcelasCartao } = await supabase
        .from('parcelas_cartao')
        .select(`
          valor,
          ativo,
          paga,
          compra:compras_cartao(responsavel:responsaveis(is_titular))
        `)
        .gte('mes_referencia', inicioMes)
        .lte('mes_referencia', fimMes)
        .eq('ativo', true);

      // Calcular total da fatura do titular (apenas parcelas não pagas)
      let faturaCartaoTitular = 0;
      (parcelasCartao || []).forEach((p: any) => {
        const isTitular = p.compra?.responsavel?.is_titular === true;
        const isPaga = p.paga === true;
        if (isTitular && !isPaga) {
          faturaCartaoTitular += Number(p.valor) || 0;
        }
      });

      const today = new Date().toISOString().split('T')[0];
      
      const stats = {
        saldoInicial,
        completedIncome: 0,
        completedExpense: 0,
        pendingIncome: 0,
        pendingExpense: 0,
        overdueCount: 0,
        pendingCount: 0,
        faturaCartao: faturaCartaoTitular,
      };

      data?.forEach((t) => {
        const amount = Number(t.amount);
        
        if (t.status === 'completed') {
          if (t.type === 'income') stats.completedIncome += amount;
          else stats.completedExpense += amount;
        } else if (t.status === 'pending') {
          stats.pendingCount++;
          if (t.type === 'income') stats.pendingIncome += amount;
          else stats.pendingExpense += amount;
          if (t.due_date && t.due_date < today) stats.overdueCount++;
        }
      });

      // Saldo Real = Saldo Inicial + Receitas Recebidas - Despesas Pagas
      const realBalance = saldoInicial + stats.completedIncome - stats.completedExpense;
      // Saldo Estimado = Saldo Real + A Receber - A Pagar - Fatura do Cartão
      const estimatedBalance = realBalance + stats.pendingIncome - stats.pendingExpense - faturaCartaoTitular;

      return {
        ...stats,
        realBalance,
        estimatedBalance,
      };
    },
    enabled: !!user,
  });
}
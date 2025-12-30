import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Category } from './useCategories';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
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
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  categoryId?: string;
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
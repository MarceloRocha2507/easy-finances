import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Category } from './useCategories';
import { findMatchingCategory } from '@/services/category-rules';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { parseISO } from 'date-fns';

// Helper to send Telegram notification after transaction creation
async function enviarNotificacaoTelegram(params: {
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description?: string | null;
  categoryName?: string | null;
  date?: string;
}) {
  try {
    const { userId, type, amount, description, categoryName, date } = params;
    const isExpense = type === 'expense';
    const emoji = isExpense ? '💸' : '💰';
    const titulo = isExpense ? 'Nova Despesa Registrada' : 'Nova Receita Registrada';
    const tipoAlerta = isExpense ? 'transacao_nova_despesa' : 'transacao_nova_receita';

    const linhas = [
      `${emoji} *${titulo}*`,
      '',
      `📝 Descrição: ${description || 'Sem descrição'}`,
      `💵 Valor: ${formatCurrency(amount)}`,
      `📂 Categoria: ${categoryName || 'Sem categoria'}`,
      `📅 Data: ${formatDate(date || new Date().toISOString())}`,
    ];

    await supabase.functions.invoke('telegram-send', {
      body: {
        user_id: userId,
        alertas: [{
          tipo_alerta: tipoAlerta,
          tipo: 'info',
          mensagem: linhas.join('\n'),
        }],
      },
    });
  } catch (e) {
    console.error('Erro ao enviar notificação Telegram:', e);
  }
}

// Helper: batch invalidation for all transaction-related caches
function invalidateTransactionCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
  queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
  queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
  queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
  queryClient.invalidateQueries({ queryKey: ['bancos-resumo'] });
  queryClient.invalidateQueries({ queryKey: ['deleted-transactions'] });

  queryClient.invalidateQueries({ queryKey: ['complete-stats'], refetchType: 'active' });
  queryClient.invalidateQueries({ queryKey: ['dashboard-completo'], refetchType: 'active' });
}

export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export type TipoLancamento = 'unica' | 'parcelada' | 'fixa';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  banco_id: string | null;
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
  desconsiderada: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface TransactionInsert {
  type: 'income' | 'expense';
  amount: number;
  category_id?: string;
  banco_id?: string | null;
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
        .eq('user_id', user!.id)
        .is('deleted_at', null)
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
    staleTime: 1000 * 30,
  });
}

export function useTransactionStats(filters?: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transaction-stats', user?.id, filters],
    queryFn: async () => {
      // Buscar categorias de meta para excluir
      const { data: metaCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user!.id)
        .in('name', ['Depósito em Meta', 'Retirada de Meta']);

      const metaCategoryIds = (metaCategories || []).map(c => c.id);

      let query = supabase
        .from('transactions')
        .select('type, amount, category_id')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .is('deleted_at', null);

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
        if (metaCategoryIds.length > 0 && t.category_id && metaCategoryIds.includes(t.category_id)) {
          return;
        }
        if (t.type === 'income') {
          stats.totalIncome += Number(t.amount);
        } else {
          stats.totalExpense += Number(t.amount);
        }
      });

      // Somar parcelas de cartão de crédito do período
      if (filters?.startDate || filters?.endDate) {
        let parcelasQuery = (supabase as any)
          .from('parcelas_cartao')
          .select('valor, compra:compras_cartao(categoria_id)')
          .eq('ativo', true);

        if (filters?.startDate) {
          parcelasQuery = parcelasQuery.gte('mes_referencia', filters.startDate);
        }
        if (filters?.endDate) {
          parcelasQuery = parcelasQuery.lte('mes_referencia', filters.endDate);
        }

        const { data: parcelas } = await parcelasQuery;

        (parcelas || []).forEach((p: any) => {
          const catId = p.compra?.categoria_id;
          if (metaCategoryIds.length > 0 && catId && metaCategoryIds.includes(catId)) {
            return;
          }
          stats.totalExpense += Number(p.valor) || 0;
        });
      }

      // Somar assinaturas ativas do período (apenas sem vínculo com cartão)
      if (filters?.startDate && filters?.endDate) {
        const { data: assinaturas } = await (supabase as any)
          .from('assinaturas')
          .select('valor, category_id')
          .eq('user_id', user!.id)
          .eq('status', 'ativa')
          .is('compra_cartao_id', null)
          .gte('proxima_cobranca', filters.startDate)
          .lte('proxima_cobranca', filters.endDate);

        (assinaturas || []).forEach((a: any) => {
          const catId = a.category_id;
          if (metaCategoryIds.length > 0 && catId && metaCategoryIds.includes(catId)) return;
          stats.totalExpense += Number(a.valor) || 0;
        });
      }

      stats.balance = stats.totalIncome - stats.totalExpense;

      return stats;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useExpensesByCategory(filters?: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses-by-category', user?.id, filters],
    queryFn: async () => {
      // Buscar categorias de meta para excluir
      const { data: metaCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user!.id)
        .in('name', ['Depósito em Meta', 'Retirada de Meta']);

      const metaCategoryIds = (metaCategories || []).map(c => c.id);

      let query = supabase
        .from('transactions')
        .select(`
          amount,
          category:categories(id, name, icon, color)
        `)
        .eq('user_id', user!.id)
        .eq('type', 'expense')
        .in('status', ['completed', 'pending'])
        .is('deleted_at', null)
        .eq('desconsiderada', false);

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

        if (metaCategoryIds.length > 0 && metaCategoryIds.includes(categoryId)) {
          return;
        }

        const categoryIcon = cat?.icon || '📦';
        const categoryColor = cat?.color || '#111827';

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

      // Somar parcelas de cartão de crédito por categoria
      let parcelasQuery = (supabase as any)
        .from('parcelas_cartao')
        .select(`
          valor,
          compra:compras_cartao(categoria_id, categoria:categories!compras_cartao_categoria_id_fkey(id, name, icon, color), responsavel:responsaveis(is_titular))
        `)
        .eq('ativo', true);

      if (filters?.startDate) {
        parcelasQuery = parcelasQuery.gte('mes_referencia', filters.startDate);
      }
      if (filters?.endDate) {
        parcelasQuery = parcelasQuery.lte('mes_referencia', filters.endDate);
      }

      const { data: parcelas } = await parcelasQuery;

      (parcelas || []).forEach((p: any) => {
        // Filtrar: apenas compras do titular (is_titular !== false)
        if (p.compra?.responsavel?.is_titular === false) return;

        const catId = p.compra?.categoria_id || 'uncategorized';
        const cat = p.compra?.categoria as any;
        const categoryName = cat?.name || 'Sem categoria';

        if (metaCategoryIds.length > 0 && metaCategoryIds.includes(catId)) {
          return;
        }

        const categoryIcon = cat?.icon || '📦';
        const categoryColor = cat?.color || '#111827';
        const valor = Number(p.valor) || 0;

        if (categoryMap.has(catId)) {
          categoryMap.get(catId)!.total += valor;
        } else {
          categoryMap.set(catId, {
            name: categoryName,
            icon: categoryIcon,
            color: categoryColor,
            total: valor,
          });
        }
      });

      // Somar assinaturas ativas do período por categoria (apenas sem vínculo com cartão)
      if (filters?.startDate && filters?.endDate) {
        const { data: assinaturas } = await (supabase as any)
          .from('assinaturas')
          .select('valor, category_id, categoria:categories!assinaturas_category_id_fkey(id, name, icon, color)')
          .eq('user_id', user!.id)
          .eq('status', 'ativa')
          .is('compra_cartao_id', null)
          .gte('proxima_cobranca', filters.startDate)
          .lte('proxima_cobranca', filters.endDate);

        (assinaturas || []).forEach((a: any) => {
          const cat = a.categoria as any;
          const catId = a.category_id || 'uncategorized';
          if (metaCategoryIds.length > 0 && metaCategoryIds.includes(catId)) return;

          const valor = Number(a.valor) || 0;
          const categoryName = cat?.name || 'Sem categoria';
          const categoryIcon = cat?.icon || '📦';
          const categoryColor = cat?.color || '#111827';

          if (categoryMap.has(catId)) {
            categoryMap.get(catId)!.total += valor;
          } else {
            categoryMap.set(catId, {
              name: categoryName,
              icon: categoryIcon,
              color: categoryColor,
              total: valor,
            });
          }
        });
      }

      return Array.from(categoryMap.entries()).map(([id, data]) => ({
        id,
        ...data,
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
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
        .select('type, amount, date, desconsiderada')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .eq('desconsiderada', false)
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

      // Somar parcelas de cartão de crédito por mês
      const { data: parcelas } = await (supabase as any)
        .from('parcelas_cartao')
        .select('valor, mes_referencia')
        .eq('ativo', true)
        .gte('mes_referencia', startDate)
        .lte('mes_referencia', endDate);

      (parcelas || []).forEach((p: any) => {
        const month = new Date(p.mes_referencia).getMonth();
        monthlyData[month].expense += Number(p.valor) || 0;
      });

      return monthlyData;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      let categoryId = transaction.category_id;

      // Auto-categorização: se não tem categoria e tem descrição, buscar regra
      if (!categoryId && transaction.description && user?.id) {
        const matchedCategoryId = await findMatchingCategory(user.id, transaction.description);
        if (matchedCategoryId) {
          categoryId = matchedCategoryId;
        }
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          category_id: categoryId,
          user_id: user!.id,
        })
        .select(`*, category:categories(name)`)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidateTransactionCaches(queryClient);
      toast({
        title: 'Registro criado',
        description: 'O registro financeiro foi criado com sucesso.',
      });

      // Enviar notificação Telegram (fire-and-forget)
      if (user?.id) {
        const cat = data.category as unknown as { name: string } | null;
        enviarNotificacaoTelegram({
          userId: user.id,
          type: data.type,
          amount: data.amount,
          description: data.description,
          categoryName: cat?.name,
          date: data.date,
        });
      }
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

      // Auto-categorização: se não tem categoria e tem descrição, buscar regra
      let categoryId = baseTransaction.category_id;
      if (!categoryId && baseTransaction.description) {
        const matchedCategoryId = await findMatchingCategory(userId, baseTransaction.description);
        if (matchedCategoryId) {
          categoryId = matchedCategoryId;
        }
      }

      const transactionWithCategory = { ...baseTransaction, category_id: categoryId };

      if (tipoLancamento === 'unica') {
        // Transação única - comportamento padrão
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            ...transactionWithCategory,
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
      const parcelas = totalParcelas;
      const valorParcela = transactionWithCategory.amount! / (tipoLancamento === 'parcelada' ? parcelas : 1);
      const baseDate = transactionWithCategory.date ? parseISO(transactionWithCategory.date) : new Date();

      // Criar transação pai primeiro
      const { data: parentTransaction, error: parentError } = await supabase
        .from('transactions')
        .insert({
          ...transactionWithCategory,
          user_id: userId,
          tipo_lancamento: tipoLancamento,
          total_parcelas: parcelas,
          numero_parcela: 1,
          amount: valorParcela,
          description: tipoLancamento === 'parcelada' 
            ? `${transactionWithCategory.description || 'Parcela'} (1/${parcelas})`
            : transactionWithCategory.description,
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
          ...transactionWithCategory,
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
            ? `${transactionWithCategory.description || 'Parcela'} (${i}/${parcelas})`
            : transactionWithCategory.description,
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
    onSuccess: (data, variables) => {
      invalidateTransactionCaches(queryClient);
      
      const msg = variables.tipoLancamento === 'parcelada'
        ? `${variables.totalParcelas} parcelas foram criadas.`
        : variables.tipoLancamento === 'fixa'
        ? `${variables.totalParcelas} lançamentos futuros foram criados.`
        : 'O registro financeiro foi criado com sucesso.';
        
      toast({
        title: 'Registro criado',
        description: msg,
      });

      // Enviar notificação Telegram para a primeira transação (fire-and-forget)
      if (user?.id && data && data.length > 0) {
        const base = variables.baseTransaction;
        // Buscar nome da categoria
        const fetchCatAndNotify = async () => {
          let catName: string | null = null;
          if (base.category_id) {
            const { data: cat } = await supabase
              .from('categories')
              .select('name')
              .eq('id', base.category_id)
              .maybeSingle();
            catName = cat?.name || null;
          }
          enviarNotificacaoTelegram({
            userId: user!.id,
            type: base.type,
            amount: base.amount,
            description: base.description,
            categoryName: catName,
            date: base.date,
          });
        };
        fetchCatAndNotify();
      }
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
      invalidateTransactionCaches(queryClient);
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

export function useUpdateRecurringTransactions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, mode, updates }: { id: string; mode: 'single' | 'future'; updates: Partial<Transaction> }) => {
      if (mode === 'single') {
        const { error } = await supabase
          .from('transactions')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      } else {
        // Get the transaction to find parent_id and date
        const { data: txn, error: fetchErr } = await supabase
          .from('transactions')
          .select('parent_id, date')
          .eq('id', id)
          .single();
        if (fetchErr) throw fetchErr;

        const groupId = txn.parent_id || id;

        // Strip per-occurrence fields so we don't collapse every future row onto the same date
        const { date: _d, due_date: _dd, paid_date: _pd, ...safeUpdates } = updates as any;

        // Update all in group with date >= this transaction's date
        const { error } = await supabase
          .from('transactions')
          .update(safeUpdates)
          .or(`parent_id.eq.${groupId},id.eq.${groupId}`)
          .gte('date', txn.date)
          .is('deleted_at', null);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      invalidateTransactionCaches(queryClient);
      toast({
        title: 'Registro atualizado',
        description: vars.mode === 'single'
          ? 'Apenas este mês foi atualizado.'
          : 'Este e todos os seguintes foram atualizados.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os registros.',
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
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateTransactionCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: ['deleted-transactions'] });
      toast({
        title: 'Registro movido para lixeira',
        description: 'Você pode restaurá-lo a qualquer momento.',
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

// Hook para excluir transações recorrentes com opção de lote
export function useDeleteRecurringTransactions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ transactionId, mode }: { transactionId: string; mode: 'single' | 'future' }) => {
      const deletedAt = new Date().toISOString();
      if (mode === 'single') {
        const { error } = await supabase
          .from('transactions')
          .update({ deleted_at: deletedAt } as any)
          .eq('id', transactionId);
        if (error) throw error;
        return;
      }

      // mode === 'future': delete this and all future transactions in the same group
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('id, parent_id, date')
        .eq('id', transactionId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!transaction) throw new Error('Transação não encontrada');

      const groupId = transaction.parent_id || transaction.id;
      const transactionDate = transaction.date;

      // Soft delete all in group with date >= selected date
      const { error: deleteChildrenError } = await supabase
        .from('transactions')
        .update({ deleted_at: deletedAt } as any)
        .eq('parent_id', groupId)
        .gte('date', transactionDate);

      if (deleteChildrenError) throw deleteChildrenError;

      if (!transaction.parent_id) {
        const { error: deleteParentError } = await supabase
          .from('transactions')
          .update({ deleted_at: deletedAt } as any)
          .eq('id', groupId)
          .gte('date', transactionDate);
        if (deleteParentError) throw deleteParentError;
      } else {
        const { data: parent } = await supabase
          .from('transactions')
          .select('id, date')
          .eq('id', groupId)
          .maybeSingle();
        
        if (parent && parent.date >= transactionDate) {
          const { error: deleteParentError } = await supabase
            .from('transactions')
            .update({ deleted_at: deletedAt } as any)
            .eq('id', parent.id);
          if (deleteParentError) throw deleteParentError;
        }
      }
    },
    onSuccess: (_, variables) => {
      invalidateTransactionCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: ['deleted-transactions'] });
      toast({
        title: 'Movido para lixeira',
        description: variables.mode === 'single'
          ? 'O lançamento foi movido para a lixeira.'
          : 'Este e todos os lançamentos futuros foram movidos para a lixeira.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o(s) registro(s).',
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
          paid_date: today,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateTransactionCaches(queryClient);
      toast({ title: 'Marcar como pago', description: 'O lançamento foi atualizado.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
    },
  });
}

export function useMarkFaturaAsPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ cartaoId, mesReferencia }: { cartaoId: string; mesReferencia: string }) => {
      // 1. Buscar IDs das compras desse cartão
      const { data: compras, error: comprasError } = await supabase
        .from('compras_cartao')
        .select('id')
        .eq('cartao_id', cartaoId);

      if (comprasError) throw comprasError;
      if (!compras || compras.length === 0) return;

      const compraIds = compras.map(c => c.id);

      // 2. Atualizar parcelas
      const { error: updateError } = await supabase
        .from('parcelas_cartao')
        .update({ paga: true })
        .eq('mes_referencia', mesReferencia)
        .eq('ativo', true)
        .in('compra_id', compraIds);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      invalidateTransactionCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: ['faturas-na-listagem'] });
      toast({ title: 'Fatura marcada como paga', description: 'Todas as parcelas do mês foram atualizadas.' });
    },
    onError: (error) => {
      console.error('Erro ao marcar fatura como paga:', error);
      toast({ title: 'Erro', description: 'Não foi possível marcar a fatura como paga.', variant: 'destructive' });
    },
  });
}

export function useToggleDesconsiderada() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, desconsiderada }: { id: string; desconsiderada: boolean }) => {
      // Ao desconsiderar, marcar também como pendente para que o usuário
      // possa efetivar (marcar como paga) novamente depois.
      // Se for receita (income), SEMPRE marcar como pendente ao desmarcar 'pago' (desconsiderada não se aplica a receitas da mesma forma no cálculo de saldo real)
      const updatePayload: any = { desconsiderada };
      if (desconsiderada) {
        updatePayload.status = 'pending';
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      invalidateTransactionCaches(queryClient);
      toast({
        title: variables.desconsiderada ? 'Transação desconsiderada' : 'Transação reconsiderada',
        description: variables.desconsiderada 
          ? 'Movida para pendente e removida dos cálculos. Você pode efetivá-la depois.'
          : 'Voltou a ser contabilizada nos totais.',
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
        .eq('status', 'pending')
        .is('deleted_at', null);

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

// Hook para transações com saldo progressivo por conta bancária
export function useTransactionsWithBalance(filters?: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions-with-balance', user?.id, filters],
    queryFn: async () => {
      // Buscar saldo inicial de todos os bancos ativos
      const { data: bancos } = await supabase
        .from('bancos')
        .select('id, saldo_inicial')
        .eq('user_id', user!.id)
        .eq('ativo', true);

      // Mapa banco_id -> saldo_inicial
      const saldoInicialPorBanco = new Map<string, number>();
      (bancos || []).forEach(b => {
        saldoInicialPorBanco.set(b.id, Number(b.saldo_inicial) || 0);
      });

      // Fallback: saldo inicial do profile (para transações sem banco)
      const { data: profile } = await supabase
        .from('profiles')
        .select('saldo_inicial')
        .eq('user_id', user!.id)
        .single();

      const saldoInicialProfile = Number(profile?.saldo_inicial) || 0;

      // Buscar TODAS as transações completed ordenadas cronologicamente
      const { data: allCompleted, error: allError } = await supabase
        .from('transactions')
        .select('id, type, amount, status, created_at, banco_id, date')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(10000);

      if (allError) throw allError;

      // Buscar total guardado em metas
      const { data: metas } = await supabase
        .from('metas')
        .select('valor_atual')
        .eq('user_id', user!.id)
        .eq('concluida', false);

      const totalMetas = (metas || []).reduce(
        (sum, meta) => sum + Number(meta.valor_atual), 0
      );

      // Buscar total guardado em investimentos
      const { data: investimentos } = await supabase
        .from('investimentos')
        .select('valor_atual')
        .eq('user_id', user!.id)
        .eq('ativo', true);

      const totalInvestido = (investimentos || []).reduce(
        (sum, inv) => sum + Number(inv.valor_atual), 0
      );

      const totalGuardado = totalMetas + totalInvestido;

      // Calcular saldo progressivo POR CONTA BANCÁRIA
      // saldoMap armazena o saldo da conta ANTES da transação ser aplicada
      const saldoCorrentePorBanco = new Map<string, number>();
      const saldoMap = new Map<string, number>();

      // Inicializar saldos com saldo_inicial de cada banco
      saldoInicialPorBanco.forEach((saldoInicial, bancoId) => {
        saldoCorrentePorBanco.set(bancoId, saldoInicial);
      });

      // Saldo para transações sem banco vinculado
      let saldoSemBanco = saldoInicialProfile;
      
      for (const t of allCompleted || []) {
        const bancoId = t.banco_id;
        const valor = Number(t.amount);

        if (bancoId && saldoInicialPorBanco.has(bancoId)) {
          // Transação vinculada a um banco existente
          const saldoAtual = saldoCorrentePorBanco.get(bancoId) || 0;
          // Armazenar saldo ANTES da transação
          saldoMap.set(t.id, saldoAtual);
          // Atualizar saldo corrente
          const novoSaldo = saldoAtual + (t.type === 'income' ? valor : -valor);
          saldoCorrentePorBanco.set(bancoId, novoSaldo);
        } else {
          // Transação sem banco - usar saldo global do profile
          saldoMap.set(t.id, saldoSemBanco);
          saldoSemBanco += t.type === 'income' ? valor : -valor;
        }
      }

      // Identificar a última transação (mais recente por created_at)
      const ultimaTransacaoId = allCompleted && allCompleted.length > 0 
        ? allCompleted[allCompleted.length - 1].id 
        : undefined;

      // Buscar transações filtradas para exibição
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

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

      return {
        transactions: data as Transaction[],
        saldoMap,
        totalGuardado,
        ultimaTransacaoId,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCompleteStats(mesReferencia?: Date) {
  const { user } = useAuth();
  const mesRef = mesReferencia || new Date();
  const inicioMes = `${mesRef.getFullYear()}-${String(mesRef.getMonth() + 1).padStart(2, '0')}-01`;
  const fimMes = (() => { const d = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 0); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

  return useQuery({
    queryKey: ['complete-stats', user?.id, inicioMes],
    queryFn: async () => {
     try {
      // Buscar soma de saldo_inicial de todos os bancos ativos
      const { data: bancos } = await supabase
        .from('bancos')
        .select('saldo_inicial')
        .eq('user_id', user!.id)
        .eq('ativo', true);

      const saldoInicialBancos = (bancos || []).reduce(
        (acc, b) => acc + Number(b.saldo_inicial || 0), 0
      );

      // Buscar dados do profile (saldo inicial e ajuste estimado)
      const { data: profile } = await supabase
        .from('profiles')
        .select('saldo_inicial, ajuste_estimado')
        .eq('user_id', user!.id)
        .single();

      // Fallback: se não tem bancos, usar saldo_inicial do profile
      let saldoInicial = saldoInicialBancos;
      if (saldoInicialBancos === 0) {
        saldoInicial = Number(profile?.saldo_inicial) || 0;
      }
      
      const ajusteEstimadoManual = Number(profile?.ajuste_estimado) || 0;

      // Buscar total de investimentos ativos
      const { data: investimentos } = await supabase
        .from('investimentos')
        .select('valor_atual')
        .eq('user_id', user!.id)
        .eq('ativo', true);

      const totalInvestido = (investimentos || []).reduce(
        (sum, inv) => sum + Number(inv.valor_atual), 0
      );

      // Buscar total de metas de economia (não concluídas)
      const { data: metas } = await supabase
        .from('metas')
        .select('valor_atual')
        .eq('user_id', user!.id)
        .eq('concluida', false);

      const totalMetas = (metas || []).reduce(
        (sum, meta) => sum + Number(meta.valor_atual), 0
      );

      // Total guardado = Investimentos + Metas
      const totalGuardado = totalInvestido + totalMetas;

      // 1. Buscar TODAS transações completed para saldo disponível (acumulado histórico)
      const { data: allCompleted, error: allCompletedError } = await supabase
        .from('transactions')
        .select('type, amount, category_id, desconsiderada')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .limit(10000);

      if (allCompletedError) throw allCompletedError;

      // 2. Buscar IDs das categorias de meta para filtrar dos totais exibidos
      const { data: metaCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user!.id)
        .in('name', ['Depósito em Meta', 'Retirada de Meta', 'Fatura do Cartão', 'Fatura de Cartão']);

      const metaCategoryIds = new Set(
        (metaCategories || [])
          .filter(c => c.name !== 'Fatura do Cartão')
          .map(c => c.id)
      );
      const faturaCategoryIds = new Set(
        (metaCategories || [])
          .filter(c => c.name === 'Fatura do Cartão' || c.name === 'Fatura de Cartão')
          .map(c => c.id)
      );

      // 3. Buscar transações completed DO MÊS para receitas/despesas exibidas
      const { data: completedDoMes, error: completedDoMesError } = await supabase
        .from('transactions')
        .select('type, amount, category_id, desconsiderada')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .gte('date', inicioMes)
        .lte('date', fimMes);

      if (completedDoMesError) throw completedDoMesError;

      // 3. Buscar pending DO MÊS para A Receber/A Pagar
      const { data: pendingDoMes, error: pendingDoMesError } = await supabase
        .from('transactions')
        .select('type, amount, due_date, category_id, desconsiderada')
        .eq('user_id', user!.id)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .gte('due_date', inicioMes)
        .lte('due_date', fimMes);

      if (pendingDoMesError) throw pendingDoMesError;

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

      // Calcular total da fatura do titular e de outros responsáveis
      let faturaCartaoTitularRaw = 0;
      let faturaCartaoOutrosRaw = 0; // outros responsáveis (todas as parcelas, pagas + pendentes)
      let faturaViaParcelasPagas = 0; // titular pagas (para conciliação)
      let faturaTitularTodas = 0; // titular pagas + pendentes (para totalGeralDespesas)
      (parcelasCartao || []).forEach((p: any) => {
        const isTitular = p.compra?.responsavel?.is_titular === true;
        const isPaga = p.paga === true;
        const valor = Number(p.valor) || 0;
        
        if (isTitular) {
          faturaTitularTodas += valor;
          if (!isPaga) {
            faturaCartaoTitularRaw += valor;
          } else {
            faturaViaParcelasPagas += valor;
          }
        } else {
          faturaCartaoOutrosRaw += valor;
        }
      });

      const today = new Date().toISOString().split('T')[0];
      
      // Garantir que os totais negativos (estornos excedentes) não sejam somados aos gastos,
      // mas sim que faturas em aberto negativas não apareçam como dívida no total estimado.
      const faturaCartaoTitular = Math.max(0, faturaCartaoTitularRaw);
      const faturaCartaoOutros = Math.max(0, faturaCartaoOutrosRaw);

      // Calcular saldo acumulado usando TODAS as transações completed
      // Despesas/receitas marcadas como "desconsiderada" são ignoradas do caixa
      let allCompletedIncome = 0;
      let allCompletedExpense = 0;
      (allCompleted || []).forEach((t) => {
        if ((t as any).desconsiderada === true) return;
        const amount = Number(t.amount);
        if (t.type === 'income') allCompletedIncome += amount;
        else allCompletedExpense += amount;
      });

      // Calcular receitas/despesas DO MÊS SELECIONADO
      const stats = {
        saldoInicial,
        completedIncome: 0,  // Receitas do mês
        completedExpense: 0, // Despesas do mês (sem fatura cartão)
        completedExpenseWithFatura: 0, // Despesas do mês (com fatura cartão)
        completedExpenseCash: 0, // Despesas que saíram do caixa (para o card de Despesas)
        pendingIncome: 0,
        pendingExpense: 0,
        overdueCount: 0,
        pendingCount: 0,
        faturaCartao: faturaCartaoTitular,
        faturaCartaoOutros,
        totalGeralDespesas: 0, // Será calculado abaixo
        totalInvestido,
        // Valores acumulados para cálculo do saldo
        allCompletedIncome,
        allCompletedExpense,
      };

      // Receitas e Despesas apenas do mês selecionado (excluindo movimentações de meta)
      let faturaViaTransacao = 0;
      let despesasBase = 0;
      (completedDoMes || []).forEach((t) => {
        if ((t as any).desconsiderada === true) return;
        const amount = Number(t.amount);
        const isMetaCategory = t.category_id && metaCategoryIds.has(t.category_id);
        const isFaturaCartao = t.category_id && faturaCategoryIds.has(t.category_id);
        if (!isMetaCategory) {
          if (isFaturaCartao && t.type === 'expense') {
            faturaViaTransacao += amount;
          } else if (!isFaturaCartao) {
            if (t.type === 'income') stats.completedIncome += amount;
            else {
              stats.completedExpense += amount;
              despesasBase += amount;
              if (!(t as any).desconsiderada) {
                stats.completedExpenseCash += amount;
              }
            }
          }
        }
      });

      // Conciliar: usar o maior entre fatura via transação e o total da fatura (pagas + pendentes)
      const faturaTotalParcelas = faturaViaParcelasPagas;
      const faturaConsolidada = Math.max(faturaViaTransacao, faturaTotalParcelas);
      stats.completedExpenseWithFatura = despesasBase + faturaConsolidada;
      
      // Calcular versão "caixa" da despesa com fatura (respeitando desconsiderada apenas para exibição no card de despesas)
      const faturaViaTransacaoCash = (completedDoMes || [])
        .filter(t => t.type === 'expense' && faturaCategoryIds.has(t.category_id!) && !(t as any).desconsiderada)
        .reduce((acc, t) => acc + Number(t.amount), 0);
      
      const statsExibicao = {
        ...stats,
        completedExpenseWithFaturaCash: stats.completedExpenseCash + Math.max(faturaViaTransacaoCash, faturaTotalParcelas)
      };
      // (totalGeralDespesas é calculado APÓS o loop de pending, abaixo)

      // Pendentes do mês
      (pendingDoMes || []).forEach((t) => {
        const amount = Number(t.amount);
        const isFaturaCartao = t.category_id && faturaCategoryIds.has(t.category_id);
        const isDesconsiderada = (t as any).desconsiderada === true;
        stats.pendingCount++;
        if (t.type === 'income') {
          if (!isDesconsiderada) stats.pendingIncome += amount;
        } else {
          // Despesas com categoria "Fatura do Cartão" já estão em faturaCartaoTitular
          // Despesas desconsideradas não entram no cálculo estimado
          if (!isFaturaCartao && !isDesconsiderada) {
            stats.pendingExpense += amount;
          }
        }
        if (t.due_date && t.due_date < today) stats.overdueCount++;
      });

      // Total de Despesas do mês = despesas avulsas (completed + pending) + fatura COMPLETA de TODOS os responsáveis
      stats.totalGeralDespesas = despesasBase + stats.pendingExpense + faturaTitularTodas + faturaCartaoOutrosRaw;

      // Saldo Disponível = Saldo Inicial + Receitas Acumuladas - Despesas Acumuladas
      // (dinheiro "livre" que você pode gastar - usa histórico completo)
      const saldoDisponivel = saldoInicial + allCompletedIncome - allCompletedExpense;
      
      // Patrimônio Total = Saldo Disponível + Metas + Investimentos
      // (toda sua riqueza, incluindo reservas)
      const patrimonioTotal = saldoDisponivel + totalMetas + totalInvestido;
      
      // Saldo Real = Saldo Disponível (o que realmente está "livre")
      const realBalance = saldoDisponivel;
      
      // Total Estimado do mês = Receitas pendentes - Despesas pendentes - Fatura do Cartão (titular) + Ajuste Manual
      // Considera apenas pendências do mês selecionado (não soma saldo real acumulado)
      const estimatedBalance = stats.pendingIncome - stats.pendingExpense - faturaCartaoTitular + ajusteEstimadoManual;

      return {
        ...stats,
        realBalance,
        saldoDisponivel,
        patrimonioTotal,
        estimatedBalance,
        faturaCartaoTitularRaw, // Para debug se necessário
        faturaCartaoOutrosRaw,
        totalMetas,
        totalInvestido,
        totalGuardado,
        totalGeralDespesas: stats.totalGeralDespesas,
        faturaCartaoOutros: stats.faturaCartaoOutros,
        completedExpenseWithFaturaCash: statsExibicao.completedExpenseWithFaturaCash,
      };
     } catch (error) {
        console.error('Erro ao calcular estatísticas completas:', error);
        // Retornar valores zerados para não quebrar o dashboard
        return {
          saldoInicial: 0, completedIncome: 0, completedExpense: 0, completedExpenseWithFatura: 0,
          pendingIncome: 0, pendingExpense: 0, overdueCount: 0, pendingCount: 0,
          faturaCartao: 0, totalInvestido: 0, allCompletedIncome: 0, allCompletedExpense: 0,
          realBalance: 0, saldoDisponivel: 0, patrimonioTotal: 0, estimatedBalance: 0,
          totalMetas: 0, totalGuardado: 0, totalGeralDespesas: 0, faturaCartaoOutros: 0,
          completedExpenseWithFaturaCash: 0,
        };
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Keep for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

// ==================== LIXEIRA ====================

export function useDeletedTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deleted-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user!.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data as (Transaction & { deleted_at: string })[];
    },
    enabled: !!user,
  });
}

export function useRestoreTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: null } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateTransactionCaches(queryClient);
      toast({ title: 'Transação restaurada', description: 'A transação voltou para a listagem.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível restaurar.', variant: 'destructive' });
    },
  });
}

export function usePermanentDeleteTransaction() {
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
      invalidateTransactionCaches(queryClient);
      toast({ title: 'Excluído permanentemente', description: 'A transação foi removida definitivamente.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user!.id)
        .not('deleted_at', 'is', null);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateTransactionCaches(queryClient);
      toast({ title: 'Lixeira esvaziada', description: 'Todas as transações foram removidas permanentemente.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível esvaziar a lixeira.', variant: 'destructive' });
    },
  });
}
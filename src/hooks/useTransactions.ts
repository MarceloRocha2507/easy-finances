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
      queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
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
      queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
      
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
      queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
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
      queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
      queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
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
      queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
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

// Hook para transações com saldo progressivo
export function useTransactionsWithBalance(filters?: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions-with-balance', user?.id, filters],
    queryFn: async () => {
      // Buscar saldo inicial do profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('saldo_inicial')
        .eq('user_id', user!.id)
        .single();

      const saldoInicial = Number(profile?.saldo_inicial) || 0;

      // Buscar TODAS as transações completed para calcular saldo progressivo
      const { data: allCompleted, error: allError } = await supabase
        .from('transactions')
        .select('id, type, amount, status, created_at')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

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

      // Calcular saldo progressivo (patrimônio bruto)
      let saldo = saldoInicial;
      const saldoMap = new Map<string, number>();
      
      for (const t of allCompleted || []) {
        saldo += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
        // Armazenar o patrimônio total após cada transação
        saldoMap.set(t.id, saldo);
      }

      // Identificar a última transação (mais recente por created_at)
      const ultimaTransacaoId = allCompleted && allCompleted.length > 0 
        ? allCompleted[allCompleted.length - 1].id 
        : undefined;

      // Ajustar APENAS a última transação para mostrar saldo disponível
      if (ultimaTransacaoId) {
        const patrimonioAtual = saldoMap.get(ultimaTransacaoId) || 0;
        saldoMap.set(ultimaTransacaoId, patrimonioAtual - totalGuardado);
      }

      // Buscar transações filtradas para exibição
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
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
  });
}

export function useCompleteStats(mesReferencia?: Date) {
  const { user } = useAuth();
  const mesRef = mesReferencia || new Date();
  const inicioMes = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1).toISOString().split('T')[0];
  const fimMes = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 0).toISOString().split('T')[0];

  return useQuery({
    queryKey: ['complete-stats', user?.id, inicioMes],
    queryFn: async () => {
      // Buscar soma de saldo_inicial de todos os bancos ativos
      const { data: bancos } = await supabase
        .from('bancos')
        .select('saldo_inicial')
        .eq('user_id', user!.id)
        .eq('ativo', true);

      const saldoInicialBancos = (bancos || []).reduce(
        (acc, b) => acc + Number(b.saldo_inicial || 0), 0
      );

      // Buscar saldo inicial do profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('saldo_inicial')
        .eq('user_id', user!.id)
        .single();

      // Fallback: se não tem bancos, usar saldo_inicial do profile
      let saldoInicial = saldoInicialBancos;
      if (saldoInicialBancos === 0) {
        saldoInicial = Number(profile?.saldo_inicial) || 0;
      }

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
        .select('type, amount')
        .eq('status', 'completed');

      if (allCompletedError) throw allCompletedError;

      // 2. Buscar transações completed DO MÊS para receitas/despesas exibidas
      const { data: completedDoMes, error: completedDoMesError } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('status', 'completed')
        .gte('date', inicioMes)
        .lte('date', fimMes);

      if (completedDoMesError) throw completedDoMesError;

      // 3. Buscar pending DO MÊS para A Receber/A Pagar
      const { data: pendingDoMes, error: pendingDoMesError } = await supabase
        .from('transactions')
        .select('type, amount, due_date')
        .eq('status', 'pending')
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
      
      // Calcular saldo acumulado usando TODAS as transações completed
      let allCompletedIncome = 0;
      let allCompletedExpense = 0;
      (allCompleted || []).forEach((t) => {
        const amount = Number(t.amount);
        if (t.type === 'income') allCompletedIncome += amount;
        else allCompletedExpense += amount;
      });

      // Calcular receitas/despesas DO MÊS SELECIONADO
      const stats = {
        saldoInicial,
        completedIncome: 0,  // Receitas do mês
        completedExpense: 0, // Despesas do mês
        pendingIncome: 0,
        pendingExpense: 0,
        overdueCount: 0,
        pendingCount: 0,
        faturaCartao: faturaCartaoTitular,
        totalInvestido,
        // Valores acumulados para cálculo do saldo
        allCompletedIncome,
        allCompletedExpense,
      };

      // Receitas e Despesas apenas do mês selecionado
      (completedDoMes || []).forEach((t) => {
        const amount = Number(t.amount);
        if (t.type === 'income') stats.completedIncome += amount;
        else stats.completedExpense += amount;
      });

      // Pendentes do mês
      (pendingDoMes || []).forEach((t) => {
        const amount = Number(t.amount);
        stats.pendingCount++;
        if (t.type === 'income') stats.pendingIncome += amount;
        else stats.pendingExpense += amount;
        if (t.due_date && t.due_date < today) stats.overdueCount++;
      });

      // Saldo Disponível = Saldo Inicial + Receitas Acumuladas - Despesas Acumuladas
      // (dinheiro "livre" que você pode gastar - usa histórico completo)
      const saldoDisponivel = saldoInicial + allCompletedIncome - allCompletedExpense;
      
      // Patrimônio Total = Saldo Disponível + Metas + Investimentos
      // (toda sua riqueza, incluindo reservas)
      const patrimonioTotal = saldoDisponivel + totalMetas + totalInvestido;
      
      // Saldo Real = Saldo Disponível (o que realmente está "livre")
      const realBalance = saldoDisponivel;
      
      // Saldo Estimado = Disponível + A Receber do mês - A Pagar do mês - Fatura do Cartão
      const estimatedBalance = saldoDisponivel + stats.pendingIncome - stats.pendingExpense - faturaCartaoTitular;

      return {
        ...stats,
        realBalance,
        saldoDisponivel,
        patrimonioTotal,
        estimatedBalance,
        totalMetas,
        totalInvestido,
        totalGuardado,
      };
    },
    enabled: !!user,
  });
}
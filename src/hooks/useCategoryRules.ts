import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import {
  CategoryRule,
  CategoryRuleInsert,
  CategoryRuleUpdate,
  listCategoryRules,
  createCategoryRule,
  updateCategoryRule,
  deleteCategoryRule,
} from '@/services/category-rules';

export type { CategoryRule, CategoryRuleInsert, CategoryRuleUpdate };

export function useCategoryRules() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['category-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return listCategoryRules(user.id);
    },
    enabled: !!user,
  });
}

export function useCreateCategoryRule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rule: CategoryRuleInsert) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return createCategoryRule(user.id, rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      queryClient.invalidateQueries({ queryKey: ['resource-usage'] });
      toast({
        title: 'Regra criada',
        description: 'A regra de categorização foi criada com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a regra.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCategoryRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CategoryRuleUpdate & { id: string }) => {
      return updateCategoryRule(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      toast({
        title: 'Regra atualizada',
        description: 'A regra de categorização foi atualizada com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a regra.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCategoryRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteCategoryRule(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-rules'] });
      queryClient.invalidateQueries({ queryKey: ['resource-usage'] });
      toast({
        title: 'Regra removida',
        description: 'A regra de categorização foi removida com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a regra.',
        variant: 'destructive',
      });
    },
  });
}

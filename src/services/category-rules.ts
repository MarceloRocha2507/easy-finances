import { supabase } from "@/integrations/supabase/client";

export interface CategoryRule {
  id: string;
  user_id: string;
  category_id: string;
  keywords: string[];
  case_insensitive: boolean;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense';
  };
}

export interface CategoryRuleInsert {
  category_id: string;
  keywords: string[];
  case_insensitive?: boolean;
  is_active?: boolean;
  priority?: number;
}

export interface CategoryRuleUpdate {
  category_id?: string;
  keywords?: string[];
  case_insensitive?: boolean;
  is_active?: boolean;
  priority?: number;
}

/**
 * Busca a categoria correspondente para uma descrição baseada nas regras do usuário
 */
export async function findMatchingCategory(
  userId: string,
  description: string
): Promise<string | null> {
  if (!description || !userId) return null;

  // Buscar regras ativas do usuário ordenadas por prioridade
  const { data: rules, error } = await supabase
    .from("category_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (error || !rules || rules.length === 0) {
    return null;
  }

  // Verificar cada regra
  for (const rule of rules) {
    const keywords = rule.keywords as string[];
    const caseInsensitive = rule.case_insensitive;
    
    const descToCheck = caseInsensitive ? description.toLowerCase() : description;
    
    for (const keyword of keywords) {
      const keywordToCheck = caseInsensitive ? keyword.toLowerCase() : keyword;
      
      if (descToCheck.includes(keywordToCheck)) {
        return rule.category_id;
      }
    }
  }

  return null;
}

/**
 * Lista todas as regras do usuário
 */
export async function listCategoryRules(userId: string): Promise<CategoryRule[]> {
  const { data, error } = await supabase
    .from("category_rules")
    .select(`
      *,
      category:categories(id, name, icon, color, type)
    `)
    .eq("user_id", userId)
    .order("priority", { ascending: true });

  if (error) throw error;
  return data as CategoryRule[];
}

/**
 * Cria uma nova regra
 */
export async function createCategoryRule(
  userId: string,
  rule: CategoryRuleInsert
): Promise<CategoryRule> {
  const { data, error } = await supabase
    .from("category_rules")
    .insert({
      ...rule,
      user_id: userId,
    })
    .select(`
      *,
      category:categories(id, name, icon, color, type)
    `)
    .single();

  if (error) throw error;
  return data as CategoryRule;
}

/**
 * Atualiza uma regra existente
 */
export async function updateCategoryRule(
  ruleId: string,
  updates: CategoryRuleUpdate
): Promise<CategoryRule> {
  const { data, error } = await supabase
    .from("category_rules")
    .update(updates)
    .eq("id", ruleId)
    .select(`
      *,
      category:categories(id, name, icon, color, type)
    `)
    .single();

  if (error) throw error;
  return data as CategoryRule;
}

/**
 * Exclui uma regra
 */
export async function deleteCategoryRule(ruleId: string): Promise<void> {
  const { error } = await supabase
    .from("category_rules")
    .delete()
    .eq("id", ruleId);

  if (error) throw error;
}

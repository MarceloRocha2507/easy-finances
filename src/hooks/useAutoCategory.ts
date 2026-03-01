import { useState, useEffect, useRef } from 'react';
import type { Category } from '@/hooks/useCategories';
import { findCategoryByKeywords } from '@/lib/category-keywords';
import { findMatchingCategory } from '@/services/category-rules';
import { useAuth } from '@/hooks/useAuth';

interface UseAutoCategoryResult {
  suggestedCategoryId: string | null;
  isSuggestion: boolean;
}

/**
 * Hook que sugere automaticamente uma categoria com base na descrição.
 * 1. Tenta match local (keywords built-in) — instantâneo
 * 2. Se não encontrar, tenta regras personalizadas do usuário (banco)
 * Debounce de 300ms para não processar a cada tecla.
 */
export function useAutoCategory(
  description: string,
  categories: Category[],
  enabled: boolean = true,
): UseAutoCategoryResult {
  const { user } = useAuth();
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const [isSuggestion, setIsSuggestion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!enabled || !description || description.length < 2 || !categories.length) {
      setSuggestedCategoryId(null);
      setIsSuggestion(false);
      return;
    }

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      // 1. Tentar match local (built-in keywords)
      const localMatch = findCategoryByKeywords(description, categories);
      if (localMatch) {
        setSuggestedCategoryId(localMatch);
        setIsSuggestion(true);
        return;
      }

      // 2. Tentar regras personalizadas do usuário
      if (user?.id) {
        try {
          const ruleMatch = await findMatchingCategory(user.id, description);
          if (ruleMatch) {
            setSuggestedCategoryId(ruleMatch);
            setIsSuggestion(true);
            return;
          }
        } catch {
          // silently fail
        }
      }

      setSuggestedCategoryId(null);
      setIsSuggestion(false);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [description, categories, enabled, user?.id]);

  return { suggestedCategoryId, isSuggestion };
}

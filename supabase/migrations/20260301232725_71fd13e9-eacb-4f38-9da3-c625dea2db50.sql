
-- 1. Add subcategoria_id column
ALTER TABLE compras_cartao ADD COLUMN subcategoria_id uuid REFERENCES categories(id);

-- 2. Copy existing categoria_id to subcategoria_id
UPDATE compras_cartao SET subcategoria_id = categoria_id WHERE categoria_id IS NOT NULL;

-- 3. Create "Fatura do Cartão" category for all existing users
INSERT INTO categories (user_id, name, icon, color, type, is_default)
SELECT DISTINCT p.user_id, 'Fatura do Cartão', 'credit-card', '#8b5cf6', 'expense'::transaction_type, true
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.user_id = p.user_id AND c.name = 'Fatura do Cartão'
);

-- 4. Update create_default_categories trigger to include "Fatura do Cartão"
CREATE OR REPLACE FUNCTION public.create_default_categories()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (new.id, 'Alimentação', 'utensils', '#ef4444', 'expense'::transaction_type, true),
    (new.id, 'Transporte', 'car', '#f97316', 'expense'::transaction_type, true),
    (new.id, 'Moradia', 'home', '#eab308', 'expense'::transaction_type, true),
    (new.id, 'Contas', 'zap', '#84cc16', 'expense'::transaction_type, true),
    (new.id, 'Lazer', 'gamepad', '#22c55e', 'expense'::transaction_type, true),
    (new.id, 'Compras', 'shopping-cart', '#14b8a6', 'expense'::transaction_type, true),
    (new.id, 'Saúde', 'heart', '#06b6d4', 'expense'::transaction_type, true),
    (new.id, 'Educação', 'graduation-cap', '#0ea5e9', 'expense'::transaction_type, true),
    (new.id, 'Fatura do Cartão', 'credit-card', '#8b5cf6', 'expense'::transaction_type, true),
    (new.id, 'Outros', 'package', '#6366f1', 'expense'::transaction_type, true);
  
  INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (new.id, 'Salário', 'dollar-sign', '#22c55e', 'income'::transaction_type, true),
    (new.id, 'Freelance', 'briefcase', '#10b981', 'income'::transaction_type, true),
    (new.id, 'Investimentos', 'trending-up', '#14b8a6', 'income'::transaction_type, true),
    (new.id, 'Vendas', 'tag', '#06b6d4', 'income'::transaction_type, true),
    (new.id, 'Outros', 'wallet', '#0ea5e9', 'income'::transaction_type, true);
  
  RETURN new;
END;
$function$;

-- 5. Set categoria_id to "Fatura do Cartão" for all existing compras
UPDATE compras_cartao cc
SET categoria_id = c.id
FROM categories c
WHERE c.user_id = cc.user_id
  AND c.name = 'Fatura do Cartão';

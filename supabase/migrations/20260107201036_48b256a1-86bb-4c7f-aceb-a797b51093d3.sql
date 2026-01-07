-- Atualizar categorias existentes: emojis -> ícones Lucide
UPDATE categories SET icon = 'utensils' WHERE icon = '🍔';
UPDATE categories SET icon = 'car' WHERE icon = '🚗';
UPDATE categories SET icon = 'home' WHERE icon = '🏠';
UPDATE categories SET icon = 'zap' WHERE icon = '💡';
UPDATE categories SET icon = 'gamepad' WHERE icon = '🎮';
UPDATE categories SET icon = 'shopping-cart' WHERE icon = '🛒';
UPDATE categories SET icon = 'heart' WHERE icon = '💊';
UPDATE categories SET icon = 'graduation-cap' WHERE icon = '📚';
UPDATE categories SET icon = 'package' WHERE icon = '📦';
UPDATE categories SET icon = 'dollar-sign' WHERE icon = '💰';
UPDATE categories SET icon = 'briefcase' WHERE icon = '💼';
UPDATE categories SET icon = 'trending-up' WHERE icon = '📈';
UPDATE categories SET icon = 'tag' WHERE icon = '🏷️';
UPDATE categories SET icon = 'wallet' WHERE icon = '💵';

-- Atualizar função do trigger para novos usuários
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Categorias de Despesas
  INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (new.id, 'Alimentação', 'utensils', '#ef4444', 'expense', true),
    (new.id, 'Transporte', 'car', '#f97316', 'expense', true),
    (new.id, 'Moradia', 'home', '#eab308', 'expense', true),
    (new.id, 'Contas', 'zap', '#84cc16', 'expense', true),
    (new.id, 'Lazer', 'gamepad', '#22c55e', 'expense', true),
    (new.id, 'Compras', 'shopping-cart', '#14b8a6', 'expense', true),
    (new.id, 'Saúde', 'heart', '#06b6d4', 'expense', true),
    (new.id, 'Educação', 'graduation-cap', '#0ea5e9', 'expense', true),
    (new.id, 'Outros', 'package', '#6366f1', 'expense', true);
  
  -- Categorias de Receitas
  INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (new.id, 'Salário', 'dollar-sign', '#22c55e', 'income', true),
    (new.id, 'Freelance', 'briefcase', '#10b981', 'income', true),
    (new.id, 'Investimentos', 'trending-up', '#14b8a6', 'income', true),
    (new.id, 'Vendas', 'tag', '#06b6d4', 'income', true),
    (new.id, 'Outros', 'wallet', '#0ea5e9', 'income', true);
  
  RETURN new;
END;
$function$;
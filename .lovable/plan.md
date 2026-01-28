
# Plano: Corrigir Ícones Exibidos como Texto na Visão Geral

## Problema Identificado

Na página `/reports` (Visão Geral), as seções:
- **Detalhamento por Categoria**
- **Maiores Transações do Período**

Estão exibindo os ícones como texto (ex: "credit-card", "wallet", "car", "piggy-bank") em vez de renderizar os componentes Lucide correspondentes.

## Causa Raiz

O código atual simplesmente renderiza `{category.icon}` e `{transaction.category?.icon}` diretamente, que são **strings** vindas do banco de dados, não componentes React.

## Solução

Aplicar o mesmo padrão já utilizado em `RelatorioCategorias.tsx`:
1. Criar um mapeamento `ICON_MAP` de strings para componentes Lucide
2. Criar função helper `getIconComponent()`
3. Usar o componente retornado para renderizar os ícones

## Alterações Necessárias

### Arquivo: `src/pages/Reports.tsx`

**1. Adicionar imports dos ícones Lucide (linha 10):**
```tsx
import { 
  FileText, Table, Wallet, TrendingUp, TrendingDown, Calendar,
  DollarSign, Briefcase, ShoppingCart, Home, Car, Utensils, 
  Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, 
  Book, Package, Zap, Tag, CreditCard, PiggyBank,
  type LucideIcon
} from 'lucide-react';
```

**2. Adicionar ICON_MAP após os imports (antes do MONTHS):**
```tsx
const ICON_MAP: Record<string, LucideIcon> = {
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
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
};

function getIconComponent(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Package;
  return ICON_MAP[iconName] || Package;
}
```

**3. Atualizar "Detalhamento por Categoria" (linhas 230-236):**
```tsx
// Antes
<div
  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
  style={{ backgroundColor: `${category.color}20` }}
>
  {category.icon}
</div>

// Depois
{(() => {
  const IconComp = getIconComponent(category.icon);
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: `${category.color}20` }}
    >
      <IconComp className="w-5 h-5" style={{ color: category.color }} />
    </div>
  );
})()}
```

**4. Atualizar "Maiores Transações do Período" (linhas 270-276):**
```tsx
// Antes
<div
  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
    transaction.type === 'income' ? 'gradient-income' : 'gradient-expense'
  }`}
>
  {transaction.category?.icon || '📦'}
</div>

// Depois
{(() => {
  const IconComp = getIconComponent(transaction.category?.icon);
  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        transaction.type === 'income' ? 'gradient-income' : 'gradient-expense'
      }`}
    >
      <IconComp className="w-5 h-5 text-white" />
    </div>
  );
})()}
```

## Resultado Esperado

- Os ícones serão renderizados como componentes Lucide reais em vez de texto
- Mesma aparência e comportamento da página "Por Categoria"
- Ícones com cores corretas baseadas na categoria
- Fallback para `Package` quando o ícone não for reconhecido

## Consistência

Esta alteração garante que ambas as páginas de relatórios (Visão Geral e Por Categoria) usem o mesmo sistema de mapeamento de ícones, mantendo consistência visual em todo o módulo.

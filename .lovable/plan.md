

# Fix: Skeletons invisíveis nos cards de Transações

## Problema

Os skeletons nos cards com fundo gradiente (Receitas e Despesas) usam a cor padrão `bg-muted` que se confunde com o fundo do card, tornando-os praticamente invisíveis. O mesmo pode acontecer nos cards secundários dependendo do tema.

## Solução

Adicionar classes de cor específicas aos Skeletons dentro dos componentes `StatCardPrimary` e `StatCardSecondary` para que contrastem com o fundo de cada tipo de card.

## Alterações

### 1. `src/components/dashboard/StatCardPrimary.tsx`

Adicionar um mapa de cores de skeleton por tipo e aplicar nos Skeletons:

```typescript
const skeletonClasses = {
  income: "bg-emerald-200/60 dark:bg-emerald-800/40",
  expense: "bg-rose-200/60 dark:bg-rose-800/40",
  neutral: "bg-slate-200/60 dark:bg-slate-700/40",
};

// Uso:
<Skeleton className={cn("h-7 w-28 sm:h-9 sm:w-36", skeletonClasses[type])} />
<Skeleton className={cn("h-3 w-20 mt-1 sm:mt-2", skeletonClasses[type])} />
```

### 2. `src/components/dashboard/StatCardSecondary.tsx`

Adicionar cores de skeleton por status para melhor contraste:

```typescript
const skeletonClasses = {
  pending: "bg-blue-200/50 dark:bg-blue-800/30",
  warning: "bg-amber-200/50 dark:bg-amber-800/30",
  danger: "bg-red-200/50 dark:bg-red-800/30",
  info: "bg-purple-200/50 dark:bg-purple-800/30",
  success: "bg-emerald-200/50 dark:bg-emerald-800/30",
  neutral: "bg-slate-200/50 dark:bg-slate-700/30",
};

// Uso:
<Skeleton className={cn("h-5 w-24 sm:h-6 sm:w-28", skeletonClasses[status])} />
<Skeleton className={cn("h-3 w-16 mt-1", skeletonClasses[status])} />
```

### Resultado

- Skeletons visíveis em todos os cards, com cores que contrastam com o fundo gradiente
- Mantém a consistência visual (skeleton com tonalidade da cor do card)
- Funciona tanto no tema claro quanto no escuro

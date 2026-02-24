

# Skeleton Loading ao navegar entre meses no Dashboard

## Problema

Ao trocar de mes usando os botoes de navegacao, os cards do dashboard mostram "R$ 0,00" brevemente enquanto os dados carregam, causando um flash visual desagradavel (como mostrado na screenshot).

## Solucao

Adicionar uma prop `isLoading` aos componentes de cards e ao banner, e no Dashboard usar `isFetching` dos hooks de query para acionar o skeleton. Quando `isFetching` for true, os componentes exibem Skeleton em vez dos valores.

## Alteracoes

### 1. `src/components/dashboard/StatCardPrimary.tsx`

Adicionar prop opcional `isLoading?: boolean`. Quando true, substituir o valor formatado e o subInfo por componentes `<Skeleton />`:

```typescript
// No lugar do valor:
isLoading ? <Skeleton className="h-7 w-28 sm:h-9 sm:w-36" /> : <p ...>{formatCurrency(value)}</p>

// No lugar do subInfo:
isLoading ? <Skeleton className="h-3 w-20 mt-1" /> : subInfo
```

### 2. `src/components/dashboard/StatCardSecondary.tsx`

Mesma abordagem - prop `isLoading?: boolean`. Quando true, substituir valor e subInfo por Skeleton:

```typescript
isLoading ? <Skeleton className="h-5 w-24 sm:h-6 sm:w-28" /> : <p ...>{prefix}{formatCurrency(value)}</p>
isLoading ? <Skeleton className="h-3 w-16 mt-1" /> : <p ...>{subInfo}</p>
```

### 3. `src/components/dashboard/EstimatedBalanceBanner.tsx`

Prop `isLoading?: boolean`. Substituir o valor central por Skeleton com fundo semi-transparente para combinar com o fundo escuro:

```typescript
isLoading ? <Skeleton className="h-8 w-40 sm:h-10 sm:w-48 bg-white/10" /> : <p ...>{formatCurrency(value)}</p>
```

### 4. `src/components/dashboard/PieChartWithLegend.tsx`

Prop `isLoading?: boolean`. Quando true, exibir skeletons no lugar do grafico (circulo skeleton + linhas de legenda skeleton).

### 5. `src/pages/Dashboard.tsx`

- Extrair `isFetching` de `useCompleteStats`:
  ```typescript
  const { data: completeStats, isFetching: isStatsFetching } = useCompleteStats(mesReferencia);
  ```
- Extrair `isFetching` de `useExpensesByCategory`:
  ```typescript
  const { data: expensesByCategory, isFetching: isCategoryFetching } = useExpensesByCategory(...);
  ```
- Passar `isLoading={isStatsFetching}` para todos os StatCardPrimary, StatCardSecondary e EstimatedBalanceBanner
- Passar `isLoading={isCategoryFetching}` para PieChartWithLegend
- Para o grafico de barras inline, usar skeleton condicional com `isLoading` de `useMonthlyData`

### Arquivos modificados

| Arquivo | Alteracao |
|---|---|
| `src/components/dashboard/StatCardPrimary.tsx` | Adicionar prop `isLoading`, renderizar Skeleton condicionalmente |
| `src/components/dashboard/StatCardSecondary.tsx` | Adicionar prop `isLoading`, renderizar Skeleton condicionalmente |
| `src/components/dashboard/EstimatedBalanceBanner.tsx` | Adicionar prop `isLoading`, Skeleton com estilo escuro |
| `src/components/dashboard/PieChartWithLegend.tsx` | Adicionar prop `isLoading`, Skeleton para grafico e legenda |
| `src/pages/Dashboard.tsx` | Extrair `isFetching` dos hooks e passar como `isLoading` aos componentes |

### Resultado

- Ao clicar nos botoes < > de navegacao de mes, todos os cards exibem skeletons animados imediatamente
- Nenhum valor "R$ 0,00" visivel durante o carregamento
- Skeletons usam o componente `Skeleton` do shadcn/ui ja existente no projeto
- Animacao pulse padrao do Tailwind, consistente com o design system



# Skeleton Loading na página de Transações

## Problema

Ao navegar entre meses na página de Transações, os cards de resumo (Receitas, Despesas, A Receber, A Pagar, Saldo Real, Estimado) e o card de Saldo Inicial mostram "R$ 0,00" enquanto os dados carregam, igual ao bug que já foi corrigido no Dashboard.

## Solução

Usar o `isFetching` já disponível nos hooks e passar `isLoading` para os componentes `StatCardPrimary` e `StatCardSecondary` (que já suportam essa prop desde a implementação anterior). Também adicionar skeleton ao card de Saldo Inicial.

## Alterações

### 1. `src/pages/Transactions.tsx`

**a) Extrair `isFetching` do `useCompleteStats` (linha 264):**

```typescript
const { data: stats, isFetching: isStatsFetching } = useCompleteStats(dataInicial);
```

**b) Adicionar `isLoading` aos StatCardPrimary (linhas 915-930):**

```typescript
<StatCardPrimary
  title="Receitas"
  value={stats?.completedIncome || 0}
  icon={TrendingUp}
  type="income"
  isLoading={isStatsFetching}
  ...
/>
<StatCardPrimary
  title="Despesas"
  value={stats?.completedExpense || 0}
  icon={TrendingDown}
  type="expense"
  isLoading={isStatsFetching}
  ...
/>
```

**c) Adicionar `isLoading` aos StatCardSecondary (linhas 931-965):**

Passar `isLoading={isStatsFetching}` para os 4 cards: A Receber, A Pagar, Saldo Real e Estimado.

**d) Adicionar skeleton ao card de Saldo Inicial (linhas 878-911):**

Substituir os valores de "Saldo Inicial" e "Em Metas" por `<Skeleton />` quando `isStatsFetching` for true, para manter consistência visual com os demais cards.

### Resultado

- Todos os valores na página de Transações mostram skeleton animado durante o carregamento
- Nenhum "R$ 0,00" visível durante a transição entre meses
- Usa os mesmos componentes e props já implementados no Dashboard

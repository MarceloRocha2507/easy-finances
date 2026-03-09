

## Padronização de Loading e Performance dos Cards

### Problema Atual
1. O card "Assinaturas" usa `isAssinaturasLoading` (query separada), enquanto os demais usam `isStatsFetching` — causando loading dessincronizado
2. `useCompleteStats` não tem `staleTime`, fazendo re-fetch a cada re-render/navegação de aba
3. `useAssinaturas` também não tem `staleTime`

### Correções

**1. `src/hooks/useTransactions.ts` — Adicionar `staleTime` ao `useCompleteStats`**
- Adicionar `staleTime: 1000 * 60 * 2` (2 min) e `gcTime: 1000 * 60 * 10` (10 min cache) na query `complete-stats`
- Isso evita re-fetch ao navegar entre abas ou re-renders

**2. `src/hooks/useAssinaturas.ts` — Adicionar `staleTime` à query de assinaturas**
- Adicionar `staleTime: 1000 * 60 * 2` e `gcTime: 1000 * 60 * 10`
- Dados só serão re-buscados após mutação (invalidação) ou após 2 min

**3. `src/pages/Transactions.tsx` — Unificar loading do card Assinaturas**
- Trocar `isLoading: isAssinaturasLoading` por `isLoading: isStatsFetching || isAssinaturasLoading` para que o skeleton do card Assinaturas acompanhe o mesmo ciclo dos demais
- Usar `isFetching` no lugar de `isLoading` para assinaturas (consistente com os outros cards que usam `isFetching`)

**4. `src/hooks/useTransactions.ts` — Adicionar `staleTime` às queries `useTransactionStats`, `useExpensesByCategory`, `useMonthlyData`**
- As queries de `useTransactionStats` e `useExpensesByCategory` já têm `staleTime: 1000 * 30` (30s) — aumentar para `1000 * 60 * 2` para consistência
- `useMonthlyData` já tem `staleTime: 1000 * 30` — aumentar para `1000 * 60 * 2`

### Resultado
- Todos os cards carregam/mostram skeleton de forma sincronizada
- Dados ficam em cache por 2 min, evitando re-fetch desnecessário em navegação entre abas
- Mutações (criar/editar/excluir) continuam invalidando o cache normalmente via `invalidateTransactionCaches`


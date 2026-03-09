

## Lixeira de Transações — Soft Delete + Restauração

### 1. Migração: Adicionar coluna `deleted_at` na tabela `transactions`

```sql
ALTER TABLE public.transactions ADD COLUMN deleted_at timestamptz DEFAULT NULL;
```

Transações com `deleted_at IS NOT NULL` são consideradas "excluídas" (soft delete).

### 2. Filtrar transações excluídas em TODAS as queries

Adicionar `.is('deleted_at', null)` em todas as queries da tabela `transactions` em `src/hooks/useTransactions.ts`:

- `useTransactions` (linha 121)
- `useTransactionStats` (linha 171)
- `usePendingStats` (linha 871)
- `useTransactionsWithBalance` — query de allCompleted (linha 921) e query filtrada (linha 974)
- `useCompleteStats` — allCompleted (linha 1073), completedDoMes (linha 1092), pendingDoMes (linha 1103)
- `useExpensesByCategory` e `useMonthlyData` (precisam ser verificados, mas seguem o mesmo padrão)

### 3. Alterar `useDeleteTransaction` para soft delete

Em vez de `.delete()`, fazer `.update({ deleted_at: new Date().toISOString() })`.

### 4. Alterar `useDeleteRecurringTransactions` para soft delete

Substituir todas as chamadas `.delete()` por `.update({ deleted_at: new Date().toISOString() })`.

### 5. Novo hook: `useDeletedTransactions`

Em `src/hooks/useTransactions.ts`, adicionar:

- `useDeletedTransactions()` — busca transações com `deleted_at IS NOT NULL`, incluindo category join
- `useRestoreTransaction()` — mutation que faz `.update({ deleted_at: null })` e invalida caches
- `usePermanentDeleteTransaction()` — mutation que faz `.delete()` real
- `useEmptyTrash()` — mutation que deleta todas as transações com `deleted_at IS NOT NULL`

### 6. Componente: `LixeiraDialog`

Criar `src/components/transactions/LixeiraDialog.tsx`:

- Dialog acessível via botão com ícone de lixeira na página de Transações
- Lista transações excluídas com: descrição, valor, categoria, data original, data de exclusão
- Botão "Restaurar" por item
- Botão "Excluir permanentemente" por item (com confirmação AlertDialog)
- Botão "Esvaziar lixeira" no topo (com confirmação AlertDialog)
- Empty state quando não há itens

### 7. Integrar na página `Transactions.tsx`

- Adicionar botão "Lixeira" (ícone Trash2) ao lado dos filtros/ações existentes
- Badge com contagem de itens na lixeira

### Impacto nos saldos

Como todas as queries já filtrarão `deleted_at IS NULL`, transações na lixeira automaticamente deixam de ser contabilizadas nos cards de Receitas, Despesas, Saldo Real e Estimado. Ao restaurar, a invalidação de cache recalcula tudo.


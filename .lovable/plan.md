
# Correção: Atualização Automática da Lista de Transações

## Problema Identificado

A página de Transações usa o hook `useTransactionsWithBalance` que tem a query key:
```typescript
queryKey: ['transactions-with-balance', user?.id, filters]
```

Porém, as mutations (`useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`, `useMarkAsPaid`) invalidam apenas:
```typescript
queryClient.invalidateQueries({ queryKey: ['transactions'] });
```

Isso **não** invalida `['transactions-with-balance']`, fazendo com que a lista não atualize automaticamente após criar/editar/deletar transações.

## Solução

Adicionar `['transactions-with-balance']` na lista de query keys invalidadas em todas as mutations de transação.

## Alterações Técnicas

**Arquivo:** `src/hooks/useTransactions.ts`

### 1. useCreateTransaction (linha 253)

Adicionar após a linha 253:
```typescript
queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
```

### 2. useCreateInstallmentTransaction (linha 368)

Adicionar após a linha 368:
```typescript
queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
```

### 3. useUpdateTransaction (linha 413)

Adicionar após a linha 413:
```typescript
queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
```

### 4. useDeleteTransaction (linha 448)

Adicionar após a linha 448:
```typescript
queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
```

### 5. useMarkAsPaid (linha 490)

Adicionar após a linha 490:
```typescript
queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
```

## Resumo das Modificações

| Hook | Linha | Alteração |
|------|-------|-----------|
| `useCreateTransaction` | 253 | Adicionar invalidação de `transactions-with-balance` |
| `useCreateInstallmentTransaction` | 368 | Adicionar invalidação de `transactions-with-balance` |
| `useUpdateTransaction` | 413 | Adicionar invalidação de `transactions-with-balance` |
| `useDeleteTransaction` | 448 | Adicionar invalidação de `transactions-with-balance` |
| `useMarkAsPaid` | 490 | Adicionar invalidação de `transactions-with-balance` |

## Fluxo Após Correção

```text
Usuário adiciona transação
         ↓
  Mutation executa
         ↓
  onSuccess dispara
         ↓
  Invalidar queries:
  ├─ ['transactions']
  ├─ ['transactions-with-balance'] ← NOVO
  ├─ ['transaction-stats']
  ├─ ['expenses-by-category']
  ├─ ['monthly-data']
  ├─ ['complete-stats']
  └─ ['dashboard-completo']
         ↓
  React Query refetch automático
         ↓
  Lista atualiza instantaneamente ✓
```

## Resultado Esperado

- Ao adicionar receita/despesa: lista atualiza automaticamente
- Ao editar transação: lista reflete mudanças imediatamente  
- Ao excluir transação: item some da lista sem recarregar
- Ao marcar como pago: status atualiza em tempo real

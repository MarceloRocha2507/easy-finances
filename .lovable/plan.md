

## Problema

Quando uma transacao e adicionada/editada/removida, a funcao `invalidateTransactionCaches` marca as queries `complete-stats` e `dashboard-completo` como stale com `refetchType: 'none'` (linha 59-60 de `useTransactions.ts`). Isso significa que os dados so sao rebuscados quando o componente remonta — mas como o Dashboard ja esta montado, os cards nao atualizam.

## Solucao

Alterar `refetchType: 'none'` para `refetchType: 'active'` nas duas queries pesadas. Isso faz com que, se o Dashboard estiver visivel (queries ativas), elas sejam refetchadas imediatamente. Se o usuario estiver em outra pagina, os dados ficam apenas marcados como stale (sem fetch desnecessario).

## Alteracao

**Arquivo: `src/hooks/useTransactions.ts`** (linhas 59-60)

```typescript
// Antes:
queryClient.invalidateQueries({ queryKey: ['complete-stats'], refetchType: 'none' });
queryClient.invalidateQueries({ queryKey: ['dashboard-completo'], refetchType: 'none' });

// Depois:
queryClient.invalidateQueries({ queryKey: ['complete-stats'], refetchType: 'active' });
queryClient.invalidateQueries({ queryKey: ['dashboard-completo'], refetchType: 'active' });
```

`refetchType: 'active'` refetcha apenas queries que tem observers ativos (componentes montados usando esses dados). E o comportamento padrao do `invalidateQueries` — seguro e sem overhead extra.




# Performance Fix: Slow UI Updates After Mutations

## Problem
When you update a transaction (or any record), the system takes too long to reflect changes because:

1. Each mutation triggers **7 separate cache invalidations** simultaneously
2. Two of those queries -- `complete-stats` and `dashboard-completo` -- are extremely heavy, each making **8+ sequential database calls**
3. These two queries overlap significantly, querying the same tables redundantly
4. The QueryClient has no default `staleTime`, so every invalidation immediately triggers a full refetch

## Solution

### 1. Add default staleTime to QueryClient
**File:** `src/App.tsx`

Configure the QueryClient with a default `staleTime` of 30 seconds. This prevents queries that were just fetched from being refetched unnecessarily when multiple invalidations fire.

### 2. Batch invalidations with a single helper
**File:** `src/hooks/useTransactions.ts`

Create a helper function `invalidateTransactionCaches(queryClient)` that consolidates all 7 invalidation calls. Instead of calling them sequentially, use `Promise.all()` and add `{ refetchType: 'none' }` to heavy queries, then only actively refetch the lightweight ones. This prevents `complete-stats` and `dashboard-completo` from refetching until the user actually looks at them.

### 3. Add staleTime to transaction queries that lack it
**File:** `src/hooks/useTransactions.ts`

Add `staleTime: 1000 * 30` (30 seconds) to the main `useTransactions`, `useTransactionStats`, `useExpensesByCategory`, and `useMonthlyData` queries. This prevents duplicate refetches during the invalidation cascade.

### 4. Add staleTime to complete-stats
**File:** `src/hooks/useTransactions.ts`

The `useCompleteStats` query currently has **no staleTime**, so it refetches on every invalidation. Add `staleTime: 1000 * 60 * 2` (2 minutes) to match `dashboard-completo`.

---

## Technical Details

### Changes to `src/App.tsx` (line 48)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds default
      refetchOnWindowFocus: false,
    },
  },
});
```

### Changes to `src/hooks/useTransactions.ts`

**New helper function** (used by all 6 mutation hooks):
```typescript
function invalidateTransactionCaches(queryClient: ReturnType<typeof useQueryClient>) {
  // Lightweight queries: refetch immediately
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
  queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
  queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
  queryClient.invalidateQueries({ queryKey: ['transactions-with-balance'] });
  
  // Heavy queries: mark stale but don't refetch until accessed
  queryClient.invalidateQueries({ 
    queryKey: ['complete-stats'], 
    refetchType: 'none' 
  });
  queryClient.invalidateQueries({ 
    queryKey: ['dashboard-completo'], 
    refetchType: 'none' 
  });
}
```

This change alone will drastically cut update time -- the two heaviest queries (which make 8+ DB calls each) will only refetch when the user navigates to a page that needs them, instead of blocking the UI immediately.

**Add staleTime** to `useCompleteStats`:
```typescript
staleTime: 1000 * 60 * 2, // 2 minutes
```

### Mutations updated
All 6 mutation hooks (`useCreateTransaction`, `useCreateInstallmentTransaction`, `useUpdateTransaction`, `useDeleteTransaction`, `useDeleteRecurringTransaction`, `useMarkAsPaid`) will use the new `invalidateTransactionCaches` helper instead of 7 individual calls.

## Expected Impact
- Immediate UI update for transaction list (the lightweight query)
- Heavy dashboard stats only refetch when the user views them
- No redundant refetches within the 30-second stale window
- Overall perceived update time drops from several seconds to under 1 second


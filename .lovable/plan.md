

## Plan: Fix paid invoices appearing as recent transactions

### Problem
`FaturaVirtual` objects are created with `created_at: new Date().toISOString()` (always the current timestamp). The sort function uses `created_at` descending for non-future items, so all virtual invoices — including ones paid weeks ago — always appear at the top of the list.

### Fix

**File: `src/pages/Transactions.tsx` (lines 446-458)**

Update the sort logic to use `date` (the due/payment date) for `FaturaVirtual` items instead of `created_at`:

```tsx
const sortedTransactions = useMemo(() => {
  return [...activeTransactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    const now = Date.now();
    const aFuture = dateA > now;
    const bFuture = dateB > now;
    if (aFuture !== bFuture) return aFuture ? 1 : -1;
    if (aFuture && bFuture) return dateA - dateB;

    // For paid faturas, use dataPagamento or date instead of created_at
    const sortDateA = 'isFaturaCartao' in a && (a as FaturaVirtual).paga
      ? new Date((a as FaturaVirtual).dataPagamento || a.date).getTime()
      : new Date(a.created_at).getTime();
    const sortDateB = 'isFaturaCartao' in b && (b as FaturaVirtual).paga
      ? new Date((b as FaturaVirtual).dataPagamento || b.date).getTime()
      : new Date(b.created_at).getTime();

    return sortDateB - sortDateA;
  });
}, [activeTransactions]);
```

This ensures paid invoices sort by their actual payment date (or due date), placing them chronologically among other transactions instead of always at the top.

### Single file change
- `src/pages/Transactions.tsx` — sort comparator only


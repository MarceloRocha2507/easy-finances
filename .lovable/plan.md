

## Plan: Fix "Despesas" card to include credit card invoice payments

### Problem
The "Despesas" card on the Transactions page shows R$ 1,147.09 but excludes the R$ 1,427.50 credit card invoice payment. This happens because the calculation at line 1256 of `useTransactions.ts` filters out transactions with the "Fatura do Cartão" category to avoid double-counting with `parcelas_cartao` installments.

However, on the Transactions page, the "Despesas pagas" card should reflect **actual cash outflow** — money that left your bank account — which includes credit card invoice payments.

### Solution

**File: `src/hooks/useTransactions.ts` (useCompleteStats hook, ~line 1237-1260)**

Add a new field `completedExpenseWithFatura` to the stats object that includes all completed expenses (including "Fatura do Cartão" payments). The existing `completedExpense` field stays unchanged to preserve the Dashboard behavior.

```tsx
// New field in stats object:
completedExpenseWithFatura: 0,  // Includes credit card invoice payments

// In the completedDoMes loop:
if (!isMetaCategory) {
  if (t.type === 'expense') stats.completedExpenseWithFatura += amount;
  if (!isFaturaCartao) {
    if (t.type === 'income') stats.completedIncome += amount;
    else stats.completedExpense += amount;
  }
}
```

**File: `src/pages/Transactions.tsx` (~line 1276)**

Update the "Despesas" card to use the new field:

```tsx
<StatCardMinimal
  title="Despesas"
  value={stats?.completedExpenseWithFatura || 0}
  ...
/>
```

### Why not just remove the filter?
The `completedExpense` field (without "Fatura do Cartão") is still needed by the Dashboard's "Resultado do Mês" calculation and the estimated balance formula, where including it would cause double-counting with `faturaCartao` from `parcelas_cartao`. Adding a separate field keeps both use cases correct.

### Files changed
- `src/hooks/useTransactions.ts` — add `completedExpenseWithFatura` field
- `src/pages/Transactions.tsx` — use new field in "Despesas" card




## Plan: Include paid invoices in the "referente apenas a este mês" value

### Problem
The secondary value under "Estimado" on the Transactions page (highlighted in red in the screenshot) calculates the monthly net result as:

```
completedIncome + pendingIncome - completedExpense - pendingExpense - faturaCartao
```

- `completedExpense` excludes invoice payment transactions
- `faturaCartao` only includes **unpaid** installments from `parcelas_cartao`

Result: paid credit card invoices are not counted at all in this value.

### Fix
Replace `completedExpense` with `completedExpenseWithFatura` in the formula. This field already includes paid invoices (via the reconciliation logic implemented earlier). The `faturaCartao` stays as-is since it only covers unpaid invoices.

**New formula:**
```
completedIncome + pendingIncome - completedExpenseWithFatura - pendingExpense - faturaCartao
```

### File changed
- `src/pages/Transactions.tsx` — line 1312: swap `completedExpense` → `completedExpenseWithFatura`


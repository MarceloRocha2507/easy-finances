

## Plan: Show only PAID invoice values in "Despesas" card

### Problem
Currently, `completedExpenseWithFatura` includes both paid AND unpaid credit card installments (`faturaViaParcelasPagas + faturaCartaoTitular`). The user wants only **paid** invoice amounts to appear in the Despesas card — unpaid invoices should remain in "Total a Pagar" / "faturaCartao" only.

### Root cause (line 1278 of `useTransactions.ts`)
```typescript
// Current — includes unpaid installments (faturaCartaoTitular)
const faturaTotalParcelas = faturaViaParcelasPagas + faturaCartaoTitular;
```

### Fix
Change to only use paid parcels:
```typescript
const faturaTotalParcelas = faturaViaParcelasPagas;
```

This ensures `faturaConsolidada = Math.max(faturaViaTransacao, faturaViaParcelasPagas)` — only counting invoices that were actually paid, matching the "saída de caixa real" concept.

### Impact
- **Despesas card** (Dashboard + Transactions): will only include invoice amounts marked as paid
- **Total a Pagar card**: unchanged — still shows unpaid invoices via `faturaCartao`
- **Resultado do Mês**: uses `completedExpenseWithFatura`, so it also corrects to reflect only realized expenses
- **Estimado secondary value**: also uses this field, stays consistent

### File changed
- `src/hooks/useTransactions.ts` — line 1278: remove `faturaCartaoTitular` from `faturaTotalParcelas`


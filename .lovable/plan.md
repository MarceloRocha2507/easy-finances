

## Plan: Replace "A Pagar" card with TotalAPagarCard on Transactions page

The current "A Pagar" card on the Transactions page only shows pending expenses (excluding credit card invoices). The user wants it to include all obligations — pending transactions + unpaid credit card invoices — with the expandable modal, exactly like the Dashboard.

### Changes

**File: `src/pages/Transactions.tsx`**

1. Import `TotalAPagarCard` from `@/components/dashboard`
2. Replace the `StatCardMinimal` for "A Pagar" (lines 1264-1272) with a `TotalAPagarCard` component, passing a `mesReferencia` derived from `dataInicial` (the selected month filter)
3. Wrap it in a div to maintain grid alignment with the other stat cards

The `TotalAPagarCard` already:
- Sums pending transactions + unpaid credit card invoices
- Shows a click-to-expand modal listing all items grouped by "Contas pendentes" and "Fatura cartao"
- Uses the same visual style as the other minimal cards

### Technical detail

The `mesReferencia` prop will be derived from the existing `dataInicial` state (which defaults to `startOfMonth(new Date())`). Since `dataInicial` could be `undefined`, we'll fallback to `new Date()`.


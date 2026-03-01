

# Add Recurring Delete Confirmation Dialog

## Problem
When deleting a recurring income (or expense), the system deletes only the single record without asking the user whether they want to delete all occurrences or just the current month. The `useDeleteRecurringTransactions` hook already exists with `single` and `future` modes but is never used in the UI.

## Solution
Add a confirmation dialog specifically for recurring/installment transactions that offers two choices:
1. "Excluir apenas este mes" (delete only this month)
2. "Excluir este e todos os seguintes" (delete this and all future)

For non-recurring transactions, keep the current simple delete behavior.

## Changes

### File: `src/pages/Transactions.tsx`

**1. Import `useDeleteRecurringTransactions`**
- Add it to the existing import from `useTransactions`

**2. Add state for recurring delete dialog**
- `recurringDeleteId: string | null` -- tracks which transaction is being considered for deletion
- `recurringDeleteOpen: boolean` -- controls dialog visibility

**3. Update `handleDelete` function**
- Before deleting, check if the transaction is recurring (`is_recurring` or `tipo_lancamento === 'fixa'` or `tipo_lancamento === 'parcelada'`)
- If recurring: open the new dialog instead of deleting immediately
- If not recurring: delete as before

**4. Add the recurring delete dialog**
- An `AlertDialog` with three buttons:
  - "Cancelar"
  - "Excluir apenas este mes" -- calls `useDeleteRecurringTransactions` with `mode: 'single'`
  - "Excluir este e todos os seguintes" -- calls with `mode: 'future'`

**5. Update `TransactionRow` component**
- Pass the full transaction object to `onDelete` instead of just the `id`, so the parent can check `is_recurring` / `tipo_lancamento`
- Update the `onDelete` prop type from `(id: string) => void` to `(transaction: Transaction) => void`

### Technical Details

The `TransactionRow` component currently calls `onDelete(transaction.id)` in 3 places (mobile dropdown, desktop dropdown, and desktop AlertDialog). All will be updated to pass the full transaction. The parent `handleDelete` will inspect `transaction.is_recurring` or `transaction.tipo_lancamento` to decide whether to show the recurring dialog or delete directly.

The existing `useDeleteRecurringTransactions` hook handles all the backend logic (grouping by `parent_id`, date-based filtering) -- no backend changes needed.


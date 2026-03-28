

## Plan: Limited transaction display with "Ver todas" toggle

### Changes

**File: `src/pages/Transactions.tsx`**

1. **Add state for limit and expanded mode**:
   - `displayLimit`: number (5, 10, or 15), initialized from `localStorage` key `"txn_display_limit"`, default `10`
   - `showAll`: boolean, default `false` — toggles between limited and full view
   - Reset `showAll` to `false` when `activeTab`, `searchQuery`, or date filters change

2. **Add limit selector** next to the search bar (line ~1355-1365 area):
   - A `Select` dropdown with options: "Últimas 5", "Últimas 10", "Últimas 15"
   - On change: save to `localStorage`, update state, reset `showAll` to false
   - Visually compact (`h-9`, `w-[130px]`), aligned with the search input

3. **Apply limit to displayed transactions**:
   - Create `displayedTransactions` memo: when `showAll` is false, slice `sortedTransactions` to first `displayLimit` items; otherwise show all
   - For grouped view: flatten all group items, take first N from the sorted list, then re-group only those items — this ensures the limit applies across groups as requested
   - Replace references to `sortedTransactions` and `grupos` in the rendering section with the limited versions

4. **Add "Ver todas" / "Ver menos" button** after the transaction list (after line ~1461):
   - When limited and there are more items: show centered `Button` variant="ghost" with text `Ver todas as transações (X)` where X = total count
   - When expanded: show `Ver menos` button to collapse back
   - Button only visible when total > displayLimit

### Visual layout
```text
[Todos 31] [Receitas 13] [Despesas 18] [Pendentes] [Fixas]   🔍 Buscar...   [Últimas 10 ▾]

— transaction groups/items (limited to N) —

              [ Ver todas as transações (31) ]
```

### Persistence
- `localStorage.setItem("txn_display_limit", value)` on change
- `localStorage.getItem("txn_display_limit")` on init with fallback to `10`


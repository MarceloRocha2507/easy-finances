

## Plan: Add "só este mês" secondary value to the Estimado card

The "Estimado" card currently shows the accumulated estimated balance (`saldoDisponivel + pendingIncome - pendingExpense - faturaCartao`). The user wants a secondary line showing only the current month's net result.

### Calculation

The month-only value = `completedIncome + pendingIncome - completedExpense - pendingExpense - faturaCartao`

All these values already exist in the `stats` object from `useCompleteStats` — they represent only the selected month's data (not accumulated).

### Changes

**File: `src/pages/Transactions.tsx`**

Replace the `StatCardMinimal` for "Estimado" with an updated `subInfo` that includes the monthly-only value:

```tsx
<StatCardMinimal
  title="Estimado"
  value={stats?.estimatedBalance || 0}
  icon={Info}
  subInfo={
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-[#6B7280]">
        {formatCurrency(
          (stats?.completedIncome || 0) + (stats?.pendingIncome || 0)
          - (stats?.completedExpense || 0) - (stats?.pendingExpense || 0)
          - (stats?.faturaCartao || 0)
        )}{" "}
        <span className="text-[#9CA3AF]">só este mês</span>
      </span>
      <span>real + a receber - a pagar</span>
    </div>
  }
  delay={0.25}
  isLoading={isStatsFetching}
/>
```

The secondary value uses a smaller font and muted color, all within the existing card — no new components needed.


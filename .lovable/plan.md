

## Plan: Previsão de Quitação de Parcelas

Add an installment payoff forecast section to the existing Parcelamentos page (`src/pages/cartoes/Parcelamentos.tsx`). This reuses the data already fetched on that page (only titular parcelas) and adds a chart + summary below the existing content.

### Changes

**File: `src/pages/cartoes/Parcelamentos.tsx`**

1. Import `BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid` from recharts and `CalendarCheck, TrendingDown` from lucide-react
2. Add a `useMemo` block that computes forecast data from `parcelamentosFiltrados`:
   - For each parcelamento, iterate its remaining parcelas and accumulate `valorParcela` per future month (using `proximaParcela` as starting point and incrementing monthly)
   - Only include type `"parcelado"` (skip `"fixo"` since those have no end date)
   - Result: `{ mes: string, label: string, total: number }[]` sorted chronologically
   - Derive `dataQuitacao` (last month with value) and `totalComprometido`
3. Add a new section after the parcelamentos list with:
   - **Highlight card**: "Quitação total" showing the estimated month/year when all installments end, plus total remaining amount
   - **Bar chart**: Monthly committed values using `#111827` bars, `formatCurrency` on Y-axis, month labels on X-axis, 220px height
   - **Monthly breakdown list**: Each month as a row showing label + total value, with subtle visual indication of decreasing amounts

### Visual approach
- Follows existing design system: white cards with 1px border, `#111827` for bars, muted axis text
- Chart tooltip matches the pattern from `GastosDiarios` (popover style)
- Section only renders when there are parcelados with remaining installments
- The highlight card uses a `CalendarCheck` icon with green accent for the quitação date

### Data flow
No new API calls needed. The existing query already fetches all parcelas per compra with `numero_parcela`, `total_parcelas`, `paga`, and `mes_referencia`. The forecast computation uses `parcelasRestantes` and `proximaParcela` from each `Parcelamento` object to project future months.


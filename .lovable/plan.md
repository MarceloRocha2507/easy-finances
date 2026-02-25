

# Redesign: Saldo Estimado do Mes

Replace the dark gradient hero banner with a clean, inline summary card that matches the rest of the dashboard grid.

## Changes in `src/components/dashboard/EstimatedBalanceBanner.tsx`

Full rewrite of the component layout:

**Remove:**
- Dark gradient background (`bg-gradient-to-r from-slate-800...`)
- Centered icon box (16x16 rounded box with TrendingUp)
- `shadow-lg`, `border-0`
- Neon emerald/rose colors (`text-emerald-400`, `text-rose-400`)
- Centered text layout

**New structure:**
```
[Card: white bg, 1px border #E5E7EB, rounded-xl, subtle shadow]
  Row (flex, justify-between, items-center):
    Left side:
      - Label: "Saldo Estimado do Mes" in text-[13px] text-[#6B7280]
        with inline HelpCircle icon (16px, #9CA3AF) + tooltip
      - Value: text-2xl font-bold, #16A34A if positive, #DC2626 if negative
    Right side (hidden on mobile, visible sm+):
      - Formula: "saldo real + receitas pendentes
        - despesas pendentes - cartao"
        in text-[11px] text-[#9CA3AF], text-right, stacked lines
```

**Styling details:**
- Card: `bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]`
- Padding: `p-4 sm:p-5`
- No icon box, no dark backgrounds, no gradients
- Value colors: `text-[#16A34A]` / `text-[#DC2626]` (matching other stat cards)
- Skeleton loader updated to use neutral background

No other files need changes -- the component is already imported and used in Dashboard.tsx with the same props.

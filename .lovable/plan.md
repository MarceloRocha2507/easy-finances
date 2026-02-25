

# Redesign: Parcelamentos Page

Rewrite the layout and styling of `src/pages/cartoes/Parcelamentos.tsx` to match the premium fintech design system.

## Changes (single file: `src/pages/cartoes/Parcelamentos.tsx`)

### Summary cards
- Replace 3 separate `Card` components with a single unified white container (`bg-white border border-[#E5E7EB] rounded-xl`) using a `grid` with `divide-x` vertical dividers between columns
- Labels: 12px, `#6B7280`, with 16px stroke icons in `#9CA3AF`
- Values: `text-2xl font-bold text-[#111827]`

### Filter dropdowns
- Add explicit classes: `bg-white border-[#E5E7EB] text-[#374151] rounded-lg focus:border-[#111827] focus:ring-0 shadow-none`

### Badge ("Parcelado")
- Replace `<Badge>` with a plain `<span>` using: `bg-[#F3F4F6] text-[#374151] text-[11px] font-medium rounded-[6px] px-2 py-0.5`

### Installment list items
- Replace `<Card>` with plain `<div>` using: `bg-white border border-[#E5E7EB] rounded-[10px] p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]`
- Title: `font-bold text-[#111827]`
- Metadata (card name, responsavel): `text-[12px] text-[#6B7280]`, card icon `text-[#9CA3AF]`, dot separator `text-[#D1D5DB]`
- Right side: value `font-bold text-[#111827]`, total `text-[12px] text-[#6B7280]`, proxima `text-[11px] text-[#9CA3AF]`

### Progress bar
- Replace `<Progress>` component with a custom 4px bar (`h-1`)
- Track: `bg-[#F3F4F6] rounded-full`
- Fill color logic: under 50% = `#111827`, 50-80% = `#D97706`, above 80% = `#16A34A`

### Parcelas text
- "X/Y parcelas pagas" and "Restante" lines: `text-[12px] text-[#9CA3AF]`

### Empty state
- Plain `div` with `bg-white border border-[#E5E7EB] rounded-xl`, icon `text-[#9CA3AF]`

### Removed imports
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Button`, `Badge`, `Progress`, `AlertTriangle` (no longer used)


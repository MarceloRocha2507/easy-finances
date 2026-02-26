

# Redesign "Contas a Pagar" and "Comprometimento da Renda" — Premium Fintech Style

## Summary

Restyle both sections to match the clean, minimal fintech aesthetic: white backgrounds, neutral stroke icons, color only as signal, no decorative backgrounds or colored borders.

## Files modified

| File | Action |
|------|--------|
| `src/pages/Dashboard.tsx` | Restyle Comprometimento da Renda bar (lines 276-318) |
| `src/components/dashboard/ContasAPagar.tsx` | Full restyle of container, headers, rows, badges, footer |

## 1. Comprometimento da Renda (Dashboard.tsx)

Replace the current Card wrapper with a minimal row:
- Remove `Card`/`CardContent` wrapper — render as a simple `div` with `border-b border-[#E5E7EB] pb-4 mb-4`
- Label: `text-[13px] text-[#6B7280]`, icon `BarChart3` in `text-[#9CA3AF]`
- Percentage on right: `text-sm font-bold text-[#111827]` (always dark, no color coding)
- Progress bar: `h-1` (4px), track `bg-[#F3F4F6]`, fill `bg-[#111827]`, `rounded-full`
- Remove the colored bar logic and the red warning message below
- Keep the skeleton for loading state

## 2. ContasAPagar.tsx — Full Restyle

### Container
- Replace `Card` with a plain `div` using: `bg-white border border-[#E5E7EB] rounded-[12px] p-5 mb-4`
- Remove `CardHeader`/`CardContent` wrappers

### Section title (header)
- "Contas a Pagar" in `text-sm font-bold text-[#111827]` with `ClipboardList` icon in `w-4 h-4 text-[#9CA3AF]`
- Subtitle in `text-xs text-[#9CA3AF]` — "Compromissos pendentes de {mes}"
- "Ver todas" link: `text-xs text-[#6B7280] hover:text-[#111827]`, no button wrapper

### Sub-headers (Faturas de Cartao / Contas Pendentes accordion triggers)
- Replace emoji text with uppercase label: `text-[11px] uppercase tracking-[0.05em] text-[#9CA3AF] font-medium`
- No icons beside the label
- Bottom border `border-b border-[#F3F4F6]` on the trigger row
- Badge count and total value remain, styled in `text-xs text-[#9CA3AF]` and `text-sm font-semibold text-[#DC2626]`
- Chevron in `text-[#9CA3AF]`

### List rows (both faturas and contas)
- Remove yellow/red backgrounds and left colored borders entirely
- White background, separated by `border-b border-[#F9FAFB]`
- Hover: `hover:bg-[#F9FAFB]`
- Left icon: Replace emojis/colored CreditCard with a neutral stroke icon (`Receipt` for contas, `CreditCard` for faturas) — `w-4 h-4 text-[#9CA3AF]` inside a `w-7 h-7 bg-[#F3F4F6] rounded-[6px] flex items-center justify-center`
- Name: `text-sm font-semibold text-[#111827]`
- Category: `text-xs text-[#9CA3AF]`
- Due date: `text-xs text-[#9CA3AF]` (remove red/orange/yellow coloring — keep muted gray for all)
- Value: `text-sm font-bold text-[#DC2626]`
- Badge: minimal pill — overdue: `bg-[#FEE2E2] text-[#991B1B]`, pending: `bg-[#FEF3C7] text-[#92400E]` — `text-[11px] font-medium rounded-[6px] px-2 py-0.5`, no animate-pulse

### "Total em Cartoes" subtotal row (inside each collapsible)
- Remove — the total is already visible in the collapsed header

### Footer totals (Block 3)
- Top border: `border-t border-[#E5E7EB] pt-3 mt-3`
- Each total as inline text `text-[13px]`: label in `text-[#6B7280]`, value in `font-semibold text-[#DC2626]`
- Replace emoji icons with a minimal `AlertCircle` stroke icon in `text-[#9CA3AF]` for the "Total a Pagar" line
- Remove the progress bar and percentage text from the footer (this is now handled by the Comprometimento bar above)

### Empty state
- Keep current layout but use `ClipboardList` in `text-[#9CA3AF]` with muted text

## Technical details

### Imports to add
```tsx
import { Receipt, AlertCircle } from "lucide-react";
```

### Imports to remove
- Remove `Card, CardContent, CardHeader, CardTitle` (replaced with plain div)
- Remove `Progress` (no longer used in this component)
- Remove `Separator` (replaced with border classes)

### Key style tokens used
- Primary text: `#111827`
- Muted text: `#6B7280`
- Light muted: `#9CA3AF`
- Borders: `#E5E7EB`
- Subtle bg: `#F3F4F6`
- Hover bg: `#F9FAFB`
- Red signal: `#DC2626`
- Pending badge: bg `#FEF3C7`, text `#92400E`
- Overdue badge: bg `#FEE2E2`, text `#991B1B`



# Unified Premium Fintech Design System

Apply the minimal, typographic-first design language across all pages and components that haven't been updated yet.

## 1. Global Foundation Changes

### `src/index.css`
- Update `--primary` in light mode to map closer to `#111827` (dark neutral)
- Update `--destructive` to use red (#DC2626) instead of current orange
- Add focus style override: `focus-visible:ring` uses subtle dark outline instead of colored glow
- Update `--background` in light mode to `#FAFAFA` feel (keep current or shift slightly)

### `src/components/ui/button.tsx`
- Update `default` variant: `bg-[#111827] text-white hover:bg-[#1F2937]` with `rounded-lg`
- Update `destructive` variant: `bg-white text-[#DC2626] border border-[#DC2626] hover:bg-red-50`
- Update `outline` variant: ensure border is `#E5E7EB`, text `#374151`
- Update base `rounded-md` to `rounded-lg` (8px)

### `src/components/ui/input.tsx`
- Update focus style: `focus-visible:ring-0 focus-visible:border-[#111827] focus-visible:shadow-[0_0_0_2px_rgba(0,0,0,0.1)]`
- Ensure border is `#E5E7EB`, rounded-lg

### `src/components/ui/empty-state.tsx`
- Remove `bg-muted/30` and `border-dashed`
- Use clean white background with subtle border: `bg-white border border-[#E5E7EB] rounded-xl`
- Icon color: `text-[#9CA3AF]` instead of `text-muted-foreground/40`

## 2. Page-Level Changes

### `src/pages/Bancos.tsx`
- Summary card: Remove `gradient-neutral shadow-lg border-0`. Use `bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]`
- Remove colored icon backgrounds (`bg-primary/20`). Use `bg-[#F3F4F6]` with gray icons
- Remove `text-income` from saldo total, use `text-[#16A34A]` explicitly
- Inactive bank cards: remove colored icon styling

### `src/components/bancos/BancoCard.tsx`
- Replace colored icon background (`backgroundColor: banco.cor + "15"`) with `bg-[#F3F4F6]`
- Icon: `text-[#6B7280]` instead of `style={{ color: banco.cor }}`
- Remove gradient on saldo section (`bg-gradient-to-br from-emerald-50/50...`), use `bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl`
- Delete button: remove `text-destructive`, use `text-[#9CA3AF] hover:text-[#374151]`

### `src/pages/Investimentos.tsx`
- Tabs: convert from pill `TabsList` to underline tabs (same pattern as Categories/Economia)

### `src/components/investimentos/InvestimentoCard.tsx`
- Remove `border-l-4` colored left border
- Replace colored icon background with `bg-[#F3F4F6]`, icon `text-[#6B7280]`
- Keep semantic colors only on rendimento values (green/red)
- Use standard card styling: `border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]`

### `src/pages/Metas.tsx`
- Progress card: add `border border-[#E5E7EB]` explicitly
- Tabs: convert to underline style
- MetaCard: remove colored icon background, use `bg-[#F3F4F6]` with `text-[#6B7280]` icons
- Remove `bg-income/5 border-income/20` on completed metas
- Remove `bg-income/10 text-income` badge, use neutral pill style

### `src/pages/Cartoes.tsx`
- Previsao card: remove `shadow-lg`, replace icon background `bg-primary/10` with `bg-[#F3F4F6]`
- Remove gradient on active month (`bg-gradient-to-br from-primary/10`), use `bg-[#F3F4F6]` flat
- Remove `text-primary` on active month value, use `text-foreground`

### `src/pages/Notificacoes.tsx`
- Remove colored `border-l-4` on notification cards
- Replace colored round icon backgrounds (`bg-expense/10`, `bg-amber-500/10`) with `bg-[#F3F4F6]`
- Icons: use `text-[#6B7280]` instead of semantic colors on icons (keep semantic meaning via text content)
- Tabs: convert from pill grid to underline tabs
- Badge on "Nao Lidas": use neutral style instead of `bg-expense`

### `src/pages/Responsaveis.tsx`
- Title: change from `text-2xl` to `text-xl` for consistency
- Avatar circles: replace `bg-primary/10 text-primary` with `bg-[#F3F4F6] text-[#6B7280]`
- Delete menu item: change from `text-red-500` to `text-[#DC2626]`

### `src/pages/Reports.tsx`
- Category breakdown rows: replace colored icon backgrounds (`backgroundColor: category.color + "20"`) with `bg-[#F3F4F6]`
- Icons: `text-[#6B7280]` instead of `style={{ color }}`
- Top transactions: replace colored backgrounds (`bg-emerald-100`, `bg-rose-100`) with `bg-[#F3F4F6]`
- Replace `bg-secondary/50` row backgrounds with `bg-[#F9FAFB]`

### `src/pages/Profile.tsx`
- Tabs: convert from pill grid to underline style

### `src/pages/DespesasFuturas.tsx`
- Card button borders: remove `style={{ borderColor: item.cartaoCor }}`, use standard `border-[#E5E7EB]`
- Replace colored CreditCard icons with neutral `text-[#6B7280]`
- Selected state: replace `ring-2 ring-primary` with `border-[#111827]` 
- Remove `text-expense` on totals, use `text-[#DC2626]`

### `src/pages/Economia.tsx`
- Already using underline tabs -- keep as-is
- Prediction card: ensure clean styling
- Tips cards: replace `bg-muted/20` with `bg-[#F9FAFB]`

## 3. Summary of Design Tokens Applied

| Token | Value | Usage |
|-------|-------|-------|
| Primary text | #111827 | Titles, active states, primary buttons |
| Secondary text | #6B7280 | Labels, descriptions |
| Subtle text | #9CA3AF | Placeholders, disabled icons |
| Card bg | white | All cards |
| Border | #E5E7EB | Card borders, dividers |
| Hover bg | #F9FAFB | Row hovers, subtle fills |
| Neutral fill | #F3F4F6 | Icon backgrounds, inactive states |
| Income | #16A34A | Positive monetary values only |
| Expense | #DC2626 | Negative monetary values only |
| Warning | #D97706 | Warning states only |
| Card radius | 12px | All cards |
| Button radius | 8px | All buttons |
| Card shadow | 0 1px 3px rgba(0,0,0,0.06) | Standard elevation |

## Files to modify (17 files total)
1. `src/components/ui/button.tsx`
2. `src/components/ui/input.tsx`
3. `src/components/ui/empty-state.tsx`
4. `src/pages/Bancos.tsx`
5. `src/components/bancos/BancoCard.tsx`
6. `src/pages/Investimentos.tsx`
7. `src/components/investimentos/InvestimentoCard.tsx`
8. `src/pages/Metas.tsx`
9. `src/pages/Cartoes.tsx`
10. `src/pages/Notificacoes.tsx`
11. `src/pages/Responsaveis.tsx`
12. `src/pages/Reports.tsx`
13. `src/pages/Profile.tsx`
14. `src/pages/DespesasFuturas.tsx`
15. `src/pages/Economia.tsx`
16. `src/index.css`
17. `src/pages/Dashboard.tsx` (minor adjustments)


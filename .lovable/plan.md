

## Plan: Mobile layout improvements for the financial dashboard

### Changes

**File: `src/pages/Transactions.tsx`**

1. **Cards grid — responsive layout with specific spans**

Replace the current uniform `grid-cols-2 lg:grid-cols-3` (line 1256) with a mobile-aware grid where "Saldo Real" and "Estimado" span full width on mobile:

```tsx
<AnimatedSection delay={0.1} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
  {/* Receitas, Despesas — stay 2-col */}
  <StatCardMinimal title="Receitas" ... />
  <StatCardMinimal title="Despesas" ... />
  {/* A Receber, Total a Pagar — stay 2-col */}
  <StatCardMinimal title="A Receber" ... />
  <TotalAPagarCard ... />
  {/* Saldo Real — full width on mobile */}
  <StatCardMinimal title="Saldo Real" ... className="col-span-2 lg:col-span-1" />
  {/* Estimado — full width on mobile */}
  <StatCardMinimal title="Estimado" ... className="col-span-2 lg:col-span-1" />
  {/* Assinaturas — single column on mobile */}
  <StatCardMinimal title="Assinaturas" ... className="col-span-2 lg:col-span-1" />
</AnimatedSection>
```

2. **Filter tabs — horizontal scroll on mobile**

Replace `flex-wrap` (line 1350) with horizontal scroll styling:

```tsx
<div className="flex overflow-x-auto gap-1 scrollbar-hide">
```

Add CSS for `scrollbar-hide` in `src/index.css` (if not already present):
```css
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

3. **Search + dropdown line** — no changes needed, already works correctly.

4. **Padding and typography on mobile**

**File: `src/components/dashboard/StatCardMinimal.tsx`**

Update the container padding from `p-4` to `p-3 sm:p-4` for slightly more breathing room awareness on mobile. The "só este mês" secondary text in the Estimado card already uses `text-[11px]` which is equivalent to `text-xs` — no change needed there.

### Summary of files
- `src/pages/Transactions.tsx` — grid spans + scrollable filter tabs
- `src/components/dashboard/StatCardMinimal.tsx` — mobile padding tweak
- `src/index.css` — scrollbar-hide utility (if missing)


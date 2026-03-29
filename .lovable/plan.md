

## Plan: Reorganize Transactions page mobile header

### Changes

**File: `src/pages/Transactions.tsx`**

1. **Header row (lines 662-682)** — keep as-is, already has title left + buttons right with `flex items-center justify-between`. Just ensure uniform button sizing with `gap-2`.

2. **FiltroDataRange section (lines 1207-1215)** — wrap in a centered layout on mobile with the date range as subtle subtitle below the month navigator.

**File: `src/components/FiltroDataRange.tsx`**

Restructure the layout for mobile:
- **Month navigator** centered on its own line: `< Março 2026 >`
- **Date range** shown below as a small muted subtitle (`text-xs text-muted-foreground`), hidden on very small screens or shown as compact text like "01/03/26 até 31/03/26"
- On desktop (`sm:` and up), keep the current horizontal layout

Replace the current `flex-wrap` single-line layout with:

```tsx
<div className="flex flex-col items-center gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
  {/* Month navigator - always visible, centered on mobile */}
  <div className={cn("flex items-center gap-0.5 rounded-md border border-input px-1 h-8", ...)}>
    {/* < Month Year > */}
  </div>
  
  {/* Date range - subtle on mobile, normal on desktop */}
  <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm sm:text-foreground">
    <Popover>...</Popover>
    <span>até</span>
    <Popover>...</Popover>
  </div>
</div>
```

**File: `src/pages/Transactions.tsx` (Saldo Inicial card, line 1217-1262)**

3. **Add spacing before card**: Change `space-y-3` to `space-y-4` and add `mt-2` to the saldo card wrapper, or add a `<Separator />` before it.

4. **"Em Metas" alignment**: The right side already uses `text-right` with stacked label+value. Ensure it's `flex flex-col items-end` for clean vertical alignment on mobile.

### Summary of files
- `src/components/FiltroDataRange.tsx` — mobile-first layout: month centered, date range as subtitle
- `src/pages/Transactions.tsx` — add spacing before saldo card, minor alignment fixes


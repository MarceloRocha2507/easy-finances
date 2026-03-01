
# Mobile-Responsive "Contas a Pagar" Redesign

## Overview
Redesign the `ContasAPagar` component to be fully mobile-responsive, applying the specific spacing, typography, layout, and color requirements from the request.

## Changes (single file: `src/components/dashboard/ContasAPagar.tsx`)

### 1. Outer container
- Change `p-6` to `p-4` on mobile for 16px lateral padding
- Keep `p-6` on `sm:` breakpoint and above

### 2. Header section
- Title: `text-[16px]` on mobile (currently `text-sm` which is 14px), keep inline with "Ver todas" link
- Subtitle: explicit `text-[12px]` with secondary color (already `text-xs`, just confirm consistency)
- Replace `mb-5` with `mb-4` and use `gap-1` for tighter mobile spacing

### 3. Collapsible trigger cards (Faturas de Cartao / Contas Pendentes)
- Restructure layout to a two-row approach on mobile:
  - Row 1: Icon (24px / `w-6 h-6`) + Title column (title 14px bold + count 12px gray below) + Value (14px bold red) + Chevron
  - Move quantity text below title instead of beside the value on mobile
  - Add `min-w-0` to flex children to prevent text overflow
- Increase icon container to `w-6 h-6` with icon at `w-4 h-4` (24px visual area)
- Use `py-3` (12px vertical padding) and `gap-3` instead of margins
- Add subtle bottom divider between the two collapsible blocks

### 4. Expanded item rows
- Ensure `min-w-0` on all flex children
- Use `gap-2` or `gap-3` consistently instead of margins

### 5. Footer totals
- On mobile: use `grid grid-cols-2 gap-3` for "Total Cartoes" and "Total Contas"
- On `sm:` and above: keep current flex row layout
- "Total a Pagar" highlight: full width on mobile with `bg-[#FEF2F2]`, `border border-[#FCA5A5]`, `rounded-lg` (8px), `p-3` (12px), `text-[14px]`
- Ensure it spans full width (`col-span-2` on mobile grid)

### Technical details

All changes are CSS/layout only in one file. No logic, data, or behavior changes. The restructured trigger uses a flex column for title+count on mobile while keeping the value and chevron on the right.

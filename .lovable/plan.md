

# Sidebar Active State: Left Border to Floating Pill

Replace the left accent border active indicator with a floating pill/capsule background, inspired by Vercel/Raycast sidebars.

## Changes

### 1. `src/index.css` -- Update CSS utility classes

- **`.menu-item-active`**: Remove `border-left: 2px solid`. Add `background: #F3F4F6`, `border-radius: 8px`, `font-weight: 600`, `color: hsl(var(--foreground))`.
- **`.menu-item-hover:hover`**: Add `background: #F9FAFB` and `border-radius: 8px` alongside the existing color transition.
- **`.submenu-item-active`**: Same pattern -- remove border-left, add `background: #F3F4F6`, `border-radius: 6px`.
- **Dark mode**: Use `hsl(0 0% 100% / 0.08)` for active pill and `hsl(0 0% 100% / 0.04)` for hover pill.

### 2. `src/components/sidebar/SidebarNav.tsx` -- Adjust item classes

- Add `rounded-lg` and `mx-1` to nav items so the pill has 8px horizontal margin from the sidebar edges (nav already has `px-3`, items get `mx-1` to create inset).
- Active class: `menu-item-active` (now pill-based).
- Inactive class: `text-muted-foreground menu-item-hover`.
- No other structural changes needed -- the CSS classes do the work.

### 3. `src/components/sidebar/MenuCollapsible.tsx` -- Same pill pattern

- Collapsible trigger button: Add `rounded-lg mx-1` for consistent pill sizing.
- Sub-items: Add `rounded-md` for slightly smaller pill radius on sub-items.
- Active/inactive classes remain `menu-item-active` / `submenu-item-active` and `menu-item-hover`.

### CSS Summary

```css
.menu-item-active {
  background: #F3F4F6;
  border-radius: 8px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.menu-item-hover:hover {
  background: #F9FAFB;
  border-radius: 8px;
  color: hsl(257 4.6% 25%);
}

.submenu-item-active {
  background: #F3F4F6;
  border-radius: 6px;
  font-weight: 600;
  color: hsl(var(--foreground));
}
```

No borders, no shadows -- just flat subtle fill for active and hover states.



## Plan: Reorganize filter bar into 2 lines

### Change

**File: `src/pages/Transactions.tsx` (lines 1348-1403)**

Replace the current single-row `flex-col sm:flex-row` wrapper with a two-line stacked layout:

**Line 1** — Tab buttons: Remove `overflow-x-auto`, use `flex-wrap` instead, reduce padding from `px-4` to `px-3`.

**Line 2** — Search + dropdown: Always a row with search taking `flex-1` and dropdown at fixed width.

```tsx
{/* Tabs + Busca Integrados */}
<div className="flex flex-col gap-3 border-b pb-3">
  {/* Line 1: Filter tabs */}
  <div className="flex flex-wrap gap-1">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => setActiveTab(tab.value)}
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
          activeTab === tab.value 
            ? tab.activeClass
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        {tab.icon}
        {tab.label}
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded-full",
          activeTab === tab.value 
            ? "bg-foreground/10" 
            : "bg-muted text-muted-foreground"
        )}>
          {tab.count}
        </span>
      </button>
    ))}
  </div>
  
  {/* Line 2: Search + limit dropdown */}
  <div className="flex items-center gap-2">
    <div className="relative flex-1">
      <Search ... />
      <Input ... />
    </div>
    <Select ...>
      <SelectTrigger className="h-9 w-[130px] shrink-0 text-xs">
        ...
      </SelectTrigger>
      ...
    </Select>
  </div>
</div>
```

Key differences from current code:
- Outer wrapper: `flex-col gap-3` (always stacked, no `sm:flex-row`)
- Tabs: `flex-wrap` replaces `overflow-x-auto`, `px-3` replaces `px-4`
- Search row: always horizontal, search is `flex-1` (fills available space), dropdown stays fixed `w-[130px]`
- No `pb-3 sm:pb-0` needed on the search row since layout is always 2 lines


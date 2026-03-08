
## Plano: Exibir subtotal por categoria no modal

**Arquivo: `src/components/dashboard/TotalAPagarCard.tsx`**

Adicionar o valor total de cada seção ao lado do título da categoria:

1. **Linha 141-143** (Contas Pendentes header) — adicionar `totalContas` à direita:
```tsx
<div className="flex items-center justify-between mb-2">
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-md bg-[#F3F4F6] dark:bg-muted flex items-center justify-center">
      <Receipt className="w-3.5 h-3.5 text-[#6B7280]" />
    </div>
    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
      Contas Pendentes
    </span>
  </div>
  <span className="text-xs font-semibold text-destructive tabular-nums">
    -{formatCurrency(totalContas)}
  </span>
</div>
```

2. **Linha 190-196** (Fatura Cartão header) — mesmo padrão com `totalCartoes`.

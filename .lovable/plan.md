
# Plano: Remover Linha de Patrimônio do Card de Saldo

## Alteração

Remover a linha "Patrimônio: R$ X.XXX,XX" do card de Saldo Disponível, mantendo apenas "Em Metas".

## Antes

```
Saldo Disponível
R$ 0,00
Patrimônio: R$ 1.265,30  ← REMOVER
Em Metas: R$ 1.265,30
```

## Depois

```
Saldo Disponível
R$ 0,00
Em Metas: R$ 1.265,30    ← MANTER
```

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Remover linhas 160-162 (linha do Patrimônio) |

## Código

**Antes (linhas 159-173):**
```tsx
<div className="flex flex-col gap-0.5 mt-1">
  <p className="text-xs text-muted-foreground">
    Patrimônio: {formatCurrency(completeStats?.patrimonioTotal || 0)}
  </p>
  {(completeStats?.totalInvestido || 0) > 0 && (
    <p className="text-xs text-primary">
      Investido: {formatCurrency(completeStats?.totalInvestido || 0)}
    </p>
  )}
  {(completeStats?.totalMetas || 0) > 0 && (
    <p className="text-xs text-amber-600">
      Em Metas: {formatCurrency(completeStats?.totalMetas || 0)}
    </p>
  )}
</div>
```

**Depois:**
```tsx
<div className="flex flex-col gap-0.5 mt-1">
  {(completeStats?.totalInvestido || 0) > 0 && (
    <p className="text-xs text-primary">
      Investido: {formatCurrency(completeStats?.totalInvestido || 0)}
    </p>
  )}
  {(completeStats?.totalMetas || 0) > 0 && (
    <p className="text-xs text-amber-600">
      Em Metas: {formatCurrency(completeStats?.totalMetas || 0)}
    </p>
  )}
</div>
```

## Resultado

O card ficará mais limpo, mostrando apenas:
- **Saldo Disponível** (valor principal)
- **Investido** (se houver)
- **Em Metas** (se houver)

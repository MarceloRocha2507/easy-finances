
## Problema

Os cards "A Receber" e "Total a Pagar" estão em um `grid` que por padrão usa `align-items: stretch`. Quando o "Total a Pagar" expande, o "A Receber" estica verticalmente para acompanhar a mesma altura.

## Solução

Adicionar `items-start` ao grid container na linha 265 do Dashboard para que cada card mantenha sua altura natural.

```tsx
// De:
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
// Para:
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-start">
```

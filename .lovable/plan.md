

## Plano: Corrigir espaço em branco no card A Receber

O problema: ao remover `items-start` do grid, ambos os cards esticam à mesma altura. O "Total a Pagar" tem mais conteúdo (2 linhas de sub-info), então o "A Receber" fica com espaço vazio embaixo.

### Solução

**Arquivo: `src/pages/Dashboard.tsx` (linha 265)**
- Adicionar `items-start` de volta ao grid container — agora que o "Total a Pagar" usa modal em vez de expansão inline, não há mais risco de desalinhamento ao expandir. Cada card mantém sua altura natural.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-start">
```


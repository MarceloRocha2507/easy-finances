

# Corrigir Soma Definitiva no "Dividir Valores"

## Problema

O calculo do `totalDividido` soma os valores negativos (ajustes), mas o `totalFatura` ja inclui esses mesmos ajustes negativos. Resultado: o ajuste e contado duas vezes.

```text
Valores editaveis: 726,68 + 182,49 + 0 = 909,17
Ajuste fixo: -6,15
totalDividido = 909,17 + (-6,15) = 903,02  <-- errado (ajuste contado aqui)
totalFatura = 798,79 + 65,13 + 48,40 + (-6,15) = 906,17  <-- ajuste ja incluso
```

O usuario ve "903,02 / 906,17" e nao entende por que nao bate.

## Solucao

Alterar o calculo de `totalDividido` para ignorar responsaveis com total negativo. Como `totalFatura` ja desconta os ajustes, basta somar apenas os valores editaveis (positivos).

### Arquivo: `src/components/cartoes/PagarFaturaDialog.tsx`

**Unica alteracao** -- no `useMemo` do `totalDividido` (linha ~112):

De:
```typescript
if (r.total <= 0) return sum + r.total; // ajuste fixo
```

Para:
```typescript
if (r.total <= 0) return sum; // ajuste ja refletido no totalFatura
```

Com isso:
- `totalDividido` = 726,68 + 182,49 + 0 = 909,17
- `totalFatura` = 906,17
- O usuario ve "R$ 909,17 / R$ 906,17" e sabe que precisa ajustar R$ 3,00

A linha de "Ajuste de fatura" continua visivel na lista para transparencia, mas nao interfere na soma.


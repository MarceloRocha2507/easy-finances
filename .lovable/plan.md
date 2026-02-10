

# Correcao: Excluir ajustes negativos do totalDividido

## Problema

O `totalDividido` inclui o ajuste negativo (-3,15), mas o alvo (`totalFatura`) tambem ja inclui esse ajuste. Resultado:

```text
Inputs editaveis: 726,68 + 182,49 + 0 = 909,17
Ajuste negativo: -3,15
totalDividido = 909,17 + (-3,15) = 906,02
totalFatura = 912,32 - 3,15 = 909,17

906,02 != 909,17 --> nunca valida!
```

Para que a soma dos inputs editaveis bata com totalFatura, o ajuste negativo NAO deve ser somado no totalDividido (pois ja esta no totalFatura).

## Solucao

Uma unica alteracao no arquivo `src/components/cartoes/PagarFaturaDialog.tsx`, linha 121:

**De:**
```typescript
if (r.total <= 0) return sum + r.total; // ajuste fixo incluído na soma
```

**Para:**
```typescript
if (r.total <= 0) return sum; // ajuste já incluído no totalFatura
```

## Resultado esperado

```text
totalDividido = 726,68 + 182,49 + 0 = 909,17 (so editaveis)
totalFatura = 909,17
909,17 == 909,17 --> valida e permite pagar
```

O totalizador mostrara "R$ 909,17 / R$ 909,17" e o botao de confirmar ficara habilitado.


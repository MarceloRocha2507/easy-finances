

# Corrigir Total Informado para Mostrar Valor Real da Fatura

## Problema

O "Total informado" mostra R$ 912,32 como alvo, que e a soma apenas dos valores positivos. Porem o valor correto da fatura e R$ 906,17 (que ja inclui o ajuste negativo de -R$ 6,15). O usuario espera ver R$ 906,17 como alvo.

## Causa

Na correcao anterior, separamos os negativos do calculo e comparamos contra `totalPositivos` (912,32). Mas o correto e incluir os negativos no `totalDividido` e comparar contra `totalFatura` (906,17).

Verificacao com valores padrao:
- Positivos editaveis: 798,79 + 65,13 + 48,40 = 912,32
- Ajuste fixo: -6,15
- totalDividido = 912,32 + (-6,15) = 906,17 = totalFatura

## Solucao

Duas alteracoes no arquivo `src/components/cartoes/PagarFaturaDialog.tsx`:

### 1. Voltar a incluir negativos no `totalDividido`

Linha ~117, de:
```typescript
if (r.total <= 0) return sum; // ajuste já refletido no totalFatura
```
Para:
```typescript
if (r.total <= 0) return sum + r.total; // ajuste fixo incluído na soma
```

### 2. Comparar `dividirValido` contra `totalFatura` (nao `totalPositivos`)

Linha ~126, de:
```typescript
return Math.abs(totalDividido - totalPositivos) < 0.01;
}, [modo, totalDividido, totalPositivos]);
```
Para:
```typescript
return Math.abs(totalDividido - totalFatura) < 0.01;
}, [modo, totalDividido, totalFatura]);
```

### 3. Mostrar `totalFatura` no totalizador visual

Linha ~407, de:
```typescript
{formatCurrency(totalDividido)} / {formatCurrency(totalPositivos)}
```
Para:
```typescript
{formatCurrency(totalDividido)} / {formatCurrency(totalFatura)}
```

## Resultado

Com valores padrao: "R$ 906,17 / R$ 906,17" -- bate e permite confirmar.
Se o usuario alterar os valores editaveis, a soma (com ajuste) precisa continuar batendo com R$ 906,17.


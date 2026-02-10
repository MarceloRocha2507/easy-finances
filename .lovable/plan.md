

# Corrigir Validacao do Modo "Dividir Valores"

## Problema

O `totalDividido` soma apenas os valores dos responsaveis com total positivo (ignora ajustes negativos). Porem, a validacao (`dividirValido`) compara esse total com `totalFatura`, que inclui os ajustes negativos.

```
totalDividido = 726,69 + 182,48 + 48,40 = 957,57 (ou qualquer soma dos positivos)
totalFatura   = 798,79 + 65,13 + 48,40 + (-6,15) = 906,17

Nunca vao bater porque um inclui -6,15 e o outro nao.
```

## Solucao

Criar um `totalPositivos` (soma dos `r.total` onde `r.total > 0`) e usar esse valor como alvo da validacao, em vez de `totalFatura`.

### Arquivo: `src/components/cartoes/PagarFaturaDialog.tsx`

**1. Adicionar `totalPositivos`:**

```typescript
const totalPositivos = useMemo(() => {
  return responsaveis
    .filter(r => r.total > 0)
    .reduce((sum, r) => sum + r.total, 0);
}, [responsaveis]);
```

**2. Alterar `dividirValido` para comparar com `totalPositivos`:**

```typescript
const dividirValido = useMemo(() => {
  if (modo !== "dividir_valores") return true;
  return Math.abs(totalDividido - totalPositivos) < 0.01;
}, [modo, totalDividido, totalPositivos]);
```

**3. Atualizar o totalizador visual** para mostrar `totalPositivos` em vez de `totalFatura`:

```
Total informado: R$ 957,57 / R$ 912,32
```

Assim o usuario distribui apenas a parte positiva entre os responsaveis, e os ajustes negativos ficam separados (ja refletidos no `totalFatura` para o resumo final).

**4. O resumo final ("Valor que eu pago")** continua usando `totalFatura` normalmente -- a unica mudanca e no alvo de validacao do modo dividir.


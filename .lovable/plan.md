
# Corrigir Valores Cortados e Metricas Pequenas

## Problemas Identificados

1. **Limite/Fatura/Disponivel muito pequenos**: O `text-[10px]` nos valores esta pequeno demais no mobile. Os valores monetarios precisam de fonte maior.
2. **Valores das compras cortados**: O `min-w-[70px]` nao e suficiente para valores como "R$ 175,00". Valores estao sendo truncados.

## Alteracoes

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

**1. Aumentar fonte das metricas Limite/Fatura/Disponivel (linha 257)**

Trocar `text-[10px] sm:text-sm` por `text-xs sm:text-sm` para que os valores fiquem legiveis no mobile.

**2. Aumentar largura minima do valor das compras (linha 516)**

Trocar `min-w-[70px]` por `min-w-[90px]` para acomodar valores como "R$ 3.500,00" sem cortar. Tambem remover o `text-xs` do mobile para manter `text-sm` uniforme, garantindo que o valor sempre apareca por completo.

**3. Reduzir margem direita da descricao (linha 497)**

Trocar `mr-3` por `mr-2` para otimizar o espaco entre descricao e valor.

## Detalhes Tecnicos

1. **Linha 257**: `text-[10px] sm:text-sm` -> `text-xs sm:text-sm`
2. **Linha 516**: `"text-xs sm:text-sm font-semibold min-w-[70px] text-right"` -> `"text-sm font-semibold min-w-[90px] text-right"`
3. **Linha 497**: `mr-3` -> `mr-2`

Isso garante que:
- As metricas do header (Limite, Fatura, Disponivel) ficam legiveis com `text-xs` (12px) em vez de `text-[10px]` (10px)
- Os valores das compras tem espaco suficiente (90px) para exibir valores completos como "R$ 3.127,93"
- A descricao continua com `truncate` e corta com reticencias quando necessario, priorizando a visibilidade do valor

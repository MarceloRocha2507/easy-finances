

# Corrigir Soma no Modo "Dividir Valores"

## Problema

A funcao `calcularResumoPorResponsavel` pode retornar responsaveis com **total negativo** (causado por estornos ou creditos). Esses registros:

1. Tem seu `valorCustom` inicializado com valor negativo (ex: "-6,15")
2. Podem ficar ocultos na ScrollArea (o usuario nao percebe que existem)
3. Sao incluidos na soma do `totalDividido`, reduzindo o total de forma inesperada

Exemplo: 726,68 + 182,49 + 0 + (-6,15) = 903,02 (em vez de 909,17)

## Solucao

### `src/components/cartoes/PagarFaturaDialog.tsx`

Duas mudancas:

**1. Filtrar responsaveis com total <= 0 no modo dividir_valores:**

Na inicializacao dos responsaveis (useEffect), manter todos os responsaveis no estado (para os outros modos funcionarem), mas adicionar um `useMemo` separado que filtra apenas os que tem `total > 0` para exibicao e calculo no modo `dividir_valores`.

```
const responsaveisDividir = useMemo(() => {
  return responsaveis.filter(r => r.total > 0);
}, [responsaveis]);
```

**2. Usar `responsaveisDividir` no calculo do totalDividido e na renderizacao:**

- O `totalDividido` deve somar apenas `responsaveisDividir`
- A lista de inputs no modo `dividir_valores` deve iterar `responsaveisDividir`
- O `totalFatura` permanece usando todos os responsaveis (para manter o valor correto da fatura)

**3. Ajustar validacao:**

O `totalDividido` deve ser comparado com `totalFatura` (que ja inclui estornos), entao a validacao `dividirValido` precisa comparar com o total real da fatura.

Mas como estamos ignorando os responsaveis negativos na soma, precisamos comparar `totalDividido` com a soma apenas dos positivos, OU comparar com o `totalFatura` e ajustar.

A abordagem mais simples: o `totalFatura` ja reflete o valor correto da fatura (com estornos descontados = 906,17). A validacao compara `totalDividido` com `totalFatura`. O usuario distribui o valor total da fatura entre os responsaveis com saldo positivo.

## Arquivo a modificar

| Arquivo | Alteracao |
|---|---|
| `src/components/cartoes/PagarFaturaDialog.tsx` | Filtrar responsaveis com total <= 0 no modo dividir_valores para calculo e exibicao |


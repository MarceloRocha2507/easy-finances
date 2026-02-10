
# Incluir Ajustes de Fatura (valores negativos) no modo "Dividir Valores"

## Problema

Ao filtrar responsaveis com `total <= 0`, eles deixam de aparecer na lista e seus valores negativos nao sao somados no `totalDividido`. Porem, o `totalFatura` inclui esses negativos (ex: 906,17). Resultado: a soma dos valores positivos (ex: 909,17) nunca bate com o total da fatura (906,17), porque falta o ajuste de -3,00 (ou qualquer valor negativo).

## Solucao

Em vez de esconder os responsaveis com total negativo, **mostrar todos** no modo `dividir_valores`. Responsaveis com `total <= 0` serao exibidos como **"Ajuste de fatura"** com valor fixo (nao editavel) e somados automaticamente no total.

## Alteracoes em `src/components/cartoes/PagarFaturaDialog.tsx`

### 1. Remover `responsaveisDividir`

Nao sera mais necessario filtrar. Todos os responsaveis participam do calculo e da exibicao.

### 2. Atualizar `totalDividido`

Somar todos os responsaveis: para os que tem `total > 0`, usar o `valorCustom` digitado; para os que tem `total <= 0`, usar o valor fixo (`r.total`).

```
const totalDividido = useMemo(() => {
  if (modo !== "dividir_valores") return 0;
  return responsaveis.reduce((sum, r) => {
    if (r.total <= 0) return sum + r.total; // ajuste fixo
    const val = parseBrazilianCurrency(r.valorCustom);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
}, [responsaveis, modo]);
```

### 3. Atualizar a lista de inputs

Voltar a iterar `responsaveis` (todos). Para cada um:
- Se `total > 0`: exibir Input editavel (como hoje)
- Se `total <= 0`: exibir o valor fixo (sem Input), com label "Ajuste de fatura" e estilo diferenciado (ex: texto em azul/verde, fundo diferente)

### 4. Logica de salvamento

Nenhuma mudanca necessaria -- responsaveis com valor negativo nao geram acerto (o filtro `a.valor > 0` no `handleConfirmar` ja os exclui).

## Resultado esperado

| Responsavel | Deve | Valor digitado | Editavel |
|---|---|---|---|
| Eu (titular) | R$ 798,79 | 726,68 | Sim |
| Mae | R$ 65,13 | 182,49 | Sim |
| Pai | R$ 48,40 | 48,40 | Sim |
| Ajuste de fatura | -R$ 6,15 | -6,15 | Nao |
| **Total** | | **951,42 + (-6,15) = ...** | |

Assim a soma sempre bate com o `totalFatura` que ja inclui os ajustes negativos.

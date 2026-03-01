

# Remover card redundante "Total a Pagar"

## Problema

O card "Total a Pagar" aparece duplicado: uma vez na linha de cards de resumo e outra no rodape da secao "Contas a Pagar".

## Alteracao

### `src/pages/Dashboard.tsx` (linhas 255-284)

1. Remover o bloco que adiciona o card "Total a Pagar" (linhas 275-277)
2. Ajustar o grid de `lg:grid-cols-4` para `lg:grid-cols-3`, mantendo apenas "A Receber", "A Pagar" e "Fatura Cartao"
3. Remover a variavel `totalAPagar` que so era usada para esse card

O rodape da secao "Contas a Pagar" (componente `ContasAPagar`) ja exibe o total consolidado e permanece inalterado.


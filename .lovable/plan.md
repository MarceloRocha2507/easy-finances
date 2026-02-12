

# Corrigir Descricao Longa Cortando o Valor

## Problema

Quando a descricao da compra e muito longa (ex: "54.824.042 LUCAS DE BRITO MARQUES - 3..."), ela empurra o valor monetario para fora da tela, tornando-o invisivel.

## Causa

O container da descricao usa `min-w-0 flex-1` mas o container do valor nao tem uma largura minima garantida. O `truncate` na descricao funciona, mas o container pai nao reserva espaco suficiente para o valor.

## Solucao

No arquivo `src/components/cartoes/DetalhesCartaoDialog.tsx`, fazer duas alteracoes na area das linhas 497-520:

1. **Adicionar `mr-3`** ao container da descricao (linha 497) para criar espaco entre texto e valor
2. **Adicionar `min-w-[85px] text-right`** ao `<span>` do valor (linha 515-520) para garantir largura minima fixa e alinhamento consistente

Alteracoes especificas:

- Linha 497: `<div className="flex items-center gap-2 min-w-0 flex-1">` para `<div className="flex items-center gap-2 min-w-0 flex-1 mr-3">`
- Linha 515-516: `<span className={cn("text-sm font-semibold", ...)}>`para `<span className={cn("text-sm font-semibold min-w-[85px] text-right", ...)}>`

Isso garante que o valor sempre tenha 85px reservados, e o `truncate` na descricao corta o texto excedente com reticencias (...).


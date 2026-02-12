

# Corrigir Valores Cortados nas Despesas do Cartao

## Problema

Na lista de despesas dentro do dialog de detalhes do cartao, os valores monetarios no lado direito estao sendo cortados em alguns meses. Isso acontece quando as descricoes das despesas sao longas -- o container do valor e comprimido pelo flexbox, e o `overflow-hidden` do container pai corta o conteudo.

## Causa

O container dos valores e acoes (linha 524) nao possui `shrink-0`, permitindo que o flexbox o comprima quando a descricao e longa. Resultado: o valor fica parcialmente visivel ou completamente cortado.

## Solucao

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

Uma unica alteracao na linha 524:

- **Antes**: `"flex items-center gap-1"`
- **Depois**: `"flex items-center gap-1 shrink-0"`

Adicionar `shrink-0` garante que o container do valor e do botao de acoes nunca seja comprimido, independentemente do tamanho da descricao. A descricao ja possui `truncate` e `min-w-0` para lidar com textos longos.


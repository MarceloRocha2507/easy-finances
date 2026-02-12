

# Corrigir Compras Cortadas no Celular - Solucao Definitiva

## Problema Real

O texto da descricao (ex: "Marcelo Rocha Fonseca Filho - 1/4") e da linha de subtitulo (ex: "2/4 . Eu") estao transbordando a tela porque:

1. A linha de subtitulo (parcela + responsavel) **nao tem `truncate`** - ela cresce indefinidamente
2. O container intermediario precisa de `overflow-hidden` para que o `truncate` dos filhos funcione corretamente

O `truncate` so funciona se **todos** os containers ancestrais limitarem o overflow. Basta um nao ter e o texto vaza.

## Solucao

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

Tres alteracoes cirurgicas:

**1. Linha 497** - Adicionar `overflow-hidden` ao container da descricao para garantir que o `truncate` dos filhos funcione:

`flex items-center gap-2 min-w-0 flex-1 mr-2` -> `flex items-center gap-2 min-w-0 flex-1 mr-2 overflow-hidden`

**2. Linha 498** - Adicionar `overflow-hidden` ao wrapper interno:

`min-w-0 flex-1` -> `min-w-0 flex-1 overflow-hidden`

**3. Linha 505** - Adicionar `truncate` na linha de subtitulo (parcela/responsavel) que hoje nao tem nenhuma restricao de largura:

`text-xs text-muted-foreground` -> `text-xs text-muted-foreground truncate`

## Por que isso resolve definitivamente

O `truncate` aplica `overflow: hidden`, `text-overflow: ellipsis` e `white-space: nowrap`. Porem, ele so funciona se o elemento pai tambem restrinja o overflow. Ao adicionar `overflow-hidden` nos containers pai e `truncate` na linha de subtitulo, garantimos que **ambas** as linhas de texto (descricao e parcela/responsavel) serao cortadas com reticencias (...) antes de empurrar o valor para fora da tela.

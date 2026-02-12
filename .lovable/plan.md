
# Corrigir Conteudo Cortado no Dialog de Detalhes do Cartao

## Problema

Ao navegar para meses com despesas de nomes longos (ex: "54.824.042 LUCAS DE BRITO MARQUES"), o conteudo do dialog transborda horizontalmente. O `overflow-hidden` no DialogContent corta o lado direito, escondendo:
- A metrica "Disponivel" no header
- O botao "Excluir" no rodape
- Partes dos nomes de despesas longas

## Causa Raiz

O conteudo interno do dialog nao tem restricao de largura (`overflow-hidden` ou `max-w-full`). Quando textos longos sao renderizados, eles empurram o layout para alem da largura do dialog, e o `overflow-hidden` do DialogContent corta tudo pela direita.

## Solucao

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

1. **Header (gradiente)**: Adicionar `overflow-hidden` na div do header (linha 237) para garantir que o conteudo interno respeite os limites

2. **Area de conteudo**: Adicionar `overflow-hidden` na div de conteudo (linha 277, `px-5 py-4 space-y-4`) para restringir a largura de todos os filhos

3. **Rodape (botoes Editar/Excluir)**: Garantir que a div dos botoes (linha 587) tenha `min-w-0` nos filhos para evitar que os botoes ultrapassem o container

4. **Texto do botao "Ver todas"**: Adicionar `truncate` ao texto do botao "Ver todas as X despesas" (linha 582) para evitar que textos longos estourem a largura

## Detalhes Tecnicos

- Linha 237: Adicionar `overflow-hidden` ao container do header gradiente
- Linha 277: Adicionar `overflow-hidden` ao container de conteudo principal  
- Linha 587-606: Adicionar `min-w-0` aos botoes do rodape
- As despesas individuais (linhas 488-566) ja possuem `min-w-0 flex-1` e `truncate` corretamente

Estas mudancas sao puramente CSS e nao afetam funcionalidade.

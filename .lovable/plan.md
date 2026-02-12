
# Corrigir Valores Cortados nas Despesas do Cartao (Todos os Meses)

## Problema

Os valores monetarios das despesas continuam sendo cortados no lado direito do dialog. O componente ScrollArea do Radix cria um Viewport interno que nao restringe a largura horizontal -- o conteudo se expande para alem do container visivel e o `overflow-hidden` do pai corta tudo pela direita.

## Causa Raiz

O Radix ScrollArea Viewport (linha 11 de scroll-area.tsx) usa `h-full w-full` mas nao possui restricao de overflow horizontal. Quando textos longos estao dentro dele, o viewport expande internamente, e o `overflow-hidden` do Root corta o conteudo visivel.

A correcao anterior de `shrink-0` no container de valores foi correta em principio, mas nao resolve o problema porque o pai (ScrollArea Viewport) nao esta restringindo a largura dos filhos.

## Solucao

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

1. **Adicionar `overflow-hidden` ao container `space-y-1` dentro do ScrollArea** (linha 487): Forcar o container das parcelas a respeitar a largura do pai, fazendo com que os itens flex internos funcionem corretamente com `truncate` e `min-w-0`.

2. **Adicionar `max-w-full` e `overflow-hidden` a cada linha de despesa** (linha 491-492): Garantir que cada item individual nunca ultrapasse a largura disponivel, independentemente do conteudo interno.

Alternativamente, a solucao mais limpa:

3. **Passar `className="[&>div]:!overflow-x-hidden"` ao ScrollArea** (linha 465): Forcar o Viewport do Radix a bloquear overflow horizontal, resolvendo o problema na raiz sem alterar o componente global.

## Detalhes Tecnicos

- Linha 465: Mudar `<ScrollArea className="h-[200px]">` para `<ScrollArea className="h-[200px] [&>div]:!overflow-x-hidden">`
- Linha 487: Mudar `<div className="space-y-1">` para `<div className="space-y-1 overflow-hidden">`
- Estas duas alteracoes juntas garantem que o conteudo horizontal nunca ultrapasse os limites do dialog, permitindo que `truncate` e `min-w-0` funcionem corretamente nos textos de descricao

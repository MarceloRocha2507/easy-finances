
# Corrigir Modais de Cartao

## Problema 1: Modal "Nova Compra" sem scroll e arrastando para os lados

O `DialogContent` usa `overflow-hidden` mas a div interna de conteudo (`overflow-y-auto`) nao tem altura maxima definida, entao o scroll nunca ativa. Alem disso, falta `overflow-x-hidden` na div interna para bloquear o arraste lateral.

### Correcao em `src/components/cartoes/NovaCompraCartaoDialog.tsx`
- Na `DialogContent` (linha 297): manter `overflow-hidden` mas adicionar layout flex vertical (`flex flex-col`)
- Na div de conteudo (linha 310): adicionar `overflow-x-hidden` e `min-h-0` para que o flex permita o encolhimento e o scroll vertical funcione

Classe atual da DialogContent:
```
sm:max-w-md max-h-[90vh] p-0 gap-0 overflow-hidden
```
Nova classe:
```
sm:max-w-md max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col
```

Classe atual da div de conteudo:
```
space-y-4 px-4 sm:px-5 pb-4 pt-2 overflow-y-auto
```
Nova classe:
```
space-y-4 px-4 sm:px-5 pb-4 pt-2 overflow-y-auto overflow-x-hidden min-h-0
```

## Problema 2: Modal "Detalhes do Cartao" com conteudo apertado nas bordas

O modal usa `px-4 sm:px-5` tanto no header quanto no conteudo, o que fica muito justo em mobile. Aumentar o padding interno e adicionar pequenos ajustes de espacamento.

### Correcao em `src/components/cartoes/DetalhesCartaoDialog.tsx`
- Na `DialogContent` (linha 242): adicionar `flex flex-col` para layout correto
- No header (linha 244): aumentar padding para `px-5 sm:px-6`
- Na div de conteudo (linha 287): aumentar padding para `px-5 sm:px-6` e adicionar `overflow-x-hidden min-h-0`

## Arquivos modificados

- `src/components/cartoes/NovaCompraCartaoDialog.tsx` - flex layout + overflow-x-hidden
- `src/components/cartoes/DetalhesCartaoDialog.tsx` - padding aumentado + flex layout

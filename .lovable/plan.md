

# Corrigir Scroll do Dialog "Mensagens em Lote"

## Problema

O dialog tem dois mecanismos de scroll conflitantes: o `DialogContent` (com `overflow-y-auto max-h-[90vh]`) e o `ScrollArea` interno (com `max-h-[50vh]`). Isso impede a rolagem correta do conteudo.

## Solucao

No arquivo `src/components/cartoes/GerarMensagensLoteDialog.tsx`:

- Remover o `ScrollArea` da etapa de resultado e deixar o proprio `DialogContent` controlar o scroll (que ja possui `overflow-y-auto` e `max-h-[90vh]`)
- Manter o `ScrollArea` apenas na etapa de selecao (lista de checkboxes), onde funciona corretamente dentro de um espaco menor

## Detalhe tecnico

A mudanca e simples: na etapa "resultado", substituir `<ScrollArea className="max-h-[50vh]"><div className="space-y-4 pr-3">` por apenas `<div className="space-y-4">`, removendo a restricao de altura que conflita com o scroll do dialog pai.


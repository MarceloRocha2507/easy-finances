
# Corrigir scroll do modal Pagar Fatura

## Problema

O `DialogContent` do `PagarFaturaDialog` usa `overflow-hidden` (linha 244), o que bloqueia o scroll global do dialog. A div interna de conteudo (linha 257) tem `overflow-y-auto` mas nao tem restricao de altura (`max-h`), entao nunca ativa o scroll.

## Solucao

### Arquivo: `src/components/cartoes/PagarFaturaDialog.tsx`

1. **Linha 244** - Mudar o `DialogContent` para usar `flex flex-col` com `overflow-hidden` (manter o hidden aqui para o container principal nao vazar)

2. **Linha 257** - Adicionar `min-h-0` e `max-h-[calc(90vh-80px)]` na div de conteudo scrollavel para que ela saiba quando ativar o scroll. O `80px` desconta a altura do cabecalho fixo.

Resultado: cabecalho fixo no topo, conteudo rola normalmente dentro do modal.

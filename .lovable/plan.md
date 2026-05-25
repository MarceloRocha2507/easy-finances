## Objetivo

Aprimorar o fluxo "Ler comprovante com IA" em `NovaCompraCartaoDialog.tsx` para:
1. Aceitar **múltiplas imagens** de uma vez (até 5).
2. Permitir **colar imagem** (Ctrl+V / Cmd+V) diretamente no diálogo.
3. Consolidar todas as transações detectadas em todas as imagens em uma única tela de revisão em lote.

## Mudanças

### 1. `src/components/cartoes/NovaCompraCartaoDialog.tsx`

- Adicionar atributo `multiple` no `<input type="file">` para permitir seleção de várias imagens.
- Criar nova função `handleMultiplasImagens(files: File[])` que:
  - Valida tamanho de cada arquivo (máx 5MB cada, máx 5 imagens por envio).
  - Processa as imagens em paralelo, chamando a edge function `analisar-comprovante-cartao` uma vez por imagem.
  - Consolida todas as compras retornadas em um único array `CompraExtraida[]`.
  - Abre o `RevisarComprasLoteDialog` com a lista consolidada (mesmo que tenha apenas 1 compra no total, quando vieram de múltiplas imagens).
  - Exibe contador de progresso ("Analisando 2/5...") via estado `progressoAnalise`.
- Adicionar listener de `paste` no `DialogContent` (via `useEffect` enquanto o diálogo está aberto):
  - Captura `event.clipboardData.items`, filtra `type.startsWith("image/")`.
  - Converte cada item em `File` via `getAsFile()` e dispara `handleMultiplasImagens`.
  - Toast: "Imagem colada — analisando...".
- Atualizar o card "Ler comprovante com IA" para:
  - Mostrar texto "Envie uma ou mais fotos · ou cole com Ctrl+V".
  - Durante análise, exibir progresso ("Analisando 2 de 5 imagens...").
- Manter o caso de 1 imagem com 1 compra "padrão" indo direto para preenchimento do formulário (fluxo atual). Quando vieram múltiplas imagens, sempre abrir o lote (mesmo com 1 item) para confirmação.

### 2. `src/components/cartoes/RevisarComprasLoteDialog.tsx`

- Atualizar subtítulo dinâmico: trocar `"{compras.length} compra(s) na imagem"` por `"{compras.length} transação(ões) detectada(s)"` (mais genérico — pode vir de várias imagens).
- A verificação de duplicatas já existente continua funcionando normalmente para a lista consolidada.

## Detalhes técnicos

- **Limite por envio:** 5 imagens, 5MB cada. Se ultrapassar, toast de erro e ignora as excedentes.
- **Edge function:** não precisa mudar. Continua recebendo 1 imagem por chamada; o front faz N chamadas em paralelo via `Promise.allSettled`.
- **Tratamento de erros:** se algumas imagens falharem, mostra toast informativo (ex: "3 de 5 imagens analisadas") e usa as que funcionaram.
- **Preview:** quando há múltiplas imagens, mostra apenas um indicador "N imagens enviadas" no lugar do thumbnail único atual.
- **Paste em mobile:** ignorado naturalmente (iOS/Android não disparam paste com imagem em diálogos), mas não quebra nada.

## Fora de escopo

- Não mexer na edge function nem no schema da IA.
- Não mexer no fluxo manual de digitação de compra.
- Não adicionar drag-and-drop (pode ser uma melhoria futura).

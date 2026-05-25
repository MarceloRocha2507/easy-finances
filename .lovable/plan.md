## Situação atual (já é assim hoje)

A imagem do comprovante **nunca é salva** no projeto:

- O frontend (`NovaCompraCartaoDialog.tsx`) lê o arquivo, converte para base64 **em memória** e envia direto no body da requisição `supabase.functions.invoke("analisar-comprovante-cartao")`. Nada é gravado em Supabase Storage, bucket, tabela ou cache.
- A edge function `analisar-comprovante-cartao` recebe o base64, repassa como `data:` URL para o Lovable AI Gateway (Gemini) e **descarta** ao retornar a resposta. Não há `INSERT`, upload, nem persistência da imagem.
- Os logs da edge function hoje só registram erros (status code da API e mensagens), nunca a imagem em si.

Ou seja: na prática a imagem só vive em memória durante a chamada e some assim que a função retorna.

## O que vou reforçar (hardening defensivo)

Para deixar isso explícito e à prova de regressões futuras:

### 1. Edge function `analisar-comprovante-cartao`

- Adicionar comentário de cabeçalho explicitando a política: "Imagem em memória apenas — nenhuma persistência, nenhum log do conteúdo."
- Garantir que **nenhum** `console.log` ou `console.error` jamais inclua `dataUrl`, `imageBase64` ou `body`. Só metadados seguros (mimeType, tamanho em bytes, status).
- Logo após receber a resposta da AI, liberar a referência: `imageBase64 = ""` e `dataUrl = ""` antes do `return` (ajuda o GC e blinda contra refactor futuro).
- Adicionar header `Cache-Control: no-store` na resposta.

### 2. Frontend `NovaCompraCartaoDialog.tsx`

- Após a chamada, zerar a variável `base64` (`base64 = ""`) e limpar o `File` selecionado / preview (`setArquivo(null)`, `setPreviewUrl(null)`) assim que a análise terminar — sucesso ou erro.
- Revogar qualquer `URL.createObjectURL` com `URL.revokeObjectURL` no cleanup.

### 3. Aviso visual no dialog

- No dialog de upload de comprovante, adicionar uma microcopy discreta abaixo do botão:  
  *"A imagem é analisada em memória e descartada imediatamente. Nada fica armazenado."*

### Sem mudanças em DB, storage ou RLS

Não é preciso migration, bucket nem policy — não havia armazenamento para remover.

### Observação sobre o provedor de IA

A imagem é enviada para o Lovable AI Gateway → Google Gemini. A retenção lá segue as políticas do provedor (não temos controle por código). Isso é normal para qualquer chamada a LLM externa; vou mencionar isso na microcopy se você quiser ser 100% transparente — confirme se deseja incluir essa frase ou não.

## Arquivos afetados

- `supabase/functions/analisar-comprovante-cartao/index.ts` — comentário, sanitização de logs, limpeza de refs, header `no-store`.
- `src/components/cartoes/NovaCompraCartaoDialog.tsx` — limpar `base64` / `File` / `objectURL` no `finally`, microcopy.
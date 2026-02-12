

# Assistente IA no Sistema Web

## O que sera feito

Adicionar um botao flutuante de chat com IA no canto inferior direito do sistema. Ao clicar, abre um painel de chat onde voce pode fazer perguntas sobre suas financas em linguagem natural, igual ao bot do Telegram, mas direto no sistema.

## Como vai funcionar

1. Um botao flutuante com icone de chat aparece no canto inferior direito de todas as paginas (quando logado)
2. Ao clicar, abre um painel de chat compacto
3. Voce digita uma pergunta (ex: "Quanto gastei este mes?", "Como estao minhas metas?")
4. A resposta aparece em tempo real com streaming (token por token)
5. O historico da conversa e mantido durante a sessao

## Detalhes Tecnicos

### 1. Nova Edge Function: `supabase/functions/ai-chat/index.ts`

- Recebe as mensagens do usuario + auth token
- Identifica o usuario pelo token JWT
- Busca todos os dados financeiros (mesma logica do Telegram: transacoes, cartoes, parcelas, bancos, metas, investimentos, orcamentos)
- Monta o contexto e envia para o Lovable AI Gateway com streaming habilitado
- Retorna o stream SSE diretamente para o frontend
- Trata erros 429 (rate limit) e 402 (creditos)

### 2. Novo componente: `src/components/AiChat.tsx`

- Botao flutuante fixo no canto inferior direito (z-index alto para ficar acima de tudo)
- Painel de chat que abre/fecha com animacao
- Campo de input para digitar perguntas
- Area de mensagens com scroll automatico
- Renderizacao de markdown nas respostas usando texto simples formatado
- Indicador de "digitando" enquanto a IA processa
- Tratamento de erros com mensagens amigaveis

### 3. Integracao no Layout

- O componente `AiChat` sera adicionado dentro do `Layout.tsx`, apos o `main`, para aparecer em todas as paginas protegidas
- Nao sera necessario criar rota nova

### 4. Streaming no frontend

- Usa fetch com leitura de stream SSE
- Tokens aparecem um a um na tela conforme chegam
- Historico de mensagens mantido em estado React (sem persistencia no banco)

### 5. Configuracao

- Adicionar `ai-chat` no `supabase/config.toml` com `verify_jwt = true` (requer autenticacao)
- Usar `LOVABLE_API_KEY` ja configurado
- Modelo: `google/gemini-3-flash-preview`

### Arquivos criados/modificados

- **Criar**: `supabase/functions/ai-chat/index.ts` - Edge function com streaming
- **Criar**: `src/components/AiChat.tsx` - Componente do chat flutuante
- **Modificar**: `src/components/Layout.tsx` - Adicionar o componente AiChat
- **Modificar**: `supabase/config.toml` - Registrar a nova function

### Nenhuma mudanca no banco de dados

Usa apenas dados existentes. O historico do chat vive apenas na sessao do navegador.




# Corrigir Integração Telegram

## Problemas Identificados

### 1. Webhook do Telegram nao esta registrado
A backend function `telegram-webhook` existe e esta deployada, mas o Telegram nao sabe para onde enviar as mensagens. E preciso registrar a URL do webhook na API do Telegram usando o metodo `setWebhook`.

### 2. Logica de inserção com placeholder quebrada
Quando o bot recebe `/start`, o codigo tenta fazer upsert com `user_id: "00000000-0000-0000-0000-000000000000"` e depois deleta e insere novamente. Isso causa conflitos quando multiplos usuarios tentam vincular (todos usam o mesmo placeholder UUID). A logica precisa ser simplificada.

## Solucao

### Passo 1: Adicionar acao `setup-webhook` na backend function
Adicionar uma acao na funcao `telegram-webhook` que, ao ser chamada pelo frontend, registra automaticamente a URL do webhook na API do Telegram. Assim o usuario nao precisa fazer isso manualmente.

A URL do webhook sera:
`https://vcpnairzcpljyartrafm.supabase.co/functions/v1/telegram-webhook`

### Passo 2: Corrigir a logica do `/start`
Simplificar a logica para:
- Deletar qualquer registro pendente (nao ativo) com o mesmo `telegram_chat_id`
- Inserir um novo registro com `user_id` nulo (mudar coluna para nullable) ou usar o placeholder
- Remover o upsert redundante que causa conflito

Como `user_id` nao pode ser nulo (NOT NULL), vou manter o placeholder mas corrigir a logica para evitar conflitos de unicidade:
- Primeiro deletar registros pendentes com mesmo `chat_id`
- Depois inserir o novo registro
- Remover o upsert inicial que esta duplicado

### Passo 3: Adicionar botao "Configurar Webhook" no frontend
Na secao Telegram da pagina de configuracoes, antes de pedir o codigo, adicionar um botao que chama a acao `setup-webhook`. Isso garante que o bot esta pronto para receber mensagens.

Alternativamente, chamar `setup-webhook` automaticamente ao carregar a pagina.

## Detalhes Tecnicos

### Arquivo: `supabase/functions/telegram-webhook/index.ts`
- Adicionar handler para `body.action === "setup-webhook"` que chama `https://api.telegram.org/bot{token}/setWebhook` com a URL da funcao
- Corrigir a logica do `/start`: remover o upsert inicial (linhas 34-44), manter apenas o delete + insert (linhas 48-60)

### Arquivo: `src/hooks/useTelegram.ts`
- Adicionar mutation `configurarWebhook` que chama a acao `setup-webhook`
- Chamar automaticamente ao montar o hook (ou sob demanda)

### Arquivo: `src/pages/ConfiguracoesNotificacoes.tsx`
- Adicionar botao "Ativar Bot" ou chamar configuracao automaticamente
- Mostrar feedback de que o webhook foi configurado

## Sequencia
1. Atualizar a backend function com a acao `setup-webhook` e corrigir logica do `/start`
2. Deploy da funcao
3. Atualizar o hook para configurar webhook automaticamente
4. Atualizar a pagina de configuracoes se necessario
5. Testar o fluxo completo


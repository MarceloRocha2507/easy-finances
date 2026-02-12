

# Integracaoo com Telegram para Notificacoes

## Visao Geral

Integrar o sistema com um bot do Telegram para enviar notificacoes financeiras diretamente no celular do usuario. O sistema tera dois modos: alertas urgentes em tempo real e um resumo diario. O usuario podera escolher manualmente quais tipos de alerta deseja receber no Telegram.

## Pre-requisitos (o que voce precisa fazer)

1. Criar um bot no Telegram abrindo o [@BotFather](https://t.me/BotFather) e enviando `/newbot`
2. Copiar o **token do bot** que o BotFather vai gerar (algo como `123456:ABC-DEF...`)
3. Colar esse token quando o sistema pedir

## Como vai funcionar

1. Nas configuracoes de notificacoes, tera uma nova secao "Telegram"
2. Voce clica em "Conectar Telegram" e recebe instrucoes para iniciar conversa com o bot
3. Envia `/start` para o bot, que responde com um codigo de vinculacao
4. Voce cola o codigo no sistema e pronto - esta conectado
5. Na mesma pagina de configuracoes de notificacoes, cada tipo de alerta tera um toggle extra para "Enviar no Telegram"
6. Alertas do tipo `danger` e `warning` sao enviados em tempo real
7. Alertas do tipo `info` e `success` sao acumulados e enviados em um resumo diario

## Detalhes Tecnicos

### 1. Banco de dados - Nova tabela `telegram_config`

```sql
CREATE TABLE telegram_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: usuario so ve/edita o proprio registro
```

### 2. Banco de dados - Nova tabela `preferencias_telegram`

```sql
CREATE TABLE preferencias_telegram (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo_alerta TEXT NOT NULL,
  ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tipo_alerta)
);
-- RLS: usuario so ve/edita o proprio registro
```

### 3. Backend function - `telegram-webhook`

- Recebe mensagens do bot (quando o usuario envia `/start`)
- Gera um codigo de vinculacao e salva o `chat_id` do Telegram
- Responde ao usuario com mensagem de boas-vindas

### 4. Backend function - `telegram-send`

- Recebe `user_id` e lista de alertas
- Consulta `telegram_config` para obter o `chat_id`
- Consulta `preferencias_telegram` para filtrar alertas habilitados
- Envia mensagem formatada via API do Telegram Bot (`sendMessage`)
- Diferencia alertas urgentes (tempo real) de informativos (resumo)

### 5. Backend function - `telegram-daily-summary`

- Funcao agendada (cron) que roda 1x por dia (ex: 8h da manha)
- Para cada usuario com Telegram ativo, coleta alertas do tipo `info`/`success` habilitados
- Envia um resumo consolidado no Telegram

### 6. Frontend - Modificacoes

**Arquivo: `src/pages/ConfiguracoesNotificacoes.tsx`**
- Adicionar secao "Telegram" no topo da pagina com:
  - Status da conexao (conectado/desconectado)
  - Botao "Conectar Telegram" / "Desconectar"
  - Campo para colar o codigo de vinculacao
- Para cada alerta nas categorias, adicionar icone do Telegram indicando se aquele alerta tambem vai pro Telegram

**Arquivo: `src/hooks/useTelegram.ts` (novo)**
- Hook para gerenciar a conexao com Telegram (consultar status, conectar, desconectar)
- Hook para gerenciar preferencias de envio por Telegram

**Arquivo: `src/pages/ConfiguracoesNotificacoes.tsx`**
- Adicionar toggle por alerta para "Enviar no Telegram" ao lado do toggle existente

### 7. Fluxo de envio em tempo real

Quando o frontend detecta um alerta `danger` ou `warning`, chama a backend function `telegram-send` passando os alertas. A funcao verifica as preferencias do usuario e envia apenas os habilitados.

### 8. Secret necessaria

O token do bot do Telegram sera armazenado como secret do projeto (`TELEGRAM_BOT_TOKEN`).

## Sequencia de implementacao

1. Solicitar o token do bot Telegram (secret)
2. Criar tabelas no banco de dados
3. Criar backend function `telegram-webhook` (receber mensagens do bot)
4. Criar backend function `telegram-send` (enviar alertas)
5. Criar backend function `telegram-daily-summary` (resumo diario)
6. Criar hook `useTelegram.ts`
7. Atualizar pagina de configuracoes com secao Telegram
8. Integrar envio de alertas urgentes no fluxo existente


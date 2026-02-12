

# Assistente IA no Telegram - Perguntar Sobre Seus Dados

## O que sera feito

Adicionar um assistente inteligente no bot do Telegram onde voce pode enviar qualquer pergunta em linguagem natural sobre seus dados financeiros e receber uma resposta completa.

**Exemplos de perguntas:**
- "Qual meu saldo atual?"
- "Quanto gastei este mes?"
- "Quais meus cartoes e seus limites?"
- "Quanto tenho investido?"
- "Qual categoria tem mais gastos?"
- "Como estao minhas metas?"

## Como vai funcionar

1. Voce envia qualquer mensagem que nao seja um comando (ex: nao comeca com `/`)
2. O bot busca todos os seus dados financeiros do sistema (transacoes, cartoes, investimentos, metas, bancos, etc.)
3. Envia esses dados como contexto para um modelo de IA (Gemini 2.5 Flash, via Lovable AI)
4. A IA analisa e responde sua pergunta de forma clara e formatada
5. A resposta e enviada de volta no Telegram

## Detalhes Tecnicos

### Arquivo modificado: `supabase/functions/telegram-webhook/index.ts`

### Nova funcao: `handlePergunta`

1. **Identificar usuario**: Buscar `user_id` pelo `chat_id` na `telegram_config`
2. **Buscar dados do usuario** (todas as queries em paralelo para performance):
   - `transactions` - ultimas 100 transacoes (receitas e despesas)
   - `cartoes` - todos os cartoes com limite, fechamento, vencimento
   - `parcelas_cartao` com join em `compras_cartao` - parcelas nao pagas
   - `bancos` - contas bancarias e saldos
   - `metas` - metas de economia
   - `investimentos` - investimentos ativos
   - `profiles` - saldo inicial
   - `categories` - categorias do usuario
   - `orcamentos` - orcamentos do mes atual
3. **Montar contexto**: Criar um resumo estruturado dos dados em texto
4. **Chamar IA**: Enviar a pergunta + contexto para `google/gemini-2.5-flash` via Lovable AI API
5. **Responder**: Enviar resposta formatada no Telegram

### Chamada a IA (usando LOVABLE_API_KEY ja configurado)

```typescript
const response = await fetch("https://lovable.dev/api/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: "Voce e um assistente financeiro..." },
      { role: "user", content: perguntaComContexto },
    ],
  }),
});
```

### Fluxo no webhook

Mensagens que nao sao comandos (`/start`, `/despesas`) serao tratadas como perguntas para a IA:

```typescript
if (text.startsWith("/start")) { ... }
else if (text.startsWith("/despesas")) { ... }
else {
  // Qualquer outra mensagem -> pergunta para IA
  await handlePergunta(supabase, TELEGRAM_BOT_TOKEN, chatId, text);
}
```

### Indicador de "digitando"

Antes de processar, o bot enviara a acao "typing" para o usuario ver que esta processando:

```typescript
await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
  body: JSON.stringify({ chat_id: chatId, action: "typing" }),
});
```

### Limites e seguranca

- Maximo de 100 transacoes no contexto (para nao exceder limites de tokens)
- Timeout de resposta da IA tratado com mensagem de erro amigavel
- Apenas usuarios vinculados podem usar
- Resposta limitada a 4000 chars (dividida se necessario)
- System prompt instruindo a IA a responder apenas sobre financas e nao inventar dados

### Nenhuma mudanca no banco de dados

Nenhuma tabela nova ou alteracao. Usa apenas dados existentes e o `LOVABLE_API_KEY` ja configurado.


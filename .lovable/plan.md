

# Adicionar Comando /despesas no Bot do Telegram

## Objetivo

Permitir que o usuario envie um comando no Telegram (ex: `/despesas` ou `/despesas 3`) para receber uma lista formatada das despesas futuras dos proximos N meses.

## Como vai funcionar

1. O usuario envia `/despesas` no chat do Telegram (padrao: 3 meses)
2. Ou `/despesas 6` para ver 6 meses
3. O bot identifica o usuario pelo `chat_id`, busca parcelas de cartao nao pagas e transacoes pendentes no periodo
4. Envia uma mensagem formatada agrupada por mes com o total

### Exemplo de mensagem enviada pelo bot:

```text
📋 Despesas Futuras (3 meses)

📅 Fevereiro/2026
  • Netflix - R$ 55,90 (Nubank)
  • Mercado - R$ 320,00 (2/5)
  • Aluguel - R$ 1.500,00
  Subtotal: R$ 1.875,90

📅 Marco/2026
  • Netflix - R$ 55,90 (Nubank)
  • Mercado - R$ 320,00 (3/5)
  Subtotal: R$ 375,90

Total geral: R$ 2.251,80
```

## Detalhes Tecnicos

### Arquivo modificado: `supabase/functions/telegram-webhook/index.ts`

Dentro do bloco `if (body.message)`, alem do `/start` existente, adicionar tratamento para `/despesas`:

1. **Parsear o comando**: extrair numero de meses do texto (padrao 3, maximo 12)
2. **Buscar user_id pelo chat_id**: consultar `telegram_config` onde `telegram_chat_id = chatId` e `ativo = true`
3. **Se nao vinculado**: responder pedindo para vincular a conta primeiro
4. **Buscar parcelas de cartao** (`parcelas_cartao` com join em `compras_cartao` e `cartoes`): parcelas nao pagas no periodo
5. **Buscar transacoes pendentes** (`transactions`): despesas com status `pending` no periodo
6. **Formatar mensagem**: agrupar por mes, listar itens com valor e info de parcela/cartao, incluir subtotais e total geral
7. **Enviar via API do Telegram**

### Queries utilizadas

Parcelas de cartao:
```sql
-- parcelas_cartao join compras_cartao join cartoes
-- Filtros: paga = false, ativo = true, mes_referencia entre hoje e N meses
-- user_id vem de compras_cartao.user_id
```

Transacoes pendentes:
```sql
-- transactions
-- Filtros: type = 'expense', status = 'pending', due_date no periodo
-- user_id direto
```

### Limites e seguranca

- Maximo de 12 meses para evitar mensagens muito longas
- Limitar a 50 itens por mes na exibicao (com indicacao de "+X itens")
- Se a mensagem ficar muito longa (>4000 chars), dividir em multiplas mensagens
- Somente usuarios vinculados (com `telegram_config` ativo) podem usar o comando

### Nenhuma mudanca no banco de dados

Todas as tabelas necessarias ja existem (`parcelas_cartao`, `compras_cartao`, `cartoes`, `transactions`, `telegram_config`). A edge function usa `SERVICE_ROLE_KEY` que ja tem acesso total.


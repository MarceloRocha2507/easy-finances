

# Notificacoes Telegram para Compras de Cartao de Credito

## O que sera feito
Quando voce registrar uma nova compra no cartao de credito, o sistema enviara automaticamente uma notificacao no Telegram com os detalhes (descricao, valor, cartao, parcelas, categoria).

## Como vai funcionar

1. **Novo tipo de alerta nas configuracoes**: Um novo toggle na categoria "Cartoes de Credito":
   - "Nova compra registrada" (ativado por padrao)

2. **Envio automatico ao criar compra**: Apos a compra ser salva com sucesso no dialog `NovaCompraCartaoDialog`, o sistema chamara a edge function `telegram-send` para enviar a notificacao.

3. **Respeita as preferencias**: So envia se o toggle correspondente estiver ativado.

## Formato da mensagem no Telegram

```
🛒 Nova Compra no Cartao

📝 Descricao: Supermercado
💳 Cartao: Nubank
💵 Valor: R$ 600,00
🔢 Parcelas: 3x de R$ 200,00
📂 Categoria: Alimentacao
📅 Data: 12/02/2026
```

Para compra unica (sem parcelas):
```
🛒 Nova Compra no Cartao

📝 Descricao: Gasolina
💳 Cartao: Nubank
💵 Valor: R$ 150,00
📅 Data: 12/02/2026
```

## Detalhes Tecnicos

### Arquivo: `src/hooks/usePreferenciasNotificacao.ts`
- Adicionar novo alerta na categoria "cartao":
  - `cartao_nova_compra` - "Nova compra registrada"

### Arquivo: `src/components/cartoes/NovaCompraCartaoDialog.tsx`
- Apos o `criarCompraCartao` ser bem-sucedido (dentro do try, antes do toast), chamar `supabase.functions.invoke('telegram-send')` com:
  - `tipo_alerta`: `cartao_nova_compra`
  - `tipo`: `info`
  - `mensagem`: formatada com descricao, valor, nome do cartao, parcelas e categoria
- O envio sera fire-and-forget (sem aguardar resposta) para nao bloquear a interface
- Obter o `user_id` via `supabase.auth.getUser()` (ja disponivel no contexto)

### Sequencia de implementacao
1. Adicionar o novo tipo de alerta em `usePreferenciasNotificacao.ts`
2. Adicionar a chamada de notificacao no `NovaCompraCartaoDialog.tsx` apos salvar com sucesso
3. Testar criando uma compra de cartao e verificando se a notificacao chega no Telegram


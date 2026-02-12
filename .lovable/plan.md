

# Notificacoes de Despesas e Receitas no Telegram

## O que sera feito
Quando voce registrar uma despesa ou receita, o sistema enviara automaticamente uma notificacao no Telegram com os detalhes do lancamento (tipo, valor, descricao, categoria).

## Como vai funcionar

1. **Novos tipos de alerta nas configuracoes**: Dois novos toggles na categoria "Transacoes":
   - "Nova despesa registrada" (ativado por padrao)
   - "Nova receita registrada" (ativado por padrao)

2. **Envio automatico ao criar transacao**: Apos o registro ser salvo com sucesso, o sistema chamara a backend function `telegram-send` para enviar a notificacao ao grupo/chat vinculado.

3. **Respeita as preferencias**: So envia se o toggle correspondente estiver ativado nas configuracoes do Telegram.

## Detalhes Tecnicos

### Arquivo: `src/hooks/usePreferenciasNotificacao.ts`
- Adicionar dois novos alertas na categoria "transacao":
  - `transacao_nova_despesa` - "Nova despesa registrada"
  - `transacao_nova_receita` - "Nova receita registrada"

### Arquivo: `src/hooks/useTransactions.ts`
- No `onSuccess` de `useCreateTransaction` e `useCreateInstallmentTransaction`, chamar a edge function `telegram-send` passando um alerta com:
  - `tipo_alerta`: `transacao_nova_despesa` ou `transacao_nova_receita`
  - `tipo`: `info`
  - `mensagem`: formatada com descricao, valor e categoria

### Arquivo: `supabase/functions/telegram-send/index.ts`
- Ajustar para aceitar tambem o campo `tipo_alerta` nos alertas, permitindo filtrar por preferencia individual (atualmente filtra por `tipo_alerta` que corresponde aos IDs das preferencias)

### Formato da mensagem no Telegram
```
💸 Nova Despesa Registrada

Descricao: Supermercado
Valor: R$ 250,00
Categoria: Alimentacao
Data: 12/02/2026
```

ou

```
💰 Nova Receita Registrada

Descricao: Salario
Valor: R$ 5.000,00
Categoria: Salario
Data: 12/02/2026
```

### Sequencia de implementacao
1. Adicionar os novos tipos de alerta em `usePreferenciasNotificacao.ts`
2. Criar funcao auxiliar para enviar notificacao Telegram apos criacao de transacao
3. Integrar no `onSuccess` dos hooks de criacao em `useTransactions.ts`
4. Testar o fluxo completo

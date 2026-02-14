
# Corrigir Notificacoes Telegram para Despesas e Receitas

## Problema identificado

A funcao `telegram-send` filtra os alertas com base na tabela `preferencias_telegram`. O codigo atual usa `prefsMap[a.tipo_alerta] === true`, o que significa que se nao houver nenhuma linha na tabela para um determinado tipo de alerta, ele e tratado como **desativado**.

Os tipos `transacao_nova_despesa`, `transacao_nova_receita` e `cartao_nova_compra` foram adicionados recentemente, mas as linhas correspondentes nunca foram criadas na tabela `preferencias_telegram` do usuario. Por isso, todos esses alertas sao silenciosamente descartados.

O sistema de notificacoes internas do app (`preferencias_notificacao`) ja resolve isso corretamente usando a funcao `getValorPadrao()` como fallback. A funcao `telegram-send` precisa do mesmo comportamento.

## Solucao

Alterar a logica de filtragem na edge function `telegram-send` para tratar preferencias ausentes como **ativadas por padrao** (em vez de desativadas).

## Mudancas tecnicas

### Arquivo: `supabase/functions/telegram-send/index.ts`

Alterar o filtro de alertas (linha ~65):

De:
```typescript
const alertasFiltrados = alertas.filter((a: any) => {
  return prefsMap[a.tipo_alerta] === true;
});
```

Para:
```typescript
const alertasFiltrados = alertas.filter((a: any) => {
  // Se nao ha preferencia salva, considerar ativo por padrao
  if (!(a.tipo_alerta in prefsMap)) return true;
  return prefsMap[a.tipo_alerta] === true;
});
```

Isso garante que qualquer tipo de alerta novo funcione imediatamente sem precisar que o usuario va nas configuracoes primeiro. Se o usuario explicitamente desativar um tipo, a preferencia `ativo: false` sera respeitada normalmente.

## Arquivos modificados

- `supabase/functions/telegram-send/index.ts` - Corrigir logica de filtragem de preferencias

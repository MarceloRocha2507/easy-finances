

# Correção: Badge de Notificação Deve Mostrar Todas as Alertas Não Lidas

## Problema Identificado

O sino de notificações na sidebar não mostra badge mesmo quando existem alertas no sistema. Isso acontece porque o código atual filtra para exibir **apenas alertas do tipo `danger` e `warning`**, ignorando alertas do tipo `info` e `success`.

**Exemplo:** Uma conta que vence em 3 dias gera um alerta `info`, mas o badge não aparece porque não é considerado "importante".

## Mudança Proposta

Alterar o `NotificationBadge.tsx` para mostrar **todas as notificações não lidas**, não apenas as importantes.

### Antes (código atual)
```typescript
const { importantes: alertasCount, hasDanger } = useAlertasCount();

{alertasCount > 0 && (
  <span className={...}>...</span>
)}
```

### Depois (código proposto)
```typescript
const { total: alertasCount, hasDanger, hasWarning } = useAlertasCount();

{alertasCount > 0 && (
  <span className={...}>...</span>
)}
```

## Lógica de Cores do Badge

O badge manterá cores diferenciadas baseadas na prioridade:
- **Vermelho** (`bg-destructive`): quando há pelo menos 1 alerta `danger`
- **Amarelo/Laranja** (`bg-amber-500`): quando há pelo menos 1 alerta `warning` (sem danger)
- **Azul/Primary** (`bg-primary`): quando só há alertas `info` ou `success`

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/sidebar/NotificationBadge.tsx` | Usar `total` em vez de `importantes`, ajustar cores |

## Resultado Esperado

- O badge aparecerá sempre que houver **qualquer** notificação não lida
- A cor do badge indicará a gravidade máxima das notificações
- Alertas do tipo `info` (contas próximas do vencimento, metas quase completas) agora serão contabilizados

## Teste de Validação

1. Verificar se o badge aparece quando há alertas tipo `info` não lidos
2. Criar uma transação com vencimento em 3 dias e verificar se o badge aparece
3. Marcar todas as notificações como lidas e verificar se o badge some


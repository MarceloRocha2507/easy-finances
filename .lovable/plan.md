
# Correcao: Registro de Dispositivo nao Funciona

## Problema Encontrado

Ao testar o login e navegar ate a pagina de Seguranca, a secao "Dispositivos Conectados" mostra "0/1 ativos" e "Nenhum dispositivo registrado". A tabela `device_sessions` esta vazia.

### Causa Raiz

O registro de dispositivo depende exclusivamente do evento `SIGNED_IN` no `onAuthStateChange`. Porem:

1. **Sessao restaurada**: Quando o usuario ja tem sessao e recarrega a pagina, o Supabase emite `INITIAL_SESSION` (nao `SIGNED_IN`), e o `getSession()` tambem restaura sem registrar dispositivo.
2. **Senha incorreta no teste**: O login com `demo@fina.app` / `123456` retornou 400 (senha errada), mas o usuario ja estava autenticado por sessao anterior -- portanto o `SIGNED_IN` nunca disparou.

## Solucao

Modificar o `useAuth.tsx` para registrar o dispositivo tambem quando a sessao e restaurada via `getSession()`, alem do evento `SIGNED_IN`.

## Alteracoes

### `src/hooks/useAuth.tsx`

1. No callback de `onAuthStateChange`, adicionar tratamento para `INITIAL_SESSION` alem de `SIGNED_IN`
2. No fallback de `getSession()`, se houver sessao valida e nenhum token local, registrar o dispositivo
3. Garantir que `registerDeviceSession` verifica se ja existe sessao ativa com o token atual antes de criar duplicata (ja faz isso)

```text
Antes:
  onAuthStateChange -> so reage a SIGNED_IN
  getSession -> so seta user/session, nao registra dispositivo

Depois:
  onAuthStateChange -> reage a SIGNED_IN e INITIAL_SESSION
  getSession -> se tem sessao e nao tem token local, registra dispositivo
```

### Validacao

Apos a correcao:
- Fazer logout
- Fazer login novamente
- Navegar ate /perfil/seguranca
- Confirmar que o dispositivo aparece na lista com status "Ativo" e badge "Este dispositivo"

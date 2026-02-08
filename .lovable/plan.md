

# Correcao: Logout Nao Funciona (Desktop e Mobile)

## Problema

O botao de logout (tanto na sidebar quanto na pagina de Seguranca) nao encerra a sessao. O usuario permanece na mesma pagina sem ser redirecionado para /auth.

## Causas Identificadas

1. **`supabase.auth.signOut()` pode falhar silenciosamente** — nao ha tratamento de erro nem fallback para forcar a limpeza do estado local
2. **Interferencia do listener realtime** — quando o usuario clica em "Sair", o `deactivateCurrentSession` atualiza o banco, o que dispara o listener realtime do `useDeviceSessions`. Este listener detecta que a sessao foi desativada e agenda OUTRO `supabase.auth.signOut()` apos 3 segundos com um toast de erro, criando conflito
3. **Estado nao e limpo manualmente** — se o `signOut` da API falhar, o usuario permanece preso porque `user` e `session` nao sao resetados

## Solucao

### 1. `src/hooks/useAuth.tsx` — signOut robusto

Modificar a funcao `signOut` para:
- Envolver `supabase.auth.signOut()` em try/catch
- **Forcar** a limpeza do estado local (`user = null`, `session = null`) independentemente do resultado
- Isso garante que o `ProtectedRoute` redirecione para `/auth` mesmo se a API falhar

### 2. `src/hooks/useDeviceSessions.ts` — evitar interferencia no logout manual

O listener realtime nao deve disparar quando o PROPRIO usuario esta fazendo logout (so quando OUTRO dispositivo desconecta). Para isso:
- Adicionar um flag (`isSigningOut`) que e setado em `true` antes do logout
- No listener realtime, ignorar o evento se `isSigningOut` estiver ativo
- Alternativa mais simples: remover o `supabase.auth.signOut()` do listener e so mostrar o toast (o signOut ja e feito pelo useAuth)

### 3. Limpeza geral

- Limpar o `sessionToken` do localStorage em todos os caminhos de logout
- Resetar o `registeredRef` para permitir re-registro apos novo login

## Detalhes Tecnicos

### useAuth.tsx — nova funcao signOut

```text
signOut:
  1. Setar flag/state indicando logout em andamento
  2. try deactivateCurrentSession (ja tem try/catch)  
  3. try supabase.auth.signOut()
  4. catch -> console.warn
  5. FINALLY (sempre executa):
     - setUser(null)
     - setSession(null)
     - clearSessionToken()
     - registeredRef.current = false
```

Isso garante que mesmo se a API falhar, o estado local e limpo e o ProtectedRoute redireciona para /auth.

### useDeviceSessions.ts — listener realtime

Adicionar verificacao para nao reagir a desativacao da propria sessao durante logout manual. A forma mais simples e exportar um ref compartilhado ou simplesmente nao chamar `supabase.auth.signOut()` no listener (ja que o useAuth cuida disso).

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useAuth.tsx` | Tornar signOut robusto com fallback de limpeza forcada |
| `src/hooks/useDeviceSessions.ts` | Evitar que o listener realtime interfira no logout manual |


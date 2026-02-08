

# Correcao: Logout Manual Travando

## Problema

A funcao `signOut` no `useAuth.tsx` faz `await deactivateCurrentSession(user.id)` antes de chamar `supabase.auth.signOut()`. Se a desativacao da sessao do dispositivo falhar (erro de rede, token inexistente, etc.), a excecao nao e capturada e o `signOut()` nunca executa, travando o logout.

```text
signOut() {
  await deactivateCurrentSession(user.id)   <-- se falhar aqui, para tudo
  await supabase.auth.signOut()             <-- nunca executa
}
```

## Solucao

Envolver `deactivateCurrentSession` em um try/catch para que erros na desativacao do dispositivo **nunca** bloqueiem o logout real.

## Alteracao

### `src/hooks/useAuth.tsx` (funcao `signOut`, linha ~153)

**Antes:**
```typescript
const signOut = async () => {
  if (user) {
    await deactivateCurrentSession(user.id);
  }
  await supabase.auth.signOut();
};
```

**Depois:**
```typescript
const signOut = async () => {
  if (user) {
    try {
      await deactivateCurrentSession(user.id);
    } catch (e) {
      console.warn('Erro ao desativar sessao do dispositivo:', e);
    }
  }
  await supabase.auth.signOut();
};
```

Isso garante que o logout sempre funcione, independentemente do estado da tabela `device_sessions`.


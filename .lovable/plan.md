
# Melhorar o Chat IA - Corrigir Bugs e Adicionar Expiracao de Historico

## Problemas Identificados

1. **Bug de flickering no loading**: O indicador de "digitando" pisca quando a primeira parte do streaming chega, porque a condicao verifica se a ultima mensagem e "assistant" mas o streaming ja adicionou uma
2. **Import nao utilizado**: `ScrollArea` importado mas nao usado
3. **Sem expiracao de historico**: As mensagens ficam para sempre na sessao. Devem expirar apos 20 minutos de inatividade
4. **Sem botao de nova conversa**: Nao tem como limpar o chat manualmente
5. **Bug no edge function**: `getClaims` pode nao existir na versao do SDK - trocar por `getUser`
6. **Textarea nao cresce**: Fica sempre com 1 linha, mesmo com texto longo

## O que sera feito

### Arquivo: `src/components/AiChat.tsx`

1. **Expiracao de historico em 20 minutos**
   - Salvar timestamp da ultima mensagem
   - No useEffect, verificar se passaram 20 minutos desde a ultima atividade
   - Se sim, limpar as mensagens automaticamente
   - Usar `setInterval` de 1 minuto para checar

2. **Botao "Nova conversa"**
   - Adicionar um botao no header do chat para limpar historico manualmente
   - Icone de `RotateCcw` ou `Trash2`

3. **Corrigir bug de loading/flickering**
   - Usar uma ref separada para rastrear se o streaming esta ativo
   - Mostrar loading spinner apenas quando `isLoading` e true E o streaming ainda nao comecou a gerar conteudo

4. **Remover import nao usado** (`ScrollArea`)

5. **Auto-grow do textarea**
   - Ajustar altura automaticamente conforme o usuario digita
   - Maximo de 4 linhas

6. **Animacao de abertura do painel**
   - Adicionar transicao suave ao abrir/fechar o chat

### Arquivo: `supabase/functions/ai-chat/index.ts`

7. **Trocar `getClaims` por `getUser`**
   - Usar `supabase.auth.getUser()` que e o metodo padrao e confiavel
   - Extrair `user.id` do resultado

## Detalhes Tecnicos

### Expiracao de 20 minutos

```typescript
const [lastActivity, setLastActivity] = useState<number>(Date.now());

// Atualizar timestamp a cada mensagem enviada
const send = async () => {
  setLastActivity(Date.now());
  // ...
};

// Verificar expiracao a cada minuto
useEffect(() => {
  const interval = setInterval(() => {
    if (messages.length > 0 && Date.now() - lastActivity > 20 * 60 * 1000) {
      setMessages([]);
    }
  }, 60_000);
  return () => clearInterval(interval);
}, [lastActivity, messages.length]);
```

### Fix do loading

```typescript
const [streamStarted, setStreamStarted] = useState(false);

// No send():
setStreamStarted(false);
// Quando primeiro token chega:
setStreamStarted(true);

// No JSX:
{isLoading && !streamStarted && (
  <div>/* loading spinner */</div>
)}
```

### Fix do edge function

```typescript
// Antes (pode falhar):
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
const userId = claimsData.claims.sub;

// Depois (confiavel):
const { data: { user }, error: userError } = await supabase.auth.getUser();
const userId = user?.id;
```

## Arquivos modificados

- `src/components/AiChat.tsx` - Bugs, expiracao, nova conversa, auto-grow
- `supabase/functions/ai-chat/index.ts` - Fix auth (getClaims -> getUser)

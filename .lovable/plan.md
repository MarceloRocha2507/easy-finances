
# Corrigir conflito de swipe da sidebar com navegacao do browser

## Problema

Os event listeners de touch estao registrados com `{ passive: true }`, o que impede o uso de `e.preventDefault()`. Sem isso, o browser interpreta o swipe horizontal na borda esquerda como gesto nativo de "voltar pagina" (iOS Safari e Chrome Android).

Alem disso, o `edgeThreshold` atual e 30px (muito largo) e nao ha bloqueio de scroll do body quando a sidebar esta aberta.

## Solucao

### 1. `src/hooks/useSwipeGesture.ts` - Bloquear gesto nativo

**Mudancas:**
- Registrar `touchmove` com `{ passive: false }` para poder chamar `e.preventDefault()` quando o swipe horizontal for detectado na zona de borda
- Chamar `e.preventDefault()` no `touchmove` quando estiver rastreando um swipe horizontal (isDragging = true), impedindo o browser de interpretar como "voltar"
- Reduzir `edgeThreshold` padrao de 30px para 20px conforme solicitado
- Adicionar logica para exigir deslocamento minimo de 10px horizontal antes de confirmar que e um swipe (ja existe com 5px, aumentar para melhor discriminacao)

**Logica critica:**
```text
touchstart: passive: true (nao precisa preventDefault aqui)
touchmove: passive: false (permite preventDefault quando tracking horizontal)
  - Se isDragging e direction != null: e.preventDefault() para bloquear gesto do browser
touchend: passive: true
```

### 2. `src/components/Layout.tsx` - Bloquear scroll do body

**Mudancas:**
- Adicionar `useEffect` que aplica `overflow: hidden` no `document.body` quando `sidebarOpen` for `true` no mobile
- Remover ao fechar a sidebar
- Aumentar z-index do overlay de `z-30` para `z-35` (ou manter z-30 mas garantir que sidebar z-40 esta acima)
- Adicionar `touch-action: pan-y` no overlay para evitar conflitos de gesto ao fechar

### 3. Detalhes tecnicos

O ponto chave e que `{ passive: true }` impede `preventDefault()`. A mudanca principal e usar `{ passive: false }` **apenas** no `touchmove`, mantendo `touchstart` e `touchend` como passive para nao afetar performance de scroll.

Isso resolve o conflito porque:
- `preventDefault()` no touchmove cancela o gesto nativo de navegacao do browser
- So e chamado quando o swipe esta sendo rastreado pelo componente (zona de borda + direcao horizontal confirmada)
- Scrolling vertical normal nao e afetado (verticalLock ja descarta esses casos antes do preventDefault)

### Arquivos modificados
1. `src/hooks/useSwipeGesture.ts` - passive: false no touchmove, preventDefault, edgeThreshold 20px
2. `src/components/Layout.tsx` - overflow hidden no body quando sidebar aberta

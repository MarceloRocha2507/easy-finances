
# Corrigir Sidebar Mobile - Swipe e Renderizacao

## Problema

A imagem mostra a sidebar parcialmente aberta com conteudo cortado na borda esquerda (icones invisiveis, texto como "hshboard" ao inves de "Dashboard"). O gesto de swipe continua conflitando com a navegacao nativa do browser (voltar pagina).

Causas identificadas:

1. **`e.preventDefault()` chamado tarde demais**: So e chamado apos confirmar `isDraggingRef.current` (apos 10px de movimento), mas o browser ja iniciou o gesto de "voltar" antes disso
2. **`touchstart` nao bloqueia o gesto nativo**: O listener usa `passive: true`, entao o browser ja agenda seu gesto de navegacao no momento do toque na borda
3. **CSS `touch-action` ausente na zona de borda**: Sem `touch-action: none` na zona de captura, o browser interpreta livremente toques nessa area
4. **Sidebar pode ficar presa em estado parcial**: Se o `touchend` nao disparar (ex: gesto cancelado pelo browser), a sidebar fica travada no meio

## Solucao

### 1. `src/hooks/useSwipeGesture.ts` - Bloquear gesto mais cedo

**Mudancas:**
- Registrar `touchstart` com `{ passive: false }` (nao apenas touchmove) para poder chamar `e.preventDefault()` quando o toque iniciar na zona de borda (primeiros 20px)
- No `handleTouchStart`: se o toque esta na zona de borda e sidebar fechada, chamar `e.preventDefault()` imediatamente para impedir o browser de iniciar o gesto de voltar
- No `handleTouchMove`: chamar `e.preventDefault()` assim que `tracking.current` for true e o movimento horizontal for detectado (antes de confirmar isDragging com 10px)
- Adicionar `touchcancel` listener para limpar estado se o gesto for cancelado pelo sistema

### 2. `src/components/Layout.tsx` - Zona de captura com touch-action

**Mudancas:**
- Adicionar um `div` invisivel fixo na borda esquerda da tela (20px de largura, altura total) com `touch-action: none` quando a sidebar esta fechada no mobile
- Este elemento CSS impede o browser de processar qualquer gesto nativo naquela zona, eliminando o conflito na raiz
- Quando a sidebar esta aberta, aplicar `touch-action: none` ao overlay tambem

### 3. Robustez do estado

**Em `useSwipeGesture.ts`:**
- Adicionar handler para `touchcancel` que reseta o estado (isDragging, dragOffset, tracking) para evitar sidebar presa em estado parcial
- Garantir que `setIsDragging(false)` e `setDragOffset(0)` sao chamados em todos os cenarios de finalizacao

---

## Detalhes tecnicos

### useSwipeGesture.ts - Codigo critico

```text
// touchstart com passive: false na zona de borda
handleTouchStart:
  if (!sidebarOpen && touch.clientX <= edgeThreshold) {
    e.preventDefault()  // NOVO: bloqueia gesto nativo imediatamente
    e.stopPropagation()
    tracking = true
    direction = "open"
  }

// touchmove - preventDefault mais cedo  
handleTouchMove:
  if (tracking && !verticalLock) {
    e.preventDefault()  // MOVIDO: agora antes de confirmar isDragging
    e.stopPropagation()
  }

// NOVO: touchcancel handler
handleTouchCancel:
  tracking = false
  isDragging = false
  dragOffset = 0
  direction = null
```

### Layout.tsx - Zona de captura

```text
{/* Zona de captura na borda esquerda - impede gesto nativo do browser */}
{isMobile && !sidebarOpen && (
  <div
    className="fixed top-0 left-0 bottom-0 w-5 z-50"
    style={{ touchAction: "none" }}
  />
)}
```

### Arquivos modificados
1. `src/hooks/useSwipeGesture.ts` - passive:false no touchstart, preventDefault mais cedo, touchcancel handler
2. `src/components/Layout.tsx` - div de captura na borda esquerda com touch-action:none

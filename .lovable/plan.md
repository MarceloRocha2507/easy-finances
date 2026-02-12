
# Swipe para Abrir a Sidebar no Mobile

## Objetivo

Permitir que o usuario arraste da borda esquerda da tela para abrir a sidebar no celular, igual ao comportamento padrao de apps nativos (Gmail, WhatsApp, etc).

## Como funciona

- Ao tocar na borda esquerda da tela (primeiros 30px) e arrastar para a direita, a sidebar abre
- Ao arrastar a sidebar para a esquerda (ou o overlay), ela fecha
- O comportamento do botao hamburger continua funcionando normalmente
- Funciona apenas no mobile (telas menores que `lg`)

## Detalhes Tecnicos

### Arquivo: `src/hooks/useSwipeGesture.ts` (novo)

Criar um hook customizado que detecta gestos de swipe usando Touch Events:

- `touchstart`: Registra a posicao inicial do toque. So ativa se o toque comeca nos primeiros 30px da borda esquerda (para abrir) ou em qualquer lugar (para fechar, quando a sidebar esta aberta)
- `touchmove`: Calcula o delta horizontal do arraste
- `touchend`: Se o delta for maior que 50px para a direita, abre a sidebar. Se for maior que 50px para a esquerda, fecha

O hook recebe:
- `onSwipeRight`: callback para abrir a sidebar
- `onSwipeLeft`: callback para fechar a sidebar
- `enabled`: boolean para ativar apenas no mobile

### Arquivo: `src/components/Layout.tsx` (modificar)

- Importar e usar o hook `useSwipeGesture` no componente Layout
- Passar `setSidebarOpen(true)` como `onSwipeRight` e `setSidebarOpen(false)` como `onSwipeLeft`
- Usar `useIsMobile()` ou media query para ativar apenas em telas pequenas
- Anexar os event listeners ao elemento raiz do Layout (a div `min-h-screen`)

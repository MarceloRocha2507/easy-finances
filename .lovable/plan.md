
# Criar Pagina Dedicada para a Fina IA

## O que sera feito

Criar uma pagina `/assistente` com o chat da IA ocupando toda a area de conteudo (full-height), integrada ao Layout com sidebar. O botao "Fina IA" na sidebar passara a ser um link de navegacao para essa pagina em vez de abrir o modal overlay. O modal overlay sera removido.

## Mudancas

### 1. Criar `src/pages/Assistente.tsx` (novo arquivo)
- Pagina dedicada que renderiza o chat em tela cheia dentro do Layout
- Reutiliza toda a logica de streaming, expiracao de 20 min, auto-grow, etc. do AiChat atual
- Layout: header com titulo "Fina IA" + botao "Nova conversa", area de mensagens ocupando o restante da tela, input fixo no rodape
- Sugestoes de perguntas quando nao ha mensagens (como ja existe)
- Responsivo: funciona bem em mobile e desktop

### 2. Atualizar `src/components/sidebar/SidebarNav.tsx`
- Trocar o `<button>` da Fina IA por um `<Link to="/assistente">`
- Remover a prop `onAiChatToggle`
- Destacar o item quando a rota ativa for `/assistente`

### 3. Atualizar `src/components/Layout.tsx`
- Remover o estado `aiChatOpen` e o componente `<AiChat />`
- Remover a prop `onAiChatToggle` passada ao SidebarNav
- Remover o import de `AiChat`

### 4. Remover `src/components/AiChat.tsx`
- O componente de overlay nao sera mais necessario

### 5. Atualizar `src/App.tsx`
- Adicionar rota `/assistente` com lazy loading e ProtectedRoute

## Resultado

- O usuario clica em "Fina IA" na sidebar e navega para `/assistente`
- O chat ocupa toda a area de conteudo, com visual limpo e profissional
- A sidebar continua visivel, e o item "Fina IA" fica destacado como ativo
- Toda a logica de streaming, expiracao de historico e auto-grow e mantida

## Arquivos modificados

- `src/pages/Assistente.tsx` - Nova pagina (criar)
- `src/components/sidebar/SidebarNav.tsx` - Link em vez de botao
- `src/components/Layout.tsx` - Remover modal AiChat
- `src/components/AiChat.tsx` - Remover arquivo
- `src/App.tsx` - Adicionar rota /assistente

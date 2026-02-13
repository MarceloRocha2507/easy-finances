
# Mover a IA para a Sidebar

## O que sera feito

Remover o botao flutuante do chat IA da tela e colocar um botao "Fina IA" na sidebar, logo antes da secao do usuario (na parte inferior). Ao clicar, abre o painel de chat no mesmo estilo atual, mas ancorado ao contexto da sidebar.

## Mudancas

### 1. `src/components/sidebar/SidebarNav.tsx`
- Adicionar um botao "Fina IA" com icone `Bot` no final da navegacao (apos o separador e o link Admin)
- O botao tera o mesmo estilo visual dos outros itens da sidebar
- Ao clicar, abre/fecha o painel de chat

### 2. `src/components/AiChat.tsx`
- Remover o botao flutuante (o circulo fixo no canto inferior direito)
- Exportar apenas o painel de chat como componente controlado, recebendo `open` e `onOpenChange` como props
- O painel continuara fixo na tela (position fixed) para nao quebrar o layout da sidebar

### 3. `src/components/Layout.tsx`
- Remover o `<AiChat />` standalone do final do layout
- O chat sera gerenciado a partir da sidebar

### 4. `src/components/sidebar/SidebarUserSection.tsx`
- Adicionar o botao da IA na secao do usuario (ao lado das notificacoes e sair), ou alternativamente manter na SidebarNav

## Abordagem escolhida

Colocar o botao "Fina IA" como item da sidebar (na `SidebarNav`), logo apos o separador. O estado `open` do chat sera gerenciado via estado local no Layout e passado via props para SidebarNav e AiChat. Assim:

- SidebarNav recebe `onAiChatToggle` como prop
- Layout mantem o estado `aiChatOpen` e renderiza o painel do AiChat condicionalmente
- O painel de chat continua como overlay fixo (nao dentro da sidebar, que seria muito estreito)

## Arquivos modificados

- `src/components/AiChat.tsx` - Remover botao flutuante, aceitar props `open`/`onClose`
- `src/components/sidebar/SidebarNav.tsx` - Adicionar item "Fina IA" com icone Bot
- `src/components/Layout.tsx` - Gerenciar estado do chat, passar props, remover AiChat standalone

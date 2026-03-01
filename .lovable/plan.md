

# Remover Simulador do Menu Lateral

## O que será feito

Remover o item "Simulador" do submenu de Transações no menu lateral. A rota `/transactions/simulador` continua existindo e acessível por botões/links (como o botão "Simular Compra" no Dashboard), mas não aparece mais como item de navegação no sidebar.

## Alteração

### `src/components/sidebar/SidebarNav.tsx`

Remover a linha `{ icon: Calculator, label: "Simulador", href: "/transactions/simulador" }` do array `subItems` dentro de `transacoesMenu`. Também remover o import do ícone `Calculator` se não for mais usado em outro lugar deste arquivo.


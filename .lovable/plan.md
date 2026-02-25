
# Refinamento da Sidebar Navigation

## Alteracoes

### 1. `src/index.css` -- Estilos CSS

- **`.menu-item-active`**: Mudar borda de `3px` para `2px`. Manter `font-weight: 600` e `color: hsl(var(--foreground))`.
- **`.menu-item-hover:hover`**: Mudar cor para `#374151` ao inves de `hsl(var(--foreground))` para hover mais sutil.
- **`.submenu-item-active`**: Ja esta com `2px`, manter.

### 2. `src/components/sidebar/SidebarNav.tsx` -- Itens de navegacao

- **Icones**: Adicionar classe de opacidade condicional nos icones -- `opacity-100` quando ativo, `opacity-50` quando inativo. No hover, usar `group-hover:opacity-75`.
- **Wrapper com `group`**: Adicionar `group` class nos Links para permitir hover no icone via parent.
- **Hover**: Adicionar `hover:text-[#374151]` nos itens inativos.
- **Separador**: Remover o `<div>` com `border-t` (linha visivel). Substituir por `mt-2` (8px spacing) no link "Novidades". Manter `mt-1` no Admin e Fina IA (ja presente).
- **Collapsible triggers**: O `menu-item-active` no trigger do collapsible so deve aparecer quando `isMenuActive` e true (nao quando apenas `open`). Isso evita que abrir o menu sem estar na rota marque como ativo.

### 3. `src/components/sidebar/MenuCollapsible.tsx` -- Menus colapsaveis

- **Trigger ativo**: Mudar logica de `open || isMenuActive` para apenas `isMenuActive`. O menu aberto sem rota ativa nao deve ter borda lateral.
- **Icones**: Adicionar opacidade condicional -- `opacity-100` quando ativo, `opacity-50` quando inativo, com `group-hover:opacity-75`.
- **Sub-itens icones**: Mesma logica de opacidade.

### Resumo das mudancas

| O que | De | Para |
|-------|-----|------|
| Borda ativa | 3px | 2px |
| Trigger collapsible ativo | `open \|\| isMenuActive` | `isMenuActive` apenas |
| Icone inativo | mesma cor do texto | `opacity-50` |
| Icone ativo | mesma cor do texto | `opacity-100` |
| Hover cor | `#111827` | `#374151` |
| Separador | `border-t` visivel | Removido, usar `mt-2` |

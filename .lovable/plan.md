
# Redesign Premium da Sidebar -- Estilo Notion/Linear

Redesign completo da sidebar para um visual minimalista, tipografico e premium, removendo backgrounds preenchidos, icones coloridos e containers tipo card. A identidade visual passa a ser baseada em tipografia, borda lateral de estado ativo, e transicoes de cor sutis.

## Arquivos Modificados

### 1. `src/index.css` -- Estilos base da sidebar

Substituir os estilos utilitarios da sidebar por novos:

- **`.sidebar-floating`**: Remover box-shadow complexo. Usar `background: #FAFAFA` (light) / dark mode existente, com apenas `border-right: 1px solid #E5E7EB`. Sem border-radius (sidebar e flush na lateral).
- **`.menu-item-floating-active`**: Remover `background` e `border-radius`. Adicionar `border-left: 3px solid #111827` (ou `hsl(var(--foreground))`), `font-weight: 600`, `color: #111827`.
- **`.menu-item-floating-hover`**: Remover `background` no hover. Manter apenas transicao de cor: `color: #111827` no hover.
- **`.submenu-item-floating-active`**: Mesmo padrao -- sem background, com `border-left: 2px solid #111827` e texto bold.

### 2. `src/components/Layout.tsx` -- Container da sidebar

- **Desktop sidebar**: Remover `p-3` wrapper e `border-radius` do aside. A sidebar deve ser flush (colada na borda), fundo `bg-[#FAFAFA]` com `border-r border-[#E5E7EB]`. Sem classe `sidebar-floating`.
- **Mobile sidebar**: Manter drawer behavior mas aplicar mesmo fundo e remover sombra card-style.
- **Logo area**: Remover o icone `Wallet` do container colorido (`bg-primary/10`). Usar icone `Wallet` em cinza monocromatico (`text-[#111827]`). Texto "Fina" com `text-xl font-bold text-[#111827]`.

### 3. `src/components/sidebar/SidebarNav.tsx` -- Itens de navegacao

- **Remover icon containers** (os `div` com `w-8 h-8 rounded-lg bg-primary/15`). Icones ficam inline, sem wrapper.
- **Item ativo**: Classe com `border-l-[3px] border-[#111827] font-semibold text-[#111827]` e padding-left ajustado. Icone em `text-[#374151]`.
- **Item inativo**: `text-[#6B7280]`, hover `text-[#111827]` via `hover:text-[#111827]`. Sem background no hover.
- **Padding**: Reduzir de `py-2.5` para `py-2` (10px) para ritmo editorial mais apertado.
- **Separador antes de Novidades/Admin**: Manter o `border-t` existente. Adicionar `mt-2` (8px gap) antes dos itens secundarios.
- **Remover link "Fina IA"** e import `Bot` (ja planejado anteriormente).

### 4. `src/components/sidebar/MenuCollapsible.tsx` -- Menus colapsaveis

- **Trigger button**: Mesmo padrao -- sem background, left-border quando ativo, icone inline sem wrapper.
- **Chevron**: Reduzir para `h-3.5 w-3.5` com `strokeWidth={1.5}`. Manter animacao `rotate-180` existente.
- **Sub-items**: Sem background no ativo. Usar `border-l-2 border-[#111827]` + bold. Sem hover background.

### 5. `src/components/sidebar/SidebarUserSection.tsx` -- Footer do usuario

- **Avatar**: Trocar circulo por quadrado arredondado. `rounded-md` (6px) ao inves de `rounded-full`. Fundo `bg-[#1F2937]` com texto branco para iniciais. Remover `ring-2 ring-primary/20`.
- **Username**: `font-semibold text-[#111827]` (mais bold).
- **Versao**: `text-[10px] text-[#9CA3AF]`.
- **Icones (bell, logout)**: Cor `text-[#9CA3AF]`, hover `text-[#111827]`. Remover `hover:bg-muted/50` background.

### 6. `src/components/sidebar/NotificationBadge.tsx` -- Sino de notificacao

- Cor base do icone: `text-[#9CA3AF]`, hover `text-[#111827]`. Remover hover background.

### 7. `src/components/ui/avatar.tsx` -- Fallback shape

- Nenhuma mudanca global no componente -- as mudancas de `rounded-full` para `rounded-md` serao aplicadas inline no `SidebarUserSection`.

## Resumo Visual

```text
+---------------------------+
| [W] Fina                  |  <- Monochrome icon, bold text
+---------------------------+
| | Dashboard               |  <- Active: left bar + bold
|   Bancos                  |  <- Inactive: gray, no bg
|   Categorias              |
|   Metas                   |
|                           |
|   v Transacoes            |  <- Chevron thin, no bg
|       Visao Geral         |
|       Importar            |
|       Despesas Futuras    |
|                           |
|   v Cartoes               |
|   > Relatorios            |
|                           |
|  -------------------------+  <- Separator
|   Novidades               |
|   Admin                   |
+---------------------------+
| [JD] John Doe    [B] [>]  |  <- Square avatar, gray icons
|      v2.4.0               |
+---------------------------+
```

Todos os itens: sem background fill, sem icones coloridos, sem containers. Cor usada apenas para sinalizar estado ativo via borda lateral esquerda.

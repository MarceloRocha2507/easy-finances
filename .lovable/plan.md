

# Plano: Sidebar Floating/Detached (Discord/Figma)

## Visão Geral do Estilo

O estilo **Floating/Detached** é inspirado no Discord e Figma, com:

- **Container "flutuante"** com margem da borda da tela
- **Cantos arredondados** em toda a sidebar (rounded-2xl)
- **Sombra suave** dando efeito de elevação
- **Background sólido** que se destaca do fundo
- **Items com pills arredondados** quando ativos
- **Espaçamento interno generoso**

```text
    ┌──────────────────────────────────────────────┐
    │                                              │
    │   ╭────────────────────────╮                 │
    │   │  🎵 Fina               │                 │
    │   ├────────────────────────┤                 │
    │   │                        │                 │
    │   │  ╭──────────────────╮  │                 │
    │   │  │ 📊 Dashboard     │  │  ← Pill ativo   │
    │   │  ╰──────────────────╯  │                 │
    │   │                        │                 │
    │   │    🏷️ Categorias       │                 │
    │   │                        │                 │
    │   │    ↔️ Transações    ▼  │                 │
    │   │       ├─ Visão Geral   │                 │
    │   │       ├─ Recorrentes   │                 │
    │   │       └─ Importar      │                 │
    │   │                        │                 │
    │   │    💳 Cartões       ▼  │                 │
    │   │    🐷 Economia      ▼  │                 │
    │   │    📈 Relatórios    ▼  │                 │
    │   │                        │                 │
    │   ├────────────────────────┤                 │
    │   │  👤 João · 🔔 · 🚪     │                 │
    │   ╰────────────────────────╯                 │
    │                                              │
    └──────────────────────────────────────────────┘
          ↑ Margem                   ↑ Content
```

---

## Características Visuais

| Elemento | Estilo Atual (Gradient) | Novo Estilo (Floating) |
|----------|------------------------|------------------------|
| Container | Fixo na borda, `border-r` | Margem 12px, `rounded-2xl`, sombra |
| Background | Gradiente vertical | Sólido com borda sutil |
| Item Ativo | Gradiente + barra lateral | Pill arredondado, sem barra |
| Item Hover | Gradiente horizontal | Pill transparente suave |
| Ícone Ativo | Glow colorido | Círculo sólido suave |
| Submenus | Linha gradiente lateral | Indentação simples |
| Footer | Borda superior | Separador suave, arredondado |

---

## Alterações Detalhadas

### 1. Atualizar CSS (index.css)

**Substituir** as classes do Gradient Accent por classes do Floating:

```css
/* Floating Sidebar Container */
.sidebar-floating {
  background: hsl(var(--card));
  border-radius: 1rem;
  box-shadow: 
    0 4px 6px -1px hsl(0 0% 0% / 0.05),
    0 10px 15px -3px hsl(0 0% 0% / 0.08),
    0 0 0 1px hsl(var(--border) / 0.5);
}

.dark .sidebar-floating {
  background: hsl(220 15% 13%);
  box-shadow: 
    0 4px 6px -1px hsl(0 0% 0% / 0.2),
    0 10px 15px -3px hsl(0 0% 0% / 0.3),
    0 0 0 1px hsl(0 0% 100% / 0.05);
}

/* Menu item ativo - pill style */
.menu-item-floating-active {
  background: hsl(var(--primary) / 0.1);
  border-radius: 0.75rem;
}

/* Menu item hover */
.menu-item-floating-hover:hover {
  background: hsl(var(--muted) / 0.5);
  border-radius: 0.75rem;
}

/* Submenu ativo */
.submenu-item-floating-active {
  background: hsl(var(--primary) / 0.08);
  border-radius: 0.5rem;
}
```

### 2. Atualizar Layout.tsx

**Mudanças principais:**
- Adicionar wrapper com padding para o efeito "flutuante"
- Sidebar com `rounded-2xl` e margem
- Remover `border-r`, usar sombra
- Ajustar posicionamento do main content

```tsx
{/* Sidebar Floating */}
<div className="hidden lg:block fixed top-0 left-0 h-full w-64 p-3 z-40">
  <aside className="h-full sidebar-floating flex flex-col overflow-hidden">
    {/* Logo */}
    <div className="h-14 flex items-center px-4 border-b border-border/30">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xl font-bold text-foreground">Fina</span>
      </div>
    </div>

    {/* Navigation */}
    <SidebarNav isAdmin={!isCheckingRole && isAdmin} onItemClick={closeSidebar} />

    {/* User section */}
    <SidebarUserSection user={user} onClose={closeSidebar} onSignOut={signOut} />
  </aside>
</div>

{/* Main content com offset para sidebar flutuante */}
<main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
```

### 3. Atualizar SidebarNav.tsx

**Mudanças nos items:**
- Usar `menu-item-floating-active` para items ativos
- Remover ícone com glow, usar background sólido suave
- Pills totalmente arredondados

```tsx
<Link
  className={cn(
    "group flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150",
    isActive(item.href)
      ? "menu-item-floating-active text-foreground font-medium"
      : "text-muted-foreground menu-item-floating-hover"
  )}
>
  <div className={cn(
    "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150",
    isActive(item.href)
      ? "bg-primary/15 text-primary"
      : "text-muted-foreground group-hover:text-foreground"
  )}>
    <item.icon className="h-4 w-4" />
  </div>
  {item.label}
</Link>
```

### 4. Atualizar MenuCollapsible.tsx

**Mudanças:**
- Trigger com estilo pill arredondado
- Remover linha gradiente lateral nos submenus
- Submenus com indentação simples e pills menores

```tsx
{/* Trigger */}
<button
  className={cn(
    "group w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all duration-150",
    open || isMenuActive
      ? "menu-item-floating-active text-foreground font-medium"
      : "text-muted-foreground menu-item-floating-hover"
  )}
>

{/* Submenus - sem linha lateral */}
<CollapsibleContent className="mt-1 ml-11 space-y-0.5">
  {subItems.map((subItem) => (
    <Link
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 text-sm transition-all duration-150",
        isItemActive(subItem.href)
          ? "submenu-item-floating-active text-primary font-medium"
          : "text-muted-foreground hover:text-foreground menu-item-floating-hover"
      )}
    >
```

---

## Comparação Visual

**ANTES (Gradient Accent):**
```text
│▌ 📊 Dashboard        │  ← Barra lateral + gradiente
│                      │
│   └─ Sub item        │  ← Linha gradiente lateral
```

**DEPOIS (Floating):**
```text
│  ╭──────────────╮    │
│  │ 📊 Dashboard │    │  ← Pill arredondado completo
│  ╰──────────────╯    │
│      Sub item        │  ← Indentação simples
```

---

## Mobile Experience

Para mobile, manter o comportamento de drawer mas com visual arredondado:

```tsx
{/* Mobile Sidebar - aparece como drawer com cantos arredondados */}
<aside
  className={cn(
    "lg:hidden fixed top-16 left-3 right-3 bottom-3 sidebar-floating z-40 transition-all duration-300",
    sidebarOpen 
      ? "translate-y-0 opacity-100" 
      : "translate-y-4 opacity-0 pointer-events-none"
  )}
>
```

---

## Resumo dos Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/index.css` | Substituir classes gradient por floating (.sidebar-floating, .menu-item-floating-active, etc) |
| `src/components/Layout.tsx` | Wrapper com padding, sidebar arredondada, ajustar offset do main |
| `src/components/sidebar/SidebarNav.tsx` | Aplicar estilos pill nos items |
| `src/components/sidebar/MenuCollapsible.tsx` | Remover linha gradiente, pills arredondados |

---

## Resultado Esperado

1. **Sidebar destacada** - Efeito de elevação com sombra
2. **Visual moderno** - Cantos arredondados em todo lugar
3. **Respiro visual** - Margem da borda cria sensação de "app dentro do app"
4. **Items suaves** - Pills arredondados sem elementos agressivos
5. **Dark mode elegante** - Sombras mais intensas, background diferenciado
6. **Performance mantida** - Sem backdrop-filter, transições rápidas (150ms)


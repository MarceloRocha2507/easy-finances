

# Plano: Sidebar Gradient Accent (Spotify/Instagram)

## Visão Geral do Estilo

O estilo **Gradient Accent** é inspirado no Spotify e Instagram, com:

- **Background com gradiente sutil** de cima para baixo
- **Items ativos com gradiente vibrante** (primary → accent)
- **Ícones com glow colorido** quando ativos
- **Transições suaves** de cor no hover
- **Logo com gradiente animado** (opcional)
- **Submenus com destaque em gradiente lateral**

```text
+------------------------------------------+
|  ┌────────────────────────────────────┐  |
|  │  🎵 Fina        ← Gradient logo    │  |
|  └────────────────────────────────────┘  |
|                                          |
|  ╔════════════════════════════════════╗  |
|  ║  📊 Dashboard   ← Active gradient  ║  |
|  ╚════════════════════════════════════╝  |
|                                          |
|    🏷️ Categorias                         |
|                                          |
|  ───────────────────────────────────     |
|                                          |
|    ↔️ Transações                    ▼    |
|       │                                  |
|       ├── Visão Geral                    |
|       ├── Recorrentes                    |
|       └── Importar                       |
|                                          |
|    💳 Cartões                       ▼    |
|    🐷 Economia                      ▼    |
|    📈 Relatórios                    ▼    |
|                                          |
+------------------------------------------+
|  👤 João · 🔔 · 🚪                       |
+------------------------------------------+
```

---

## Características Visuais

| Elemento | Estilo Atual | Novo Estilo (Gradient) |
|----------|--------------|------------------------|
| Sidebar BG | Sólido `bg-background/95` | Gradiente sutil vertical |
| Item Ativo | `bg-background/80 border` | Gradiente horizontal vibrante |
| Item Hover | `hover:bg-muted/50` | Gradiente hover suave |
| Ícone Ativo | `bg-primary/10 text-primary` | Glow com gradiente |
| Subitem Ativo | `bg-primary/5` | Barra lateral gradiente |
| Logo | Gradiente simples | Gradiente animado (shimmer) |

---

## Alterações Detalhadas

### 1. Adicionar CSS para Gradientes (index.css)

Novos utilitários CSS para o estilo Gradient Accent:

```css
/* Gradient Accent Sidebar */
.sidebar-gradient {
  background: linear-gradient(
    180deg,
    hsl(var(--background)) 0%,
    hsl(var(--muted) / 0.3) 100%
  );
}

.dark .sidebar-gradient {
  background: linear-gradient(
    180deg,
    hsl(220 15% 12%) 0%,
    hsl(220 15% 8%) 100%
  );
}

/* Item ativo com gradiente */
.menu-item-active {
  background: linear-gradient(
    135deg,
    hsl(var(--primary) / 0.15) 0%,
    hsl(var(--primary) / 0.08) 100%
  );
  border-left: 3px solid hsl(var(--primary));
}

/* Hover com gradiente suave */
.menu-item-hover:hover {
  background: linear-gradient(
    90deg,
    hsl(var(--muted) / 0.5) 0%,
    transparent 100%
  );
}

/* Icon glow effect */
.icon-glow {
  box-shadow: 0 0 12px hsl(var(--primary) / 0.4);
}

/* Animated gradient logo */
.logo-shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--primary)) 0%,
    hsl(280 60% 55%) 50%,
    hsl(var(--primary)) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### 2. Atualizar Layout.tsx - Sidebar Container

**Mudanças:**
- Substituir `bg-background/95` por `sidebar-gradient`
- Atualizar logo com efeito shimmer
- Adicionar borda inferior colorida no header

```tsx
{/* Sidebar com gradiente */}
<aside
  className={cn(
    "fixed top-0 left-0 h-full w-60 sidebar-gradient border-r border-border/30 z-40 transition-transform duration-200",
    "lg:translate-x-0",
    sidebarOpen ? "translate-x-0" : "-translate-x-full"
  )}
>
  {/* Logo com shimmer */}
  <div className="h-14 flex items-center px-4 border-b border-primary/20">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
        <Wallet className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold logo-shimmer">Fina</span>
    </div>
  </div>
```

### 3. Atualizar SidebarNav.tsx - Items com Gradiente

**Mudanças nos items principais:**
- Item ativo: gradiente + barra lateral colorida
- Item hover: gradiente suave da esquerda
- Ícone ativo: círculo com glow

```tsx
{/* Item ativo */}
<Link
  className={cn(
    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
    isActive(item.href)
      ? "menu-item-active text-foreground font-medium"
      : "text-muted-foreground menu-item-hover"
  )}
>
  <div className={cn(
    "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
    isActive(item.href)
      ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground icon-glow"
      : "text-muted-foreground group-hover:text-foreground"
  )}>
    <item.icon className="h-4 w-4" />
  </div>
  {item.label}
</Link>
```

### 4. Atualizar MenuCollapsible.tsx - Submenus

**Mudanças:**
- Trigger ativo: mesmo estilo gradiente dos items
- Subitem ativo: barra lateral gradiente + texto colorido
- Linha conectora com gradiente

```tsx
{/* Container do submenu com linha gradiente */}
<CollapsibleContent className="mt-1 ml-7 pl-3 border-l-2 border-gradient-to-b from-primary/40 to-transparent space-y-0.5 overflow-hidden">
  {subItems.map((subItem) => (
    <Link
      className={cn(
        "group/item flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
        isItemActive(subItem.href)
          ? "bg-gradient-to-r from-primary/10 to-transparent text-primary font-medium border-l-2 border-primary -ml-[2px] pl-[14px]"
          : "text-muted-foreground hover:text-foreground menu-item-hover"
      )}
    >
```

---

## Paleta de Cores (Gradientes)

| Gradiente | Uso | Cores |
|-----------|-----|-------|
| Sidebar BG | Background geral | background → muted/30 |
| Item Ativo | Menu selecionado | primary/15 → primary/8 |
| Item Hover | Hover em items | muted/50 → transparent |
| Ícone Ativo | Círculo do ícone | primary → primary/70 |
| Subitem Ativo | Destaque submenu | primary/10 → transparent |
| Logo | Texto "Fina" | primary → violet → primary (animado) |

---

## Comparação Visual

**ANTES (Pills):**
```text
┌─────────────────────────┐
│ ┌───┐                   │
│ │ 📊│ Dashboard         │  ← Pill com borda
│ └───┘                   │
└─────────────────────────┘
```

**DEPOIS (Gradient):**
```text
┃ ┌─────────────────────┐ │
┃ │ 📊 Dashboard        │ │  ← Barra lateral + gradiente
┃ └─────────────────────┘ │
```

---

## Resumo dos Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/index.css` | Adicionar utilitários `.sidebar-gradient`, `.menu-item-active`, `.menu-item-hover`, `.icon-glow`, `.logo-shimmer` |
| `src/components/Layout.tsx` | Aplicar `sidebar-gradient`, logo com shimmer |
| `src/components/sidebar/SidebarNav.tsx` | Aplicar estilos gradient nos items |
| `src/components/sidebar/MenuCollapsible.tsx` | Aplicar estilos gradient nos submenus |

---

## Resultado Esperado

1. **Sidebar com profundidade** - Gradiente vertical dá sensação de profundidade
2. **Items com destaque vibrante** - Gradiente + barra lateral chama atenção
3. **Ícones com presença** - Glow colorido destaca o item ativo
4. **Logo memorável** - Efeito shimmer animado
5. **Transições suaves** - 200ms para mudanças de estado
6. **Dark mode compatível** - Gradientes ajustados para cada modo




# Plano: Otimização de Performance da Sidebar

## Problemas Identificados

### 1. Hooks Pesados no Layout
O componente `Layout.tsx` (que contém a sidebar) está chamando hooks muito pesados que causam re-renders constantes:

| Hook | Problema |
|------|----------|
| `useAlertasCount()` | Chama `useNotificacoes()` que chama `useAlertasCompletos()` |
| `useAlertasCompletos()` | Chama `useDashboardCompleto()` que faz **5+ queries** ao banco |
| `useProfile()` | Query para buscar dados do perfil |
| `useAdmin()` | Usa `useState` + `useEffect` (não tem staleTime) |

**Resultado**: A cada navegação, toda a cadeia de hooks é re-executada, gerando centenas de re-renders e requisições desnecessárias.

### 2. Sincronização de Estado com useEffect
O `useEffect` que sincroniza estados de menus com a rota (linhas 104-110) roda a cada mudança de pathname, disparando 4 `setState` simultaneamente:

```tsx
useEffect(() => {
  const path = location.pathname;
  setTransacoesOpen(path.startsWith("/transactions"));
  setCartoesOpen(path.startsWith("/cartoes"));
  setEconomiaOpen(path.startsWith("/economia"));
  setRelatoriosOpen(path.startsWith("/reports"));
}, [location.pathname]);
```

### 3. Efeito Glass com backdrop-filter
O efeito `.glass` usa `backdrop-filter: blur(20px)` que é computacionalmente caro, especialmente em:
- Sidebar inteira (elemento fixo de 240x100vh)
- Cada item de menu ativo
- Mobile header

### 4. Animações Excessivas
O `MenuCollapsible` tem múltiplas animações:
- `animate-fade-in` com delay staggered em cada sub-item
- `animate-accordion-down/up` no CollapsibleContent
- `transition-all duration-200` em vários elementos
- `group-hover:scale-110` nos ícones

---

## Solução Proposta

### Estratégia 1: Separar Sidebar do Layout Principal
Criar um componente `SidebarContainer` que:
- Usa `React.memo` com comparação customizada
- Isola os hooks pesados para não afetar a navegação

### Estratégia 2: Lazy Loading do Badge de Notificações
O badge de notificações não precisa ser preciso instantaneamente. Podemos:
- Carregar o count com debounce
- Usar o valor em cache por mais tempo
- Mover a lógica para um componente separado

### Estratégia 3: Simplificar Efeitos Visuais
- Remover `backdrop-filter` do sidebar (usar fundo sólido ou semi-transparente)
- Reduzir transições de 200ms para 150ms ou removê-las
- Eliminar animações de hover em dispositivos móveis

### Estratégia 4: Otimizar Gestão de Estado dos Menus
Consolidar os 4 estados de menu em um único estado ou derivar da URL diretamente.

---

## Alterações Detalhadas

### 1. Criar `SidebarNav.tsx` Memoizado (novo arquivo)

```tsx
// src/components/sidebar/SidebarNav.tsx
import React, { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MenuCollapsible } from "./MenuCollapsible";
// ... imports de ícones

const mainMenuItems = [...];
const transacoesMenu = {...};
const cartoesMenu = {...};
const economiaMenu = {...};
const relatoriosMenu = {...};

interface SidebarNavProps {
  isAdmin: boolean;
  onItemClick?: () => void;
}

export const SidebarNav = memo(function SidebarNav({ isAdmin, onItemClick }: SidebarNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

  // Derivar estados diretamente do pathname (sem useState/useEffect)
  const transacoesOpen = pathname.startsWith("/transactions");
  const cartoesOpen = pathname.startsWith("/cartoes");
  const economiaOpen = pathname.startsWith("/economia");
  const relatoriosOpen = pathname.startsWith("/reports");

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {/* Menu items renderizados aqui */}
    </nav>
  );
});
```

### 2. Criar `NotificationBadge.tsx` Isolado (novo arquivo)

```tsx
// src/components/sidebar/NotificationBadge.tsx
import React, { memo } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlertasCount } from "@/hooks/useAlertasCount";

interface NotificationBadgeProps {
  onClick?: () => void;
}

export const NotificationBadge = memo(function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const { importantes: alertasCount, hasDanger } = useAlertasCount();

  return (
    <Link 
      to="/notificacoes" 
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Bell className="h-4 w-4 text-muted-foreground" />
      {alertasCount > 0 && (
        <span 
          className={cn(
            "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full text-[9px] font-bold text-white px-1",
            hasDanger ? "bg-expense" : "bg-warning"
          )}
        >
          {alertasCount > 9 ? "9+" : alertasCount}
        </span>
      )}
    </Link>
  );
});
```

### 3. Simplificar Layout.tsx

```tsx
// src/components/Layout.tsx
import { SidebarNav } from "@/components/sidebar/SidebarNav";
import { NotificationBadge } from "@/components/sidebar/NotificationBadge";
import { SidebarUserSection } from "@/components/sidebar/SidebarUserSection";

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { isAdmin, isCheckingRole } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Sidebar com fundo sólido ao invés de glass */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-60 bg-background/95 border-r border-border/50 z-40 transition-transform duration-200",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border/50">
          ...
        </div>

        {/* Navigation - memoizado */}
        <SidebarNav isAdmin={!isCheckingRole && isAdmin} onItemClick={closeSidebar} />

        {/* User section - isolado */}
        <SidebarUserSection 
          user={user} 
          onClose={closeSidebar} 
          onSignOut={signOut} 
        />
      </aside>
      
      {/* Main content */}
      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}
```

### 4. Otimizar MenuCollapsible.tsx

**Remover animações pesadas:**

```tsx
// ANTES
<CollapsibleContent className="mt-1.5 ml-5 space-y-1 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
  {subItems.map((subItem, index) => (
    <Link
      style={{ animationDelay: `${index * 50}ms` }}
      className="animate-fade-in opacity-0 [animation-fill-mode:forwards]"
    >

// DEPOIS
<CollapsibleContent className="mt-1.5 ml-5 space-y-1 overflow-hidden">
  {subItems.map((subItem) => (
    <Link
      className={cn(
        "group/item flex items-center justify-between px-3 py-2 rounded-lg text-sm",
        isItemActive(subItem.href)
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
```

**Remover scale no hover:**

```tsx
// ANTES
<Icon className="h-4 w-4 transition-transform duration-200" />
<div className="group-hover:scale-110">

// DEPOIS
<Icon className="h-4 w-4" />
<div>
```

### 5. Simplificar CSS do Glass

```css
/* ANTES */
.glass {
  background: hsl(var(--glass-bg));
  backdrop-filter: blur(20px);
  border: 1px solid hsl(var(--glass-border));
  box-shadow: var(--glass-shadow);
}

/* DEPOIS - usar apenas para elementos pequenos */
.glass {
  background: hsl(var(--background) / 0.95);
  border: 1px solid hsl(var(--border) / 0.5);
}

/* Glass com blur apenas para popover/dropdown pequenos */
.glass-blur {
  background: hsl(var(--glass-bg));
  backdrop-filter: blur(12px);
}
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/sidebar/SidebarNav.tsx` | **CRIAR** - Navegação memoizada |
| `src/components/sidebar/NotificationBadge.tsx` | **CRIAR** - Badge isolado |
| `src/components/sidebar/SidebarUserSection.tsx` | **CRIAR** - Seção usuário isolada |
| `src/components/sidebar/index.ts` | **EDITAR** - Exportar novos componentes |
| `src/components/Layout.tsx` | **EDITAR** - Simplificar e usar novos componentes |
| `src/components/sidebar/MenuCollapsible.tsx` | **EDITAR** - Remover animações pesadas |
| `src/index.css` | **EDITAR** - Simplificar .glass |

---

## Resultado Esperado

1. **Navegação fluida** - Sem travamentos ao clicar nos menus
2. **Menos re-renders** - Hooks pesados isolados em componentes memoizados
3. **Melhor performance em mobile** - Sem backdrop-filter pesado
4. **Manutenção simplificada** - Componentes menores e focados


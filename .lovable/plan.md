

# Plano: Correção dos Submenus e Novo Design da Sidebar

## Problema 1: Subcategorias não Abrem

### Causa Raiz
Na refatoração anterior, os menus collapsibles recebem:
```tsx
open={menuStates.transacoes}  // Derivado da URL
onOpenChange={noopHandler}     // Handler que não faz nada!
```

Isso significa que:
- O menu só abre quando você **já está** dentro daquele caminho
- Clicar no menu para expandir/colapsar **não funciona**

### Solução
Manter estado local para permitir toggle manual, mas **inicializar** com base na URL:

```tsx
// Estado local que pode ser alterado pelo clique
const [openMenus, setOpenMenus] = useState({
  transacoes: pathname.startsWith("/transactions"),
  cartoes: pathname.startsWith("/cartoes"),
  economia: pathname.startsWith("/economia"),
  relatorios: pathname.startsWith("/reports"),
});

// Handler real para toggle
const handleMenuChange = (menu: string, open: boolean) => {
  setOpenMenus(prev => ({ ...prev, [menu]: open }));
};
```

---

## Problema 2: Novo Design da Sidebar

Vou apresentar 3 opções de design moderno inspiradas em fintechs populares:

### Opção A: Minimalista Flat (estilo Linear/Notion)
- Fundo branco puro sem bordas laterais
- Ícones em cinza, sem backgrounds nos items
- Hover sutil apenas com mudança de cor
- Submenus mostrados inline com indentação

### Opção B: Cards Pill (estilo Nubank/PicPay) - **Recomendado**
- Fundo claro com borda sutil
- Items ativos com background pill arredondado colorido
- Ícones em círculos coloridos quando ativos
- Separadores visuais entre seções
- Submenus com linha vertical conectora

### Opção C: Sidebar Escura (estilo Stripe/Revolut)
- Fundo escuro contrastante
- Texto branco, ícones coloridos
- Item ativo com destaque lateral (barra colorida)
- Look premium/profissional

---

## Alterações Propostas

### 1. Corrigir SidebarNav.tsx - Estado de Menus

**Mudanças:**
- Adicionar `useState` para controle local dos menus abertos
- Inicializar estado baseado no pathname
- Criar handler real para `onOpenChange`
- Usar `useEffect` para sincronizar quando URL muda

```tsx
export const SidebarNav = memo(function SidebarNav({ isAdmin, onItemClick }: SidebarNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

  // Estado local para controle de menus abertos
  const [openMenus, setOpenMenus] = useState(() => ({
    transacoes: pathname.startsWith("/transactions"),
    cartoes: pathname.startsWith("/cartoes"),
    economia: pathname.startsWith("/economia"),
    relatorios: pathname.startsWith("/reports"),
  }));

  // Sincronizar quando URL muda (abrir menu se entrar em subrota)
  useEffect(() => {
    setOpenMenus(prev => ({
      ...prev,
      transacoes: prev.transacoes || pathname.startsWith("/transactions"),
      cartoes: prev.cartoes || pathname.startsWith("/cartoes"),
      economia: prev.economia || pathname.startsWith("/economia"),
      relatorios: prev.relatorios || pathname.startsWith("/reports"),
    }));
  }, [pathname]);

  // Handler para toggle manual
  const handleMenuChange = useCallback((menu: keyof typeof openMenus) => (open: boolean) => {
    setOpenMenus(prev => ({ ...prev, [menu]: open }));
  }, []);

  return (
    <nav>
      <MenuCollapsible
        open={openMenus.transacoes}
        onOpenChange={handleMenuChange("transacoes")}
        ...
      />
    </nav>
  );
});
```

### 2. Atualizar Design Visual - Opção B (Pills Coloridos)

**Layout da Sidebar:**

```
+----------------------------------+
|  💳 Fina                        |  <- Logo com gradiente suave
+----------------------------------+
|                                  |
|  📊 Dashboard                    |  <- Item flat, ícone em círculo
|  🏷️ Categorias                   |
|                                  |
|  ─────── Finanças ───────        |  <- Separador com label
|                                  |
|  ↔️ Transações              ▼    |  <- Collapsible
|     └─ Visão Geral              |  <- Submenu com linha conectora
|     └─ Recorrentes              |
|     └─ Importar                 |
|                                  |
|  💳 Cartões                 ▼    |
|  🐷 Economia                ▼    |
|  📈 Relatórios              ▼    |
|                                  |
|  ─────────────────────────       |
|  🛡️ Admin                        |  <- Apenas para admins
|                                  |
+----------------------------------+
|  👤 João · 🔔 · 🚪               |  <- Footer compacto
+----------------------------------+
```

**Estilo CSS dos Items:**
```tsx
// Item ativo - pill com background
<div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary font-medium">
  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
    <Icon className="w-4 h-4 text-primary" />
  </div>
  <span>Dashboard</span>
</div>

// Item inativo - minimal
<div className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl">
  <Icon className="w-4 h-4" />
  <span>Categorias</span>
</div>
```

**Submenus com linha conectora:**
```tsx
<CollapsibleContent className="mt-1 ml-6 pl-4 border-l-2 border-border/60 space-y-0.5">
  {subItems.map(item => (
    <Link className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50">
      <item.icon className="w-3.5 h-3.5" />
      {item.label}
    </Link>
  ))}
</CollapsibleContent>
```

### 3. Atualizar MenuCollapsible.tsx

**Mudanças visuais:**
- Linha vertical conectando submenus
- Animação suave de abertura
- Ícone de chevron mais sutil
- Transições mais rápidas (150ms)

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/sidebar/SidebarNav.tsx` | Corrigir estado dos menus + novo design visual |
| `src/components/sidebar/MenuCollapsible.tsx` | Linha conectora em submenus + ajustes visuais |
| `src/components/Layout.tsx` | Ajustes de background/borda da sidebar |

---

## Seção Técnica

### Estrutura de Estado dos Menus

```typescript
interface MenuState {
  transacoes: boolean;
  cartoes: boolean;
  economia: boolean;
  relatorios: boolean;
}

// Inicialização baseada na URL
const [openMenus, setOpenMenus] = useState<MenuState>(() => ({
  transacoes: pathname.startsWith("/transactions"),
  cartoes: pathname.startsWith("/cartoes"),
  economia: pathname.startsWith("/economia"),
  relatorios: pathname.startsWith("/reports"),
}));

// useEffect apenas abre (não fecha) quando URL muda
useEffect(() => {
  const updates: Partial<MenuState> = {};
  if (pathname.startsWith("/transactions") && !openMenus.transacoes) {
    updates.transacoes = true;
  }
  // ... outros paths
  if (Object.keys(updates).length > 0) {
    setOpenMenus(prev => ({ ...prev, ...updates }));
  }
}, [pathname]);
```

### Classes CSS Principais

```tsx
// Item principal ativo
"flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary font-medium"

// Item principal inativo
"flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"

// Submenu container com linha
"mt-1 ml-6 pl-4 border-l-2 border-border/60 space-y-0.5"

// Submenu item ativo
"flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-primary/5 text-primary font-medium"

// Submenu item inativo
"flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30"
```

---

## Resultado Esperado

1. **Menus funcionando**: Clicar nos menus expande/colapsa corretamente
2. **URL sincronizada**: Entrar em uma subrota abre automaticamente o menu pai
3. **Design moderno**: Visual limpo com pills coloridos e linha conectora nos submenus
4. **Performance mantida**: Componentes memoizados, transições rápidas


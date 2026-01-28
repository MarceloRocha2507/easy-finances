
# Plano de Redesign Completo do Sistema

## Visão Geral

Redesign completo seguindo o estilo **Moderno com Gradientes** (inspirado em Stripe/Linear) com uma paleta **Neutra Elegante**. O objetivo é criar consistência visual em todas as 20+ páginas do sistema.

## Design System Proposto

### Paleta de Cores

```
CORES BASE
├── Background: #FAFAFA (light) / #0F0F0F (dark)
├── Card: #FFFFFF (light) / #171717 (dark)
├── Foreground: #171717 (light) / #FAFAFA (dark)
└── Muted: #737373 (cinza médio)

CORES SEMÂNTICAS
├── Primary: #171717 (neutro elegante)
├── Income: #10B981 (verde esmeralda)
├── Expense: #EF4444 (vermelho)
├── Warning: #F59E0B (âmbar)
└── Info: #3B82F6 (azul)

GRADIENTES
├── Sutil: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)
├── Card Hover: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)
└── Accent: linear-gradient(135deg, #1F1F1F 0%, #2D2D2D 100%)
```

### Tipografia

```
HIERARQUIA
├── h1: 24px, font-weight: 600, tracking: -0.025em
├── h2: 20px, font-weight: 600, tracking: -0.02em
├── h3: 16px, font-weight: 500
├── Body: 14px, font-weight: 400
├── Small: 13px, font-weight: 400
└── Caption: 12px, font-weight: 400, color: muted
```

### Espaçamentos Padronizados

```
SPACING SCALE
├── xs: 4px
├── sm: 8px
├── md: 16px
├── lg: 24px
├── xl: 32px
└── 2xl: 48px

CARD PADDING
├── Compact: 16px (p-4)
├── Default: 20px (p-5)
└── Spacious: 24px (p-6)
```

### Componentes Padronizados

```
CARDS
├── Border Radius: 12px (rounded-xl)
├── Border: 1px solid border (sutil)
├── Shadow: 0 1px 3px rgba(0,0,0,0.08)
├── Hover Shadow: 0 4px 12px rgba(0,0,0,0.10)
└── Transition: all 0.2s ease

BUTTONS
├── Primary: bg-foreground, text-background, hover:opacity-90
├── Secondary: bg-muted/10, text-foreground, border
├── Ghost: transparent, hover:bg-muted/10
├── Border Radius: 8px (rounded-lg)
└── Height: sm=32px, default=40px, lg=44px

INPUTS
├── Height: 40px
├── Border: 1px solid border
├── Border Radius: 8px
├── Focus Ring: 2px ring-offset-2
└── Placeholder: text-muted-foreground
```

## Arquivos a Modificar

### Fase 1: Base do Design System (Fundação)

| Arquivo | Alteração |
|---------|-----------|
| `src/index.css` | Nova paleta de cores, gradientes, utilitários |
| `tailwind.config.ts` | Tokens de design, sombras, animações |
| `src/components/ui/card.tsx` | Novo estilo de cards com gradiente sutil |
| `src/components/ui/button.tsx` | Variantes atualizadas |
| `src/components/ui/input.tsx` | Estilo consistente |

### Fase 2: Layout Principal

| Arquivo | Alteração |
|---------|-----------|
| `src/components/Layout.tsx` | Sidebar redesenhada, remover glass, novo header |

### Fase 3: Páginas Principais

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Cards redesenhados, espaçamentos |
| `src/pages/Transactions.tsx` | Lista e filtros padronizados |
| `src/pages/Cartoes.tsx` | Cards de cartão redesenhados |
| `src/pages/Economia.tsx` | Layout e tabs consistentes |
| `src/pages/Bancos.tsx` | Cards de banco |
| `src/pages/Categories.tsx` | Grid de categorias |
| `src/pages/Profile.tsx` | Tabs e formulários |
| `src/pages/Metas.tsx` | Cards de metas |
| `src/pages/Investimentos.tsx` | Cards de investimentos |
| `src/pages/Reports.tsx` | Gráficos e relatórios |
| `src/pages/Notificacoes.tsx` | Lista de notificações |

### Fase 4: Componentes Reutilizáveis

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/dialog.tsx` | Modal redesenhado |
| `src/components/ui/tabs.tsx` | Tabs estilo underline |
| `src/components/ui/badge.tsx` | Badges sutis |
| `src/components/ui/progress.tsx` | Progress bars modernas |
| `src/components/ui/select.tsx` | Dropdowns consistentes |

### Fase 5: Componentes de Feature

| Diretório | Componentes |
|-----------|-------------|
| `src/components/dashboard/` | Cards de stats, alertas, gráficos |
| `src/components/cartoes/` | Dialogs e cards de cartão |
| `src/components/bancos/` | Cards e dialogs de banco |
| `src/components/economia/` | Ranking, insights, orçamentos |
| `src/components/investimentos/` | Cards e dialogs de investimento |
| `src/components/profile/` | Tabs de perfil |

## Detalhes Técnicos

### Novas Variáveis CSS (index.css)

```css
:root {
  /* Nova paleta neutra elegante */
  --background: 0 0% 98%;
  --foreground: 0 0% 9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  --border: 0 0% 90%;
  
  /* Gradientes */
  --gradient-subtle: linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(0 0% 98%) 100%);
  --gradient-card: linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 99%) 100%);
  
  /* Sombras modernas */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08);
  
  /* Border radius padrão */
  --radius: 0.75rem;
}
```

### Utilitários CSS Novos

```css
/* Card com gradiente sutil */
.card-gradient {
  background: var(--gradient-card);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card-gradient:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Stat card highlight */
.stat-highlight {
  background: linear-gradient(135deg, hsl(var(--primary) / 0.03) 0%, transparent 100%);
  border-left: 3px solid hsl(var(--primary));
}
```

### Novo Componente Card

```tsx
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground",
        "shadow-sm transition-all duration-200",
        variant === "interactive" && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        variant === "highlight" && "border-l-4 border-l-primary",
        className
      )}
      {...props}
    />
  )
);
```

### Novo Layout Sidebar

```text
ANTES (Glassmorphism):
├── backdrop-filter: blur(20px)
├── background: rgba(255,255,255,0.7)
└── Transparente com blur

DEPOIS (Moderno Sólido):
├── background: solid white/dark
├── border-right: 1px solid border
├── shadow: subtle inset shadow
└── Clean, sem transparência
```

## Ordem de Implementação

A implementação será feita em fases para manter o sistema estável:

1. **Tokens de Design** - Atualizar CSS e Tailwind config
2. **Componentes Base** - Card, Button, Input, Badge
3. **Layout** - Sidebar e header
4. **Páginas Principais** - Dashboard, Transactions, Cartões
5. **Páginas Secundárias** - Economia, Bancos, Metas, etc.
6. **Dialogs e Modais** - Todos os dialogs do sistema
7. **Refinamentos** - Animações, hover states, dark mode

## Resultado Esperado

```text
ANTES:
├── Estilos inconsistentes entre páginas
├── Glassmorphism parcial
├── Sombras variadas (shadow-lg, shadow-sm, border-0)
├── Paddings diferentes (p-5, p-6, pt-4)
└── Cores misturadas

DEPOIS:
├── Design system unificado
├── Cards com gradiente sutil
├── Sombras consistentes
├── Espaçamentos padronizados
├── Paleta neutra elegante
├── Interações suaves
└── Código mais limpo e manutenível
```

## Considerações

- **Dark Mode**: Será mantido e atualizado com a nova paleta
- **Responsividade**: Será preservada e melhorada
- **Acessibilidade**: Contraste adequado será garantido
- **Performance**: Remoção de backdrop-filter melhora performance
- **Animações**: Transições sutis (0.2s ease) em todo o sistema



# Animacoes Suaves e Consistentes em Todo o Sistema

## Abordagem

Usar uma estrategia CSS-first com Tailwind + um pequeno componente utilitario para stagger de listas. Sem dependencias extras (sem framer-motion), mantendo performance maxima.

## Arquivos a criar/modificar

### 1. Novo componente: `src/components/ui/animated-section.tsx`
Componente wrapper reutilizavel que aplica fade-in-up com stagger opcional para listas de cards/itens.

```tsx
// Wrapper simples que aplica animate-fade-in-up com delay baseado no index
<AnimatedSection> // page-level fade
<AnimatedItem index={0}> // staggered item (delay = index * 50ms)
```

### 2. `tailwind.config.ts` - Novos keyframes
- Adicionar `stagger-fade-in` keyframe (opacity 0 -> 1, translateY 16px -> 0)
- Adicionar animation delays via CSS custom properties

### 3. `src/index.css` - Utilidades de animacao
- `.page-enter` - fade-in-up 300ms para containers de pagina
- `.stagger-item` - animacao com delay dinamico via `--stagger-index`
- `.hover-lift` - scale(1.02) + shadow no hover, 150ms
- `.skeleton-pulse` - pulse suave customizado

### 4. Paginas a atualizar (wrapper + stagger)

Cada pagina recebe:
- Container principal envolto em `<div className="animate-fade-in-up">` 
- Cards/itens de lista com delay stagger via style `--stagger-index`

Paginas:
- **Dashboard** (`src/pages/Dashboard.tsx`) - stat cards, graficos, secoes
- **Bancos** (`src/pages/Bancos.tsx`) - banco cards
- **Categorias** (`src/pages/Categories.tsx`) - categoria cards
- **Metas** (`src/pages/Metas.tsx`) - meta cards
- **Transacoes** (`src/pages/Transactions.tsx`) - lista de transacoes (top-level only, not each row)
- **Cartoes** (`src/pages/Cartoes.tsx`) - cartao cards
- **Parcelamentos** (`src/pages/cartoes/Parcelamentos.tsx`) - summary + list
- **Relatorios** (`src/pages/Reports.tsx`) - stat cards + graficos
- **Novidades** (`src/pages/Changelog.tsx`) - timeline items
- **Admin** (`src/pages/Admin.tsx`) - stat cards + table
- **Fina IA** (`src/pages/Assistente.tsx`) - mensagens de chat

### 5. Menu lateral (`src/components/sidebar/SidebarNav.tsx`)
- Adicionar `transition-all duration-150` no indicador ativo do menu
- Background do item ativo com transicao suave (ja existe parcialmente via CSS)

### 6. Graficos (Dashboard/Relatorios)
- Adicionar `animationBegin={200}` e `animationDuration={800}` nos componentes Recharts (Bar, Area, etc.)

## Detalhes tecnicos

### Componente AnimatedSection
```tsx
interface Props { children: ReactNode; className?: string; delay?: number; }
// Renderiza div com animate-fade-in-up e animation-delay via style
```

### CSS stagger pattern
```css
.stagger-item {
  opacity: 0;
  animation: fade-in-up 0.3s ease-out forwards;
  animation-delay: calc(var(--stagger-index, 0) * 50ms);
}
```

### Hover em botoes/cards
```css
.hover-lift {
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.hover-lift:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
```

### Recharts animation props
```tsx
<Bar animationBegin={200} animationDuration={800} animationEasing="ease-out" />
<Area animationBegin={200} animationDuration={800} animationEasing="ease-out" />
```

## Performance
- Apenas CSS transforms e opacity (GPU-accelerated)
- Sem JavaScript animation loops
- Stagger limitado aos primeiros 12 itens (apos isso, sem delay)
- `will-change: transform, opacity` apenas durante animacao via `forwards`

## Resumo de arquivos
| Arquivo | Acao |
|---------|------|
| `src/components/ui/animated-section.tsx` | Criar |
| `tailwind.config.ts` | Editar (keyframe stagger) |
| `src/index.css` | Editar (utilidades) |
| `src/pages/Dashboard.tsx` | Editar |
| `src/pages/Bancos.tsx` | Editar |
| `src/pages/Categories.tsx` | Editar |
| `src/pages/Metas.tsx` | Editar |
| `src/pages/Transactions.tsx` | Editar |
| `src/pages/Cartoes.tsx` | Editar |
| `src/pages/cartoes/Parcelamentos.tsx` | Editar |
| `src/pages/Reports.tsx` | Editar |
| `src/pages/Changelog.tsx` | Editar |
| `src/pages/Admin.tsx` | Editar |
| `src/pages/Assistente.tsx` | Editar |
| `src/components/sidebar/SidebarNav.tsx` | Editar |


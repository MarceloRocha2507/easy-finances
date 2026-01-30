
# Correção: Sidebar Mobile Ocupando Tela Inteira

## Problema Identificado

O sidebar mobile atual está configurado assim (linha 66):

```tsx
className="lg:hidden fixed top-16 left-3 right-3 bottom-3 ..."
```

Com `left-3` e `right-3`, o sidebar se estica de uma margem à outra, ocupando quase toda a largura da tela.

```text
COMPORTAMENTO ATUAL (errado):
┌──────────────────────────────────┐
│ Header                       [X] │
├──────────────────────────────────┤
│ ╔══════════════════════════════╗ │
│ ║ Dashboard                    ║ │
│ ║ Categorias                   ║ │
│ ║ Transações                   ║ │
│ ║ Cartões                      ║ │
│ ║ ...                          ║ │
│ ║                              ║ │
│ ║ [User Section]               ║ │
│ ╚══════════════════════════════╝ │
└──────────────────────────────────┘
     ↑ Sidebar ocupa tela toda ↑
```

## Solução

Alterar o sidebar mobile para ter largura fixa (~72% da tela ou 280px) e animação de deslizar da esquerda:

```text
COMPORTAMENTO ESPERADO (lateral):
┌──────────────────────────────────┐
│ Header                       [X] │
├──────────────────────────────────┤
│ ╔════════════════╗░░░░░░░░░░░░░░ │
│ ║ Dashboard      ║░░░░░░░░░░░░░░ │
│ ║ Categorias     ║░░░░░░░░░░░░░░ │
│ ║ Transações     ║░░░░░░░░░░░░░░ │
│ ║ Cartões        ║░░ (overlay) ░░ │
│ ║ ...            ║░░░░░░░░░░░░░░ │
│ ║                ║░░░░░░░░░░░░░░ │
│ ║ [User]         ║░░░░░░░░░░░░░░ │
│ ╚════════════════╝░░░░░░░░░░░░░░ │
└──────────────────────────────────┘
 ↑ Sidebar lateral ↑  ↑ Conteúdo visível
```

## Alteração Técnica

**Arquivo:** `src/components/Layout.tsx`

**Antes (linha 64-70):**
```tsx
<aside
  className={cn(
    "lg:hidden fixed top-16 left-3 right-3 bottom-3 sidebar-floating z-40 flex flex-col overflow-hidden transition-all duration-300",
    sidebarOpen 
      ? "translate-y-0 opacity-100" 
      : "translate-y-4 opacity-0 pointer-events-none"
  )}
>
```

**Depois:**
```tsx
<aside
  className={cn(
    "lg:hidden fixed top-16 left-0 bottom-0 w-[280px] max-w-[75vw] sidebar-floating z-40 flex flex-col overflow-hidden transition-transform duration-300 ease-out rounded-l-none",
    sidebarOpen 
      ? "translate-x-0" 
      : "-translate-x-full"
  )}
>
```

## Mudanças Detalhadas

| Propriedade | Antes | Depois | Motivo |
|-------------|-------|--------|--------|
| Posição | `left-3 right-3` | `left-0` | Fixar na borda esquerda |
| Largura | Esticada | `w-[280px] max-w-[75vw]` | Largura fixa, mas responsiva |
| Cantos | Todos arredondados | `rounded-l-none` | Remove arredondamento à esquerda (colado na borda) |
| Animação | `translate-y` + `opacity` | `translate-x` | Desliza da esquerda horizontalmente |
| Estado fechado | `translate-y-4 opacity-0` | `-translate-x-full` | Escondido para fora da tela |
| Bottom | `bottom-3` | `bottom-0` | Vai até o fim da tela |

## Resultado Visual

O sidebar vai:
1. Aparecer deslizando da esquerda
2. Ocupar apenas ~280px ou 75% da tela (o que for menor)
3. Deixar parte do conteúdo visível atrás do overlay
4. Fechar deslizando de volta para a esquerda

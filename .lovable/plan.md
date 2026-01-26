

# Plano: Corrigir Bug do Calendário Renderizado no Card

## Problema Identificado

Um **componente Calendar (date picker) inteiro** está sendo renderizado dentro do card "Próximos 30 dias" ao invés de um **ícone de calendário**.

### Causa Raiz

Conflito de imports na linha 208:

```tsx
// Linha 24: Lucide icon
import { Calendar as CalendarIcon, ... } from "lucide-react";

// Linha 37: UI Component (date picker)
import { Calendar } from "@/components/ui/calendar";

// Linha 208: Usa o componente errado!
<Calendar className="h-4 w-4" />  // ❌ Renderiza date picker inteiro
```

O código deveria usar `CalendarIcon` (o ícone do Lucide), mas está usando `Calendar` (o date picker completo).

## Solução

Alterar a linha 208 para usar o ícone correto:

| Local | Antes (errado) | Depois (correto) |
|-------|----------------|------------------|
| Linha 208 | `<Calendar className="h-4 w-4" />` | `<CalendarIcon className="h-4 w-4" />` |

## Mudança Técnica

**Arquivo**: `src/pages/DespesasFuturas.tsx`

**Linha 208** - Substituir:
```tsx
// DE:
<Calendar className="h-4 w-4" />

// PARA:
<CalendarIcon className="h-4 w-4" />
```

## Resultado Esperado

O card "Próximos 30 dias" exibirá apenas um pequeno ícone de calendário (24x24px) no título, como os outros cards, ao invés de renderizar um date picker completo sobrepondo a interface.

## Arquivos a Modificar

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| `src/pages/DespesasFuturas.tsx` | 208 | `Calendar` → `CalendarIcon` |

## Tempo Estimado

~30 segundos para corrigir.


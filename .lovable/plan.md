

## Plano: Alinhar cards A Receber e Total a Pagar

### Mudanças

**`src/pages/Dashboard.tsx` (linha 265)**
- Trocar `grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-start` por `flex flex-col md:flex-row items-stretch gap-3 mb-4`

**`src/pages/Dashboard.tsx` (linha 267)**
- Adicionar wrapper `<div className="flex-1">` ao redor do `StatCardMinimal` de "A Receber"

**`src/pages/Dashboard.tsx` (linhas 269-271)**
- Adicionar wrapper `<div className="flex-1">` ao redor do `TotalAPagarCard`

**`src/components/dashboard/TotalAPagarCard.tsx`**
- Garantir que o wrapper principal tenha `h-full` (já deve ter da edição anterior)

**`src/components/dashboard/StatCardMinimal.tsx`**
- Verificar/adicionar `h-full` no card raiz para que ele estique dentro do flex container

Resultado: ambos os cards ficam com a mesma altura, com o menor crescendo para acompanhar o maior.


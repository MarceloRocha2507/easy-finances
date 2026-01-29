
# Plano: Correção de Margens nos Modais (Dialogs)

## Problema Identificado

Os modais do sistema estão aparecendo colados nas bordas da tela em dispositivos móveis, tornando a experiência de uso desagradável. O problema está no componente base `DialogContent` que usa `w-full` sem margem lateral para telas pequenas.

## Análise Técnica

### Componente Base Atual (src/components/ui/dialog.tsx)
```tsx
// Linha 38-40 - Classes atuais:
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg ... sm:rounded-lg"
```

**Problemas:**
1. `w-full` ocupa 100% da largura em mobile
2. `sm:rounded-lg` - bordas arredondadas só aparecem em telas >= 640px
3. Não há margem lateral (`mx-`) aplicada em mobile
4. O mesmo problema existe em `AlertDialogContent`

### Componentes Afetados
- `src/components/ui/dialog.tsx` - Dialog principal
- `src/components/ui/alert-dialog.tsx` - AlertDialog para confirmações

## Solução Proposta

Modificar os componentes base para adicionar margens e bordas arredondadas em mobile:

### 1. Dialog.tsx (linhas 36-41)

```tsx
// Antes
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ... sm:rounded-lg",
  className,
)}

// Depois
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 ... rounded-lg",
  className,
)}
```

**Mudanças:**
- `w-full` → `w-[calc(100%-2rem)]` (16px de margem de cada lado = 32px total)
- `sm:rounded-lg` → `rounded-lg` (bordas arredondadas em todas as telas)
- `p-6` → `p-4 sm:p-6` (padding menor em mobile)

### 2. AlertDialog.tsx (linhas 34-38)

Aplicar as mesmas mudanças para consistência.

```tsx
// Antes
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ... sm:rounded-lg",
  className,
)}

// Depois
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 ... rounded-lg",
  className,
)}
```

### 3. Drawer (opcional mas recomendado)

O componente Drawer (`src/components/ui/drawer.tsx`) também pode receber ajustes para margem superior:

```tsx
// Antes (linha 38)
"fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background"

// Depois
"fixed inset-x-2 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background"
```

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/dialog.tsx` | w-full → w-[calc(100%-2rem)], sm:rounded-lg → rounded-lg, p-6 → p-4 sm:p-6 |
| `src/components/ui/alert-dialog.tsx` | Mesmas alterações acima |
| `src/components/ui/drawer.tsx` | (Opcional) inset-x-0 → inset-x-2 |

## Benefícios

1. **Margem visual**: 16px de espaço em cada lado da tela
2. **Bordas arredondadas**: Aparência mais moderna em mobile
3. **Padding adaptativo**: Menos aperto em telas pequenas
4. **Alteração centralizada**: Afeta todos os 32+ dialogs do sistema automaticamente

## Testes Recomendados

- Verificar modais em viewport 375px (iPhone SE)
- Verificar modais em viewport 390px (iPhone 12/13)
- Testar scroll interno de modais longos
- Confirmar que o botão X de fechar continua acessível

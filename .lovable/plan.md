
# Correção: Bloquear Scroll Horizontal nos Modais

## Problema Identificado

Os modais do sistema permitem scroll horizontal (arrastar para o lado), mostrando espaço em branco indesejado em dispositivos mobile. Isso acontece porque:

1. **DialogContent**: Tem `overflow-y-auto` mas não tem `overflow-x-hidden`
2. **AlertDialogContent**: Não tem nenhuma configuração de overflow explícita

Quando o conteúdo interno do modal é ligeiramente maior que a largura do modal, ou quando o usuário tenta arrastar, o modal permite movimento horizontal.

## Solução

Adicionar `overflow-x-hidden` aos componentes base de modal para garantir que:
- Scroll **vertical** continue funcionando normalmente (cima/baixo)
- Scroll **horizontal** seja bloqueado (sem arrastar para os lados)

## Alterações Técnicas

### 1. DialogContent (`src/components/ui/dialog.tsx`)

**Antes:**
```tsx
className="... max-h-[90vh] overflow-y-auto ..."
```

**Depois:**
```tsx
className="... max-h-[90vh] overflow-y-auto overflow-x-hidden ..."
```

### 2. AlertDialogContent (`src/components/ui/alert-dialog.tsx`)

**Antes:**
```tsx
className="... duration-200 ..."
```

**Depois:**
```tsx
className="... duration-200 max-h-[90vh] overflow-y-auto overflow-x-hidden ..."
```

## Arquivos a Modificar

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/components/ui/dialog.tsx` | 39 | Adicionar `overflow-x-hidden` |
| `src/components/ui/alert-dialog.tsx` | 37 | Adicionar `max-h-[90vh] overflow-y-auto overflow-x-hidden` |

## Comportamento Após Correção

```text
ANTES (problema):              DEPOIS (corrigido):
┌─────────────────┐──────      ┌─────────────────┐
│                 │ espaço     │                 │
│   Conteúdo do   │ branco     │   Conteúdo do   │
│      Modal      │←arrastar   │      Modal      │ ← fixo
│                 │            │                 │
│   [Botões]      │            │   [Botões]      │
└─────────────────┘──────      └─────────────────┘
      ↕ scroll vertical              ↕ somente vertical
      ↔ scroll horizontal            ✕ bloqueado
```

## Impacto

Esta correção afeta **todos os modais do sistema** que usam esses componentes base, garantindo comportamento consistente em:
- Dialogs de edição (EditarCartaoDialog, EditarBancoDialog, etc.)
- Dialogs de confirmação (AlertDialog)
- Dialogs de formulário (NovaCompraDialog, etc.)
- Qualquer outro componente que use Dialog ou AlertDialog

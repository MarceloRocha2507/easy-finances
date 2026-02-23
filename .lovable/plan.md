
# Ajuste Visual dos Modais: Botoes e Toggle Receita/Despesa

## Problema 1: Botoes Criar/Cancelar colados

O `DialogFooter` usa `flex-col-reverse sm:flex-row` com `sm:space-x-2`, mas no mobile os botoes ficam empilhados sem gap suficiente entre eles.

## Problema 2: Toggle Despesa com cor errada no modal de Categoria

No modal de Nova Categoria (`src/pages/Categories.tsx`), o toggle usa `variant="default"` (fundo preto/primary) quando selecionado. No modal de Nova Transacao (`src/pages/Transactions.tsx`), o toggle usa classes `gradient-income` (verde) e `gradient-expense` (vermelho) corretamente.

---

## Solucao

### 1. DialogFooter - Aumentar espacamento (global)

**Arquivo: `src/components/ui/dialog.tsx`**

Alterar o `DialogFooter` de:
```text
"flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
```
Para:
```text
"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2"
```

Isso adiciona `gap-2` entre os botoes no mobile (coluna reversa), garantindo espacamento global em todos os modais.

### 2. Toggle Receita/Despesa no modal de Nova Categoria

**Arquivo: `src/pages/Categories.tsx` (linhas 315-334)**

Substituir os dois `Button` do toggle por versao com classes condicionais identicas ao modal de Transacoes:

- **Receita selecionada**: `gradient-income text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800`
- **Despesa selecionada**: `gradient-expense text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800`
- **Nao selecionado**: `variant="outline"` (neutro)

### Arquivos modificados

1. `src/components/ui/dialog.tsx` - Adicionar `gap-2` ao DialogFooter
2. `src/pages/Categories.tsx` - Corrigir cores do toggle Receita/Despesa

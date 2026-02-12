
# Corrigir Scroll e Botao Cortado nos Modais

## Problema Identificado

Ambos os modais (DetalhesCartaoDialog e EditarCartaoDialog) possuem `overflow-hidden` no `DialogContent`, que sobrescreve o `overflow-y-auto` padrao do componente base. Isso bloqueia completamente o scroll vertical.

Alem disso, no DetalhesCartaoDialog, a div de conteudo (linha 292) tambem tem `overflow-hidden`, que corta o botao "+ Compra" quando o layout fica apertado.

## Causa Raiz

Quando o header colorido foi adicionado, `overflow-hidden` foi incluido no `DialogContent` para que as bordas arredondadas ficassem corretas com o header flush. Porem, isso desativou o scroll vertical que ja estava configurado no componente base.

## Correcoes

### 1. DetalhesCartaoDialog.tsx (linha 242)
- Trocar `p-0 overflow-hidden` por `p-0 overflow-y-auto overflow-x-hidden` no `DialogContent`
- Remover `overflow-hidden` da div de conteudo (linha 292), mantendo apenas o padding e spacing

### 2. EditarCartaoDialog.tsx (linha 161)
- Trocar `p-0 overflow-hidden` por `p-0 overflow-y-auto overflow-x-hidden` no `DialogContent`

### 3. Aplicar a mesma correcao em todos os outros modais de cartao que receberam o header colorido
Os seguintes arquivos tambem precisam da mesma troca de `overflow-hidden` por `overflow-y-auto overflow-x-hidden`:
- NovaCompraCartaoDialog.tsx
- PagarFaturaDialog.tsx
- GerarMensagemDialog.tsx
- RegistrarAcertoDialog.tsx
- AdiantarFaturaDialog.tsx
- ExcluirCartaoDialog.tsx
- AjustarFaturaDialog.tsx
- EditarCompraDialog.tsx
- EstornarCompraDialog.tsx
- DetalhesCompraCartaoDialog.tsx
- ExcluirCompraDialog.tsx

## Detalhes Tecnicos

Em cada arquivo, a alteracao e simples:

**Antes:**
```tsx
<DialogContent className="... p-0 overflow-hidden">
```

**Depois:**
```tsx
<DialogContent className="... p-0 overflow-y-auto overflow-x-hidden">
```

No DetalhesCartaoDialog, adicionalmente remover `overflow-hidden` da div de conteudo na linha 292:

**Antes:**
```tsx
<div className="px-4 sm:px-5 py-4 space-y-3 overflow-hidden">
```

**Depois:**
```tsx
<div className="px-4 sm:px-5 py-4 space-y-3">
```

Isso restaura o scroll vertical nos modais e permite que o botao "+ Compra" seja renderizado sem corte, mantendo o visual do header colorido intacto.

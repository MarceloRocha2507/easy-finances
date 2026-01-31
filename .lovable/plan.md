
# Correção: ScrollArea no Modal de Despesas a Pagar

## Problema Identificado

O modal "Despesas a Pagar" não permite scroll completo em meses futuros quando há muitas despesas. Olhando a screenshot de março 2026, a lista parece cortada/incompleta visualmente, embora os dados estejam sendo buscados corretamente.

### Causa Raiz

O `ScrollArea` está dentro de um container flexbox com `flex-1`, mas sem a propriedade `min-h-0`. Em layouts flexbox, elementos filhos com `flex-1` não encolhem abaixo do tamanho do seu conteúdo por padrão, o que impede o scroll de funcionar corretamente.

```text
ESTRUTURA ATUAL:
┌─────────────────────────────────────┐
│ SheetContent (h-full flex flex-col) │
├─────────────────────────────────────┤
│ Header (flex-shrink-0)              │ <- fixo
├─────────────────────────────────────┤
│ div (flex-1 overflow-hidden)        │ <- PROBLEMA: sem min-h-0
│   └─ ScrollArea (h-full)            │ <- não encolhe corretamente
│        └─ conteúdo longo...         │
├─────────────────────────────────────┤
│ Footer (flex-shrink-0)              │ <- fixo
└─────────────────────────────────────┘
```

## Solução

Adicionar `min-h-0` ao container do ScrollArea. Essa propriedade permite que o elemento flex encolha para caber no espaço disponível, permitindo que o ScrollArea funcione corretamente.

## Alteração Técnica

**Arquivo:** `src/components/dashboard/DetalhesDespesasDialog.tsx`

**Linha 183 - Antes:**
```tsx
<div className="flex-1 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.1s' }}>
```

**Depois:**
```tsx
<div className="flex-1 min-h-0 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.1s' }}>
```

## Por que `min-h-0` funciona?

No flexbox, o `min-height` padrão de um item é `auto`, que significa "não encolha menor que o conteúdo". Isso impede o scroll porque o container tenta expandir para caber todo o conteúdo.

Com `min-h-0`:
- O container pode encolher para caber no espaço disponível
- O ScrollArea com `h-full` herda essa altura limitada
- O overflow do conteúdo ativa o scroll

```text
APÓS CORREÇÃO:
┌─────────────────────────────────────┐
│ Header                              │ ~60px
├─────────────────────────────────────┤
│ Container (flex-1 min-h-0)          │ ← pode encolher
│ ┌─────────────────────────────────┐ │
│ │ ScrollArea (h-full)           ↕ │ │ ← scroll funciona
│ │ ├─ Contas Pendentes            │ │
│ │ ├─ Parcelas Nubank             │ │
│ │ ├─ Parcelas Inter              │ │
│ │ └─ ... mais itens (scroll)     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Footer - Total a Pagar              │ ~100px
└─────────────────────────────────────┘
```

## Resultado Esperado

- Todas as despesas serão visíveis através do scroll
- O footer "Total a Pagar" permanece fixo na parte inferior
- O scroll funciona suavemente com a scrollbar visível
- Os fade indicators (gradientes) indicam que há mais conteúdo

## Arquivos a Modificar

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/components/dashboard/DetalhesDespesasDialog.tsx` | 183 | Adicionar `min-h-0` à classe do container |

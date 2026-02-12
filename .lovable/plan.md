
# Corrigir Bordas Retas/Cortadas nos Modais de Cartao

## Problema

Com a mudanca para headers neutros (`bg-muted`), o `border-0` que foi adicionado anteriormente (para esconder a fresta branca com headers coloridos) agora esta removendo a borda visual do modal. Sem essa borda, os cantos arredondados (`rounded-lg`) ficam invisiveis contra o fundo, dando a aparencia de bordas retas e cortadas.

## Solucao

Remover `border-0` de todos os 13 modais de cartao. Como os headers agora usam `bg-muted` (mesma familia de cor do sistema), nao ha mais contraste que cause fresta visivel. A borda padrao do DialogContent (`border`) volta a delimitar os cantos arredondados corretamente.

## Detalhes Tecnicos

### Mudanca em cada arquivo

Remover `border-0` da className do `DialogContent` ou `AlertDialogContent`:

```tsx
// Antes:
className="... p-0 gap-0 border-0 overflow-hidden"

// Depois:
className="... p-0 gap-0 overflow-hidden"
```

### Arquivos a atualizar (13 modais):

1. DetalhesCartaoDialog.tsx
2. NovaCompraCartaoDialog.tsx
3. PagarFaturaDialog.tsx
4. EditarCartaoDialog.tsx
5. GerarMensagemDialog.tsx
6. RegistrarAcertoDialog.tsx
7. AdiantarFaturaDialog.tsx
8. ExcluirCartaoDialog.tsx
9. AjustarFaturaDialog.tsx
10. EditarCompraDialog.tsx
11. EstornarCompraDialog.tsx
12. DetalhesCompraCartaoDialog.tsx
13. ExcluirCompraDialog.tsx (AlertDialogContent)

### Por que funciona

A borda original do DialogContent (1px solid via classe `border` do Tailwind) fornece a definicao visual necessaria para que os cantos arredondados (`rounded-lg`) sejam perceptiveis. Com headers neutros, nao existe mais o problema de fresta de cor diferente entre borda e header.

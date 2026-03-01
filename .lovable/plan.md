

# Fix: Dialog de exclusão recorrente ainda cortando no desktop

## Causa raiz
O componente `AlertDialogFooter` (linha 52 de `alert-dialog.tsx`) aplica classes base `sm:flex-row sm:justify-end sm:space-x-2`. Quando passamos `className="flex-col gap-2"`, o Tailwind Merge nao consegue resolver o conflito corretamente, e os botoes acabam em linha no desktop, ficando cortados pelo `max-w-lg` do `AlertDialogContent`.

## Solucao
Nao usar `AlertDialogFooter` para este caso especifico. Substituir por uma `div` simples com layout em coluna, garantindo que os botoes nunca fiquem lado a lado (ja que os textos sao longos demais para caber em linha).

### Arquivo: `src/pages/Transactions.tsx` (linhas 1196-1224)

Substituir:
```tsx
<AlertDialogFooter className="flex-col gap-2">
  <div className="flex flex-col sm:flex-row gap-2">
    ...buttons...
  </div>
  <AlertDialogCancel className="w-full mt-0">Cancelar</AlertDialogCancel>
</AlertDialogFooter>
```

Por:
```tsx
<div className="flex flex-col gap-2 pt-2">
  <Button variant="destructive" onClick={...}>
    Excluir apenas este mes
  </Button>
  <Button variant="destructive" onClick={...}>
    Excluir este e todos os seguintes
  </Button>
  <Button variant="outline" onClick={() => setRecurringDeleteTransaction(null)}>
    Cancelar
  </Button>
</div>
```

Isso elimina completamente o conflito de classes do `AlertDialogFooter` e garante layout vertical em todas as telas.

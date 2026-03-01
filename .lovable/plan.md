

# Fix: Dialog de exclusão recorrente cortado no desktop

## Problema
O `AlertDialogFooter` usa `sm:flex-row`, colocando os 3 botoes lado a lado no desktop. Como os textos sao longos ("Excluir apenas este mes", "Excluir este e todos os seguintes"), eles ficam cortados ou apertados.

## Solucao

### Arquivo: `src/pages/Transactions.tsx` (linhas 1196-1220)

Mudar o `AlertDialogFooter` para manter os botoes empilhados verticalmente tambem no desktop, ja que sao 3 botoes com textos longos:

- Trocar `className="flex-col sm:flex-row gap-2"` por `className="flex-col gap-2 sm:flex-row sm:justify-end"`
- Alternativamente, manter `flex-col` sempre (sem `sm:flex-row`) para garantir que os botoes nunca fiquem cortados
- Adicionar `w-full sm:w-auto` nos botoes para ficarem proporcionais

A abordagem mais limpa: manter layout em coluna com os 2 botoes destrutivos lado a lado em um grupo separado:

```
<AlertDialogFooter className="flex-col gap-2">
  <div className="flex flex-col sm:flex-row gap-2">
    <Button variant="destructive" className="flex-1">
      Excluir apenas este mes
    </Button>
    <Button variant="destructive" className="flex-1">
      Excluir este e todos os seguintes
    </Button>
  </div>
  <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
</AlertDialogFooter>
```

Isso garante que:
- No desktop, os 2 botoes destrutivos ficam lado a lado e o Cancelar embaixo
- No mobile, tudo fica empilhado verticalmente
- Nenhum texto fica cortado


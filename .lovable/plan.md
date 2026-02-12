
# Remover Valores Monetarios da Lista de Compras

## Objetivo

Remover o valor (ex: "R$ 15") de cada linha de compra na lista do dialog de detalhes do cartao. A linha ficara apenas com a descricao e a info de parcela/responsavel, sem o valor monetario.

## Alteracao

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

**Linhas 514-520** - Remover o `<span>` que exibe o valor formatado (`formatCurrency`), mantendo apenas o botao de menu (tres pontos).

Antes:
```
<div className="flex items-center gap-1 shrink-0">
  <span className="text-sm font-semibold min-w-[90px] text-right ...">
    {formatCurrency(Math.abs(p.valor))}
  </span>
  <DropdownMenu>...</DropdownMenu>
</div>
```

Depois:
```
<div className="flex items-center shrink-0">
  <DropdownMenu>...</DropdownMenu>
</div>
```

Isso libera todo o espaco horizontal para a descricao e elimina definitivamente o problema de corte em telas estreitas.

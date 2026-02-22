
# Simplificar seção "Fatura do Cartão" no modal "Despesas a Pagar"

## O que sera feito

Na seção "Fatura do Cartão (EU)" do modal DetalhesDespesasDialog, remover a listagem detalhada de parcelas individuais e mostrar apenas uma linha resumida por cartão. Cada linha sera clicável e redirecionará para `/cartoes/[id]/despesas`.

## Mudanca tecnica

### Arquivo: `src/components/dashboard/DetalhesDespesasDialog.tsx`

**Adicionar**: import de `useNavigate` do react-router-dom

**Substituir** o bloco de renderização da seção "Fatura do Cartão" (linhas 254-295):

De: listagem com sub-itens de parcelas por cartão

Para: apenas uma linha clicável por cartão contendo:
- Bolinha colorida (cor do cartão)
- Nome do cartão
- Icone de seta (ChevronRight) indicando navegação
- Valor total da fatura

Ao clicar, fechar o Sheet e navegar para `/cartoes/${cartao.id}/despesas`.

```typescript
<div className="space-y-2">
  {Object.values(parcelasPorCartao).map(({ cartao, total }) => (
    <div
      key={cartao.id}
      onClick={() => {
        onOpenChange(false);
        navigate(`/cartoes/${cartao.id}/despesas`);
      }}
      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: cartao.cor }}
        />
        <span className="text-sm font-medium">{cartao.nome}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          {formatCurrency(total)}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  ))}
</div>
```

## Arquivos modificados

- `src/components/dashboard/DetalhesDespesasDialog.tsx` - Simplificar seção de cartões para mostrar apenas resumo clicável por cartão

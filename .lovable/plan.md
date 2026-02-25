

# Fix: Cores desalinhadas na listagem de categorias

## Problema
Os quadradinhos de cor (swatches) estao aparecendo em posicoes inconsistentes porque compartilham o mesmo container flex com os botoes de editar/excluir. Quando os botoes de hover existem (categorias nao-padrao), o swatch se desloca. Alem disso, o layout `justify-between` empurra o swatch para a borda direita do card.

## Solucao em `src/pages/Categories.tsx`

### CategoryCard -- reestruturar o lado direito

Reorganizar o layout para que:
1. O swatch de cor fique sempre em posicao fixa, imediatamente apos o nome
2. Os botoes de acao fiquem apos o swatch, com largura fixa reservada

**De:**
```tsx
<div className="flex items-center gap-2">
  <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: ... }} />
  {!category.is_default && (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
      {/* botoes */}
    </div>
  )}
</div>
```

**Para:**
```tsx
<div className="flex items-center gap-3">
  <div className="w-3 h-3 rounded-[3px] shrink-0" style={{ backgroundColor: ... }} />
  <div className="flex items-center gap-1 w-[68px] justify-end">
    {!category.is_default && (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* botoes */}
      </div>
    )}
  </div>
</div>
```

Mudancas chave:
- Adicionar `shrink-0` no swatch para evitar que ele encolha
- Dar largura fixa (`w-[68px]`) ao container dos botoes de acao para que o swatch nunca mude de posicao, independente de haver botoes ou nao
- Isso garante que todas as linhas tenham o swatch no mesmo alinhamento horizontal

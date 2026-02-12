

# Corrigir Layout Descentralizado - Remover Borda e Ajustar Overflow

## Problema

O `DialogContent` base possui a classe `border` que adiciona uma borda de 1px ao redor do modal. Quando o header colorido usa `rounded-t-lg` dentro de um container `rounded-lg` sem `overflow-hidden`, aparece uma fresta branca visivel entre o header colorido e as bordas do modal, causando o efeito "descentralizado".

## Solucao

Para todos os 13 modais de cartao que usam header colorido:

1. **Adicionar `border-0`** ao `DialogContent` para remover a borda que cria a fresta visivel (a sombra ja fornece separacao visual suficiente)
2. **Trocar `overflow-y-auto overflow-x-hidden` por `overflow-hidden`** no `DialogContent` para que o `rounded-lg` do container corte corretamente o header colorido nos cantos
3. **Adicionar `overflow-y-auto`** na div de conteudo (abaixo do header) para manter o scroll funcional no corpo do modal
4. **Remover `rounded-t-lg`** do header div, pois o `overflow-hidden` do container ja cuidara do arredondamento

## Detalhes Tecnicos

### Padrao atualizado para DialogContent:

**Antes:**
```tsx
<DialogContent className="... p-0 gap-0 overflow-y-auto overflow-x-hidden [&>button]:text-white ...">
  <div className="px-4 sm:px-5 pt-4 pb-4 rounded-t-lg" style={{ background: cartao.cor }}>
    {/* header */}
  </div>
  <div className="px-4 sm:px-5 py-4 space-y-3">
    {/* conteudo */}
  </div>
</DialogContent>
```

**Depois:**
```tsx
<DialogContent className="... p-0 gap-0 border-0 overflow-hidden [&>button]:text-white ...">
  <div className="px-4 sm:px-5 pt-4 pb-4" style={{ background: cartao.cor }}>
    {/* header */}
  </div>
  <div className="px-4 sm:px-5 py-4 space-y-3 overflow-y-auto">
    {/* conteudo */}
  </div>
</DialogContent>
```

### Arquivos a atualizar (13 modais):

1. **DetalhesCartaoDialog.tsx** - Adicionar `border-0 overflow-hidden`, remover `overflow-y-auto overflow-x-hidden`, remover `rounded-t-lg` do header, adicionar `overflow-y-auto` na div de conteudo
2. **NovaCompraCartaoDialog.tsx** - Mesmo padrao
3. **PagarFaturaDialog.tsx** - Mesmo padrao
4. **EditarCartaoDialog.tsx** - Mesmo padrao
5. **GerarMensagemDialog.tsx** - Mesmo padrao
6. **RegistrarAcertoDialog.tsx** - Mesmo padrao
7. **AdiantarFaturaDialog.tsx** - Mesmo padrao
8. **ExcluirCartaoDialog.tsx** - Mesmo padrao
9. **AjustarFaturaDialog.tsx** - Mesmo padrao
10. **EditarCompraDialog.tsx** - Mesmo padrao
11. **EstornarCompraDialog.tsx** - Mesmo padrao
12. **DetalhesCompraCartaoDialog.tsx** - Mesmo padrao
13. **ExcluirCompraDialog.tsx** - Mesmo padrao (AlertDialog)

### Por que funciona

- `border-0` elimina a fresta branca entre o header colorido e a borda do modal
- `overflow-hidden` no container garante que o header colorido respeite os cantos arredondados do modal sem precisar de `rounded-t-lg` proprio
- `overflow-y-auto` na div de conteudo mantem o scroll funcional apenas na area de conteudo, enquanto o header permanece fixo no topo


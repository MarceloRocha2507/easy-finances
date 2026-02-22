
# Melhorar visual das Contas Pendentes no modal "Despesas a Pagar"

## Problema

Os icones das categorias estao sendo renderizados como texto (ex: "car") em vez de icones Lucide, porque o componente usa `{transacao.category?.icon}` diretamente como string ao inves de mapear para o componente Lucide correto.

## Solucao

### Arquivo: `src/components/dashboard/DetalhesDespesasDialog.tsx`

1. **Adicionar ICON_MAP e funcao `getIconComponent`** - Mesmo padrao ja usado em `Transactions.tsx`, `Reports.tsx`, etc. Mapeia nomes como "car", "wallet", "utensils" para os componentes Lucide correspondentes.

2. **Substituir a renderizacao do icone da categoria** - Em vez de exibir o texto da string do icone, renderizar o componente Lucide dentro de um circulo colorido com a cor da categoria.

3. **Melhorar o visual dos itens** - Adicionar um circulo de fundo colorido (cor da categoria) ao redor do icone, similar ao padrao usado nas outras telas do sistema.

### Mudancas visuais nos itens de Contas Pendentes

De:
```
[car] Sem descricao          R$ 421,51
      Vence em 10/03
```

Para:
```
[icone Lucide em circulo colorido] Sem descricao    R$ 421,51
                                   Vence em 10/03
```

### Detalhes tecnicos

- Imports adicionais: `Car, Utensils, Home, ShoppingCart, Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, Book, Package, Zap, DollarSign, Briefcase, Tag, TrendingUp` do lucide-react
- Adicionar constante `ICON_MAP` e funcao `getIconComponent` (mesmo padrao das outras paginas)
- Substituir `<span className="text-lg">{transacao.category?.icon || "📦"}</span>` por um div com fundo na cor da categoria contendo o icone Lucide renderizado corretamente
- Usar `transacao.category?.color` como cor de fundo (com opacidade) para o circulo do icone

### Arquivo modificado

- `src/components/dashboard/DetalhesDespesasDialog.tsx`



# Redesign da Pagina de Categorias

Redesign completo da pagina de Categorias para alinhar com o estilo premium fintech do resto do app.

## Alteracoes em `src/pages/Categories.tsx`

### 1. Botao "Nova Categoria"
- Trocar estilo do Button para `className="bg-[#111827] hover:bg-[#1F2937] text-white"` sem sombra pesada.

### 2. Tabs (Categorias / Regras)
- Remover o componente `TabsList` com grid background. Substituir por um container `flex` com borda inferior.
- Cada tab sera um botao com estilo de underline: ativo = `border-b-2 border-[#111827] text-[#111827] font-semibold`, inativo = `text-[#6B7280]`.
- Remover icones das tabs (FolderOpen, Wand2).

### 3. Headers de secao (Receitas / Despesas)
- Remover icones coloridos (TrendingUp, TrendingDown) dos titulos.
- Remover classes `text-income` e `text-expense`.
- Usar texto `text-[#111827] font-semibold` para ambos.
- Adicionar contagem ao lado: `<span className="text-[#6B7280] font-normal text-sm ml-2">{count}</span>`.

### 4. Container das duas colunas
- Manter `Card` mas com classes: `border border-[#E5E7EB] rounded-xl shadow-none`.
- Remover `CardHeader` padding desnecessario.

### 5. CategoryCard (itens da lista)
- **Icone**: Remover background colorido. Usar `bg-[#F3F4F6]` fixo com icone em `text-[#6B7280]` (sem `style={{ color }}`).
- **Color swatch**: Trocar circulo de 12px (rounded-full) por quadrado 12x12px com `rounded-[3px]`.
- **Edit/Delete**: Esconder por padrao com `opacity-0 group-hover:opacity-100 transition-opacity`. Adicionar `group` class no row.
- **Row**: Remover `rounded-md border` individual. Usar `border-b border-[#F3F4F6] last:border-b-0` e `hover:bg-[#F9FAFB]`.
- **Trash icon**: Remover `text-destructive`, usar `text-[#9CA3AF] hover:text-[#374151]`.

### 6. Preview no dialog
- Atualizar preview para refletir o novo estilo (swatch quadrado, icone neutro).

## Resumo visual

| Elemento | Antes | Depois |
|----------|-------|--------|
| Tabs | Pill/grid com background | Underline minimal |
| Headers secao | Icone colorido + texto colorido | Texto neutro bold + contagem |
| Icone categoria | Background com cor da categoria | Background #F3F4F6 fixo, icone #6B7280 |
| Color indicator | Circulo 12px colorido | Quadrado 12x12 rounded-[3px] |
| Edit/Delete | Sempre visivel | Visivel apenas no hover |
| Row | Card com border individual | Lista com border-bottom sutil |
| Container | Card generico | White card, border #E5E7EB, rounded-xl |




# Otimizar tabela de despesas do cartao para mobile

## Alteracoes no arquivo `src/pages/DespesasCartao.tsx`

### 1. Remover coluna "Valor" da tabela
- Remover o `<TableHead>` "Valor" (linha 762)
- Remover o `<TableCell>` com o valor formatado (linhas 878-892)
- Reduzir o `colSpan` das celulas de loading/empty de 9 para 8

### 2. Substituir botoes inline por dropdown de 3 pontos
- Remover todo o bloco de botoes individuais (Editar, Estornar, Excluir) com tooltips (linhas 900-968)
- Substituir por um `DropdownMenu` com `MoreVertical` como trigger e 3 itens:
  - Editar (icone Pencil)
  - Estornar (icone RotateCcw)  
  - Excluir (icone Trash2, com estilo destructive)

### 3. Remover coluna de acoes do header
- O `<TableHead className="w-20">` (linha 764) que servia de header para os botoes sera mantido mas com largura menor (`w-10`) para acomodar apenas o botao de 3 pontos

### Resultado esperado
- Tabela mais compacta: sem coluna de valor, sem 3 botoes por linha
- Valor acessivel apenas pelo modal de detalhes (clique na linha)
- Acoes agrupadas num dropdown discreto
- Melhor legibilidade em telas pequenas

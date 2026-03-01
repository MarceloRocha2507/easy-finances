

# Redesign da seção "Contas a Pagar"

## Alteracoes no arquivo `src/components/dashboard/ContasAPagar.tsx`

### 1. Cabecalho
- Adicionar separador visual (borda inferior com margem) entre o cabecalho e o conteudo.
- Aumentar levemente o padding do cabecalho.

### 2. Linhas de categoria (Faturas de Cartao / Contas Pendentes)
- Envolver cada CollapsibleTrigger em um container com fundo cinza claro (`bg-[hsl(210,20%,98%)]`), borda arredondada e padding mais generoso.
- Aumentar o tamanho do texto do rotulo da categoria e adicionar icone representativo (CreditCard para faturas, Receipt para contas).
- Alinhar quantidade e valor a direita, valor em vermelho e negrito.
- Aumentar a area de toque do chevron com padding extra e hover visual.
- Adicionar gap vertical entre os dois blocos.

### 3. Rodape de totais
- Separar com borda superior mais visivel.
- "Total Cartoes" e "Total Contas" lado a lado a esquerda.
- "Total a Pagar" a direita com fonte maior, negrito, e fundo vermelho claro (`bg-[hsl(0,93%,97%)]`) com padding e border-radius para destaque.

### 4. Espacamento geral
- Aumentar padding interno do container principal de `p-5` para `p-6`.
- Adicionar mais espaco vertical (`gap-3`) entre os blocos collapsiveis.

Nenhum arquivo novo sera criado. Apenas `ContasAPagar.tsx` sera modificado.


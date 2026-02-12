

# Remover Checkboxes e Limitar a 5 Compras no DetalhesCartaoDialog

## Problema

O dialog de detalhes do cartao exibe checkboxes ao lado de cada despesa (para marcar como paga) e mostra ate 6 itens. O usuario quer remover os checkboxes e limitar a exibicao a 5 compras, mantendo a interface limpa e focada no historico recente.

## Alteracoes

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

1. **Reduzir limite de 6 para 5 itens** (linha 205-206):
   - `parcelasFiltradas.slice(0, 5)` em vez de `slice(0, 6)`
   - `parcelasFiltradas.length > 5` em vez de `> 6`

2. **Remover o Checkbox de cada linha de despesa** (linhas 499-507):
   - Eliminar o componente `<Checkbox>` que permite marcar parcelas como pagas
   - Manter o restante do layout (descricao, parcela, responsavel, valor, menu de acoes)

3. **Remover import do Checkbox** se nao for mais utilizado em nenhum outro lugar do arquivo.

4. **Remover import de `desmarcarTodasParcelas`** (linha 7) caso nao seja mais utilizado.

## O que permanece

- Menu de acoes (tres pontos) com opcoes Editar, Estornar e Excluir
- Descricao, numero da parcela, responsavel
- Valor monetario com formatacao
- Botao "Ver todas as X despesas" / "Ver tela ampla"
- Busca e navegacao entre meses
- Resumo Pendente/Pago



# Simplificar modal de Detalhes do Cartao

## O que sera feito

Remover a listagem de compras recentes e o campo de busca do modal `DetalhesCartaoDialog`, mantendo apenas:
- Cabecalho do cartao (nome, bandeira, metricas, barra de uso)
- Navegacao de mes com icones de acao
- Resumo Pendente/Pago
- Botao "Ver todas as X despesas"
- Botoes "Editar cartao" e "Excluir"

## Mudancas tecnicas

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

1. **Remover bloco de busca** (linhas 464-485) - O Input de busca e toda a logica de filtro visual

2. **Remover bloco da lista de parcelas** (linhas 487-577) - O ScrollArea com a listagem de transacoes, incluindo loading, erro e itens individuais

3. **Simplificar variaveis nao mais necessarias**:
   - Remover estado `busca` e `setBusca`
   - Remover `parcelasFiltradas` e `parcelasExibidas` / `temMais` (usados apenas na lista)
   - Remover estados de dialogs de compra individual (`editarCompraOpen`, `excluirCompraOpen`, `estornarCompraOpen`, `parcelaSelecionada`)
   - Remover imports nao utilizados: `Search`, `X`, `Input`, `ScrollArea`, `EditarCompraDialog`, `ExcluirCompraDialog`, `EstornarCompraDialog`

4. **Atualizar texto do botao "Ver todas"** - Usar `parcelas.length` diretamente em vez de `parcelasFiltradas.length`

5. **Remover dialogs de compra individual** (linhas 689-739) - `EditarCompraDialog`, `ExcluirCompraDialog`, `EstornarCompraDialog` e seus handlers

6. **Remover import do `useMemo`** se nao for mais necessario apos limpeza (ainda usado por `totalMes` e `totalPago`)

O modal ficara mais compacto, mostrando apenas o resumo financeiro. O detalhamento completo das transacoes sera acessado via botao "Ver todas as despesas".

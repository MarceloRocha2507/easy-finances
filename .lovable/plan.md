
# Adicionar "Desmarcar pagas" ao Dialog de Detalhes do Cartao

## Problema

A opcao "Desmarcar pagas" foi implementada apenas na pagina de despesas (`/cartoes/:id/despesas`), mas o usuario acessa as compras pelo dialog de detalhes na pagina `/cartoes` (`DetalhesCartaoDialog`), onde a opcao nao existe.

## Solucao

Adicionar a opcao "Desmarcar pagas" no `DetalhesCartaoDialog.tsx`, no mesmo local onde ficam as outras acoes (dropdown mobile e botoes desktop).

### Alteracoes em `src/components/cartoes/DetalhesCartaoDialog.tsx`

1. **Importar** `desmarcarTodasParcelas` do servico `compras-cartao`
2. **Importar** `AlertDialog` e componentes relacionados
3. **Importar** `toast` do sonner
4. **Adicionar estado** `desmarcarPagasOpen` para controlar o AlertDialog de confirmacao
5. **Adicionar handler** `handleDesmarcarPagas` que chama o servico e recarrega a fatura
6. **Mobile (dropdown)**: novo item "Desmarcar pagas" com icone `RotateCcw`, desabilitado quando `totalPago === 0`
7. **Desktop (tooltips)**: novo botao com tooltip ao lado dos existentes, tambem desabilitado quando `totalPago === 0`
8. **AlertDialog** de confirmacao antes de executar a acao

### Fluxo

```text
Usuario abre detalhes do cartao em /cartoes
  -> Clica em "Desmarcar pagas" (menu mobile ou botao desktop)
  -> AlertDialog pergunta "Tem certeza?"
  -> Confirma
  -> Chama desmarcarTodasParcelas(cartao.id, mesRef)
  -> Recarrega fatura e atualiza lista
  -> Toast: "X compra(s) desmarcada(s)"
```

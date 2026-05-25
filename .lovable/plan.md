# Exclusão em lote com escopo (parcela atual vs. parcela + futuras)

## Comportamento atual
Em `src/pages/DespesasCartao.tsx`, ao selecionar várias compras e clicar em **Excluir**, abre um `AlertDialog` simples que deleta apenas a parcela do mês visível (`escopo: "parcela"`). As parcelas dos meses futuros da mesma compra continuam.

## Mudança proposta
Transformar o dialog de confirmação em lote em um dialog com **escolha de escopo**, espelhando a UX do `ExcluirCompraDialog` (que já tem essa escolha para item único).

### Opções no dialog
1. **Apenas as parcelas deste mês** (default)
   - Exclui só a parcela visível de cada compra selecionada
   - Sublabel: "X parcela(s) deste mês"
2. **Esta e todas as parcelas futuras**
   - Para cada selecionada, exclui a parcela atual + todas as posteriores (`numero_parcela >= atual`)
   - Sublabel mostra a contagem total estimada (ex.: "X selecionadas • Y parcelas no total contando futuras")
   - Só aparece se ao menos uma das selecionadas tiver parcelas futuras

### Implementação
- Em `handleExcluirLote`, receber o `escopo` escolhido e passar para `excluirParcelas`:
  - `"parcela"` → comportamento atual
  - `"restantes"` → usa o escopo já suportado pelo hook (visto em `ExcluirCompraDialog` linha 207)
- Trocar o `AlertDialog` (linhas 1219–1238) por um dialog com 2 `RadioOption`s no mesmo estilo do `ExcluirCompraDialog` (premium fintech, borda `#111827` quando selecionado).
- Calcular a prévia de "Y parcelas no total" iterando `selecionadas` e contando, para cada compra, quantas parcelas têm `numero_parcela >= parcela.numero_parcela` na lista completa `parcelas`.

### Arquivos
- `src/pages/DespesasCartao.tsx` — atualizar `handleExcluirLote` para aceitar escopo + reescrever o dialog `confirmarExcluirLoteOpen` com as opções.

## Fora do escopo
- Não alterar o `ExcluirCompraDialog` individual (já funciona).
- Não tocar no hook `excluirParcelas` (já suporta os 3 escopos).

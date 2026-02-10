

# Desmarcar Todas as Compras Pagas

## O que sera feito

Adicionar uma opcao "Desmarcar pagas" no menu de acoes da fatura, que remove a marcacao de "paga" de todas as compras do mes selecionado. Util quando o usuario marcou parcelas como pagas por engano ou precisa reverter o status de toda a fatura.

## Onde aparece

- **Mobile**: novo item no dropdown (menu de 3 pontinhos) junto com "Ajustar fatura", "Adiantar pagamento" e "Excluir fatura"
- **Desktop**: novo botao com tooltip na barra de acoes, ao lado dos botoes existentes

A opcao so fica habilitada quando existem parcelas marcadas como pagas no mes.

## Detalhes tecnicos

### 1. Nova funcao no servico (`src/services/compras-cartao.ts`)

Criar `desmarcarTodasParcelas(cartaoId, mesReferencia)` que:
- Lista parcelas da fatura
- Filtra as que estao com `paga = true`
- Atualiza todas para `paga = false` em uma unica query

### 2. Botao e menu na pagina (`src/pages/DespesasCartao.tsx`)

- Adicionar item "Desmarcar pagas" no dropdown mobile (com icone `RotateCcw`)
- Adicionar botao com tooltip no desktop
- Desabilitado quando nao ha parcelas pagas (`totalPago === 0`)
- Ao clicar: chamar a funcao, recarregar fatura e exibir toast de confirmacao
- Usar `AlertDialog` para confirmar a acao antes de executar, evitando cliques acidentais

### 3. Fluxo

```text
Usuario clica "Desmarcar pagas"
  -> AlertDialog de confirmacao ("Tem certeza?")
  -> Confirma
  -> Chama desmarcarTodasParcelas()
  -> Recarrega fatura
  -> Toast: "Todas as compras foram desmarcadas"
```

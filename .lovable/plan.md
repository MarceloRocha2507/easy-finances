

# Registrar Pagamento por Quantidade/Pessoa

## Objetivo

Adicionar um novo modo de pagamento no dialog "Pagar Fatura" onde o usuario pode informar quanto cada pessoa pagou. Exemplo: "Eu paguei R$ 500, mae pagou R$ 300, irmao pagou R$ 200".

## O que muda

### `src/components/cartoes/PagarFaturaDialog.tsx`

Adicionar um terceiro modo de pagamento alem dos dois existentes:

| Modo atual | Descricao |
|---|---|
| Eu pago tudo | Titular paga o valor integral ao banco |
| Cada um pagou sua parte | Marca quem ja devolveu (valor fixo = total da pessoa) |
| **Dividir valores (NOVO)** | **Permite digitar quanto cada pessoa pagou** |

**No novo modo "Dividir valores":**
- Para cada responsavel (incluindo titular), exibir um campo de valor editavel (Input)
- Pre-preencher com o valor devido de cada pessoa
- Mostrar um totalizador em tempo real: "Total informado: R$ X / R$ Y da fatura"
- Validar que a soma dos valores informados == total da fatura antes de confirmar
- Se alguem pagou R$ 0, nao registrar acerto para essa pessoa

**Logica de salvamento:**
- O valor que o titular informou = valor da transacao de despesa no saldo real
- Para cada outro responsavel com valor > 0, registrar acerto como "quitado" com o valor informado
- Marcar todas as parcelas como pagas (igual ja funciona)

### Tipo `ModoPagamento`

Adicionar novo valor:

```text
"eu_pago_tudo" | "cada_um_pagou" | "dividir_valores"
```

### Interface do novo modo

Dentro da secao de responsaveis, quando o modo for "dividir_valores":
- Cada responsavel tera um campo Input ao lado do nome
- O campo tera inputMode="decimal" e placeholder com o valor devido
- Um card totalizador mostra a soma vs o total da fatura
- Se a soma nao bater, o botao de confirmar fica desabilitado com mensagem de aviso

### Chamada a `pagarFaturaComTransacao`

No modo "dividir_valores":
- `valorTotal` = valor digitado para o titular
- `acertosRecebidos` = array com cada responsavel nao-titular que teve valor > 0

## Arquivos a modificar

| Arquivo | Alteracao |
|---|---|
| `src/components/cartoes/PagarFaturaDialog.tsx` | Adicionar modo "dividir_valores" com campos de valor por pessoa |

Nenhuma alteracao no backend e necessaria -- a funcao `pagarFaturaComTransacao` ja suporta acertos parciais.


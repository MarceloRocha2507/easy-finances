

# Registrar Receitas dos Responsaveis ao Pagar Fatura

## O que muda

Quando a fatura for paga nos modos "Cada um pagou sua parte" ou "Dividir valores", alem da despesa do titular, o sistema tambem registrara uma transacao de **receita** para cada valor recebido de outros responsaveis. Isso reflete corretamente que o dinheiro recebido de terceiros e uma entrada no seu caixa.

## Exemplo pratico

Fatura total: R$ 1.000
- Eu (titular): R$ 400 (despesa)
- Joao me pagou: R$ 350 (receita)
- Maria me pagou: R$ 250 (receita)

Transacoes criadas:
1. Despesa: "Fatura Nubank - fevereiro 2026" = R$ 400
2. Receita: "Acerto fatura Nubank - Joao" = R$ 350
3. Receita: "Acerto fatura Nubank - Maria" = R$ 250

## Detalhes tecnicos

### 1. Alterar tipo `PagarFaturaInput` (`src/services/compras-cartao.ts`)

Adicionar campo `nome` em cada item de `acertosRecebidos`:

```text
acertosRecebidos: Array<{
  responsavel_id: string;
  valor: number;
  nome: string;   // <-- novo
}>
```

### 2. Criar transacoes de receita em `pagarFaturaComTransacao`

Apos criar a despesa do titular (passo 2 existente), adicionar um passo 2.5:

- Buscar ou criar categoria de receita "Acerto de Fatura" (tipo income)
- Para cada acerto recebido com valor > 0, inserir uma transacao de receita:
  - description: "Acerto fatura {nomeCartao} - {nomeResponsavel}"
  - amount: valor do acerto
  - type: "income"
  - status: "completed"
  - date e paid_date: data atual

### 3. Atualizar `PagarFaturaDialog.tsx`

Passar o nome do responsavel em cada item de `acertosRecebidos`:

- No modo "cada_um_pagou": incluir `nome: r.responsavel_apelido || r.responsavel_nome`
- No modo "dividir_valores": idem

### 4. Atualizar `DespesasCartao.tsx` (se tambem chama o servico)

Verificar se a pagina de despesas tambem usa `pagarFaturaComTransacao` e ajustar para passar nomes, se necessario.

### Fluxo atualizado

```text
Usuario paga fatura (dividir valores ou cada um pagou)
  -> Cria despesa do titular (valor que EU pago)
  -> Para cada responsavel que me pagou:
     -> Cria receita "Acerto fatura X - NomeResponsavel"
  -> Registra acertos como quitados
  -> Toast de confirmacao
```

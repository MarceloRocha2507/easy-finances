
# Plano: Descontar Depósitos em Metas do Saldo Disponível

## Resumo do Problema

Quando você adiciona R$96 a uma meta de economia, o valor é registrado apenas como progresso da meta, mas **não reduz o saldo disponível**. Você espera que esse valor seja tratado como dinheiro "guardado" e subtraído do saldo.

## Solução Proposta

Modificar o cálculo do saldo disponível para **subtrair o total acumulado em metas** do saldo base.

## Alterações Necessárias

### 1. Atualizar o cálculo em `useTransactions.ts`

Modificar a função `useCompleteStats` para subtrair o valor total das metas do saldo disponível:

| Campo | Cálculo Atual | Novo Cálculo |
|-------|---------------|--------------|
| Saldo Base | `saldoInicial + receitas - despesas` | Mantém igual |
| Saldo Disponível | `saldoBase` (sem descontos) | `saldoBase - totalGuardadoEmMetas` |
| Patrimônio Total | `saldoBase` | Mantém igual |

**Lógica:**
- O patrimônio total continua mostrando tudo que você tem
- O saldo disponível passa a mostrar quanto você pode gastar (descontando o que está guardado em metas)

### 2. Código da Alteração

Linhas 774-777 de `src/hooks/useTransactions.ts`:

```javascript
// ANTES:
const saldoDisponivel = saldoBase;

// DEPOIS:
const saldoDisponivel = saldoBase - totalGuardado;
```

Onde `totalGuardado` já é calculado no hook como a soma de `valor_atual` de todas as metas.

### 3. Verificar invalidação de cache

Confirmar que `useAdicionarValorMeta` já invalida `complete-stats` e `dashboard-completo` (já está implementado no código).

## Impacto Visual

| Situação | Antes | Depois |
|----------|-------|--------|
| Receita de R$96 | Saldo: R$96 | Saldo: R$96 |
| Deposita R$96 na meta | Saldo: R$96 (não muda) | Saldo: R$0 |
| Meta mostra | Progresso: R$96 | Progresso: R$96 |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useTransactions.ts` | Subtrair `totalGuardado` do `saldoDisponivel` |

## Detalhes Técnicos

### Localização exata da alteração

No hook `useCompleteStats` (linhas 680-795):

```javascript
// Linha 789-790 - já existe o totalGuardado:
totalMetas,
totalGuardado,

// Linha 774-775 - alterar de:
const saldoDisponivel = saldoBase;

// Para:
const saldoDisponivel = saldoBase - totalGuardado;
```

O `totalGuardado` já é calculado anteriormente no hook (busca a soma de `valor_atual` de todas as metas).

## Resultado Esperado

- Ao adicionar valor a uma meta, o saldo disponível reduz imediatamente
- O patrimônio total permanece inalterado (o dinheiro ainda é seu, só está "reservado")
- A atualização será automática sem precisar recarregar a página

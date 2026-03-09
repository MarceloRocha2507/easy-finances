

## Plano: Adicionar seletor de conta bancária nas transações

O objetivo é permitir que o usuário escolha em qual conta bancária a transação está vinculada, refletindo no saldo de cada banco.

A tabela `transactions` já possui a coluna `banco_id` -- só falta integrar no formulário.

### Alterações

**1. `src/hooks/useTransactions.ts`** — Adicionar `banco_id` ao `TransactionInsert` e ao `Transaction` type, e incluí-lo nas mutations de create/update.

**2. `src/pages/Transactions.tsx`**:
- Adicionar `banco_id` ao `TransactionFormData` (string | null)
- Importar `BancoSelector` de `@/components/bancos/BancoSelector`
- Adicionar o seletor no formulário (após o campo de categoria)
- Enviar `banco_id` no `handleSubmit`
- Preencher `banco_id` no `handleEdit` e `handleDuplicate`

**3. Nenhuma migração necessária** — a coluna `banco_id` já existe na tabela `transactions`.

O saldo por banco já é calculado em `listarBancosComResumo()` usando transações com `banco_id`, então ao vincular transações a bancos, o saldo será refletido automaticamente nos cards de banco e no Dashboard.


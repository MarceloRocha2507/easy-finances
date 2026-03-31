

## Plano: Diálogo de edição para transações recorrentes/parceladas

### Problema
Ao editar o **valor** de uma receita (ou despesa) recorrente/parcelada, o sistema atualiza apenas o registro individual, sem perguntar se o usuário quer alterar **todas** as transações da série ou **somente a do mês selecionado**.

### Solução
Criar um fluxo similar ao que já existe para exclusão (`RecurringDeleteDialog`), mas para edição.

### Arquivos e mudanças

**1. Novo componente: `src/components/transactions/RecurringEditDialog.tsx`**
- Dialog com duas opções: "Editar apenas este mês" e "Editar este e todos os seguintes"
- Recebe a transação sendo editada e os dados atualizados
- Usa `parent_id` para identificar o grupo (mesmo padrão do `RecurringDeleteDialog`)
- Conta quantos registros futuros serão afetados

**2. Novo hook: `useUpdateRecurringTransactions` em `src/hooks/useTransactions.ts`**
- Modo `single`: atualiza apenas o registro com o `id` informado (comportamento atual)
- Modo `future`: busca `parent_id` do registro, depois atualiza todos os registros do grupo com `date >= date` da transação selecionada (valor, categoria, descrição, banco)

**3. Alteração em `src/pages/Transactions.tsx`**
- No `handleSubmit`, quando `editingId` estiver preenchido E a transação for recorrente/parcelada (`tipo_lancamento !== 'unica'` ou `is_recurring`):
  - Em vez de chamar `updateMutation` direto, armazena os dados pendentes em um state e abre o `RecurringEditDialog`
  - O callback do dialog chama o novo hook com o modo escolhido
- Transações únicas continuam com o fluxo atual sem interrupção

### Comportamento esperado
- Editar transação **única** → salva direto (sem mudança)
- Editar transação **recorrente/parcelada** → fecha o formulário, abre dialog perguntando "apenas este mês" ou "este e todos os seguintes" → aplica conforme escolha



# Remover a aba "Recorrentes" do sistema

## O que sera feito

Remover completamente a pagina e navegacao "Recorrentes" do sistema, incluindo a rota, o item no menu lateral e o arquivo da pagina.

## Mudancas tecnicas

### 1. `src/components/sidebar/SidebarNav.tsx`
- Remover o item `{ icon: RefreshCw, label: "Recorrentes", href: "/transactions/recorrentes" }` do array `subItems` do menu de Transacoes
- Remover o import `RefreshCw` se nao for usado em outro lugar

### 2. `src/App.tsx`
- Remover o lazy import `RecorrentesPage`
- Remover o bloco `<Route path="/transactions/recorrentes" ...>`

### 3. `src/pages/transactions/Recorrentes.tsx`
- Deletar o arquivo completamente

## O que NAO sera alterado

- O hook `useDeleteRecurringTransactions` em `useTransactions.ts` sera mantido, pois a logica de exclusao de transacoes recorrentes ainda pode ser usada em outros contextos (como na tela principal de Transacoes)
- A funcionalidade de criar transacoes fixas/recorrentes continua existindo, apenas a pagina dedicada sera removida

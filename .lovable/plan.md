## Objetivo

Adicionar um card "Total Estimado" na aba **Transações**, ao lado dos cards "A Pagar" e "A Receber", mostrando o saldo estimado do mês selecionado considerando apenas o responsável **EU (titular)**.

## Fórmula

```
Total Estimado do Mês =
    Saldo Inicial (titular)
  + Receitas confirmadas até o fim do mês selecionado
  − Despesas confirmadas até o fim do mês selecionado
  − Despesas pendentes do mês selecionado
  − Faturas de cartão em aberto do mês selecionado (parte do titular)
```

Regras importantes:
- Apenas movimentações marcadas como do titular ("EU") entram no cálculo.
- Transações com flag `desconsiderar_saldo = true` são ignoradas (regra já existente no projeto).
- Faturas já pagas **não** entram como pendência (já saíram via despesa de pagamento). Faturas estornadas voltam ao estado "em aberto" automaticamente — o cálculo as reincluirá sem duplicar, porque a despesa de pagamento original também é removida no estorno.
- Parcelas de cartão usam a parte do titular (`valor_titular` quando houver split; caso contrário, valor cheio).

## Onde aparece

`src/pages/Transactions.tsx` — na mesma grid dos cards `TotalAPagarCard` e `TotalAReceberCard`, virando uma grid de 3 colunas em desktop e empilhada em mobile, seguindo o mesmo padrão visual minimalista (sem gradientes, paleta canônica).

## Implementação técnica

1. **Novo hook** `src/hooks/useTotalEstimadoMes.ts`
   - Input: `mesReferencia: Date` (vem do filtro de período já centralizado).
   - Busca em paralelo via React Query:
     - `useSaldoInicial` (já existe) — saldo inicial global do titular.
     - `transactions` confirmadas com `date < primeiroDiaMesSeguinte`, agrupando receitas e despesas (filtra `responsavel` = titular ou nulo; ignora `desconsiderar_saldo`).
     - `transactions` pendentes (status `pending`) dentro do mês selecionado.
     - `parcelas_cartao` ativas do mês cuja fatura **não está paga** (via `acertos_fatura`/`status_fatura`), somando `valor_titular` quando existir.
   - `queryKey`: `["total-estimado-mes", userId, mesKey]`.
   - `staleTime`: 60s; invalidado pelas mutations existentes (criar/editar/excluir transação, pagar/estornar fatura, ajustar saldo).

2. **Novo componente** `src/components/transactions/TotalEstimadoCard.tsx`
   - Usa `StatCardMinimal` (já existe) com:
     - Título: "Total Estimado"
     - Ícone: `Wallet` ou `TrendingUp`
     - Cor: verde (#16A34A) se ≥ 0, vermelho (#DC2626) se < 0
     - `subInfo`: "Saldo previsto ao fim de {mês}"
   - Estado loading com Skeleton.
   - Clique abre dialog com breakdown (Saldo inicial / Receitas / Despesas confirmadas / Pendentes / Faturas em aberto).

3. **Integração** em `src/pages/Transactions.tsx`
   - Ajustar grid dos resumos para 3 colunas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
   - Passar `mesReferencia` do filtro de período atual.

4. **Invalidação de cache** — garantir que estes pontos invalidem `["total-estimado-mes"]`:
   - `useTransactions` (create/update/delete/toggleStatus)
   - `PagarFaturaDialog` (após pagamento e após estorno)
   - `AjustarSaldoDialog` / `useSaldoInicial`
   - Edição/exclusão de compras de cartão

## Cenários validados pela lógica

| Cenário | Comportamento esperado |
|---|---|
| Pagar fatura do cartão | Fatura sai das pendências; despesa de pagamento entra em "confirmadas". Saldo líquido inalterado. |
| Estornar pagamento | Despesa de pagamento removida; fatura volta para pendências. Saldo líquido inalterado, sem duplicidade. |
| Editar valor de despesa | Recalcula via invalidate, sem reload manual. |
| Excluir despesa | Removida da soma instantaneamente. |
| Mudar mês selecionado | Hook re-busca com `mesKey` novo. |
| Transação `desconsiderar_saldo` | Não entra em nenhum dos totais. |
| Despesa de terceiro (não-titular) | Não entra no cálculo do EU. |

## Memória do projeto

Após implementar, salvar `mem://features/transactions/total-estimado-mes` documentando a fórmula e adicionar referência em `mem://index.md`.

## Fora do escopo

- Não recriar o "Saldo Estimado" global removido anteriormente.
- Não alterar Dashboard nem outras páginas.
- Sem mudanças de schema do banco.

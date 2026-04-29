# Plano: Permitir alterar o cartão de uma compra de cartão

## Problema
No `EditarCompraDialog` é possível editar descrição, valor, mês, parcela inicial, responsável, categoria e nome na fatura — **mas não o cartão**. Se o usuário registrou a compra no cartão errado, hoje precisa excluir e recadastrar.

## Solução
Adicionar um seletor de **Cartão** no dialog de edição da compra. Ao salvar, o `cartao_id` da compra é atualizado, e como as parcelas se vinculam ao cartão via `compras_cartao.cartao_id`, todas as parcelas (pagas e não pagas) passam automaticamente a pertencer ao novo cartão — não há necessidade de mexer em `parcelas_cartao`.

## Arquivos alterados

### 1. `src/services/compras-cartao.ts` — função `editarCompra`
- Aceitar novo campo opcional `cartaoId` no objeto `dados`.
- Se informado e diferente do atual, incluir `cartao_id` no `updateData` da tabela `compras_cartao`.

### 2. `src/components/cartoes/EditarCompraDialog.tsx`
- Carregar a lista de cartões do usuário ao abrir (via `listarCartoes()` de `services/cartoes.ts`, ou query direta a `cartoes`).
- Carregar `cartao_id` atual da compra junto com os outros campos no `useEffect` existente.
- Adicionar um novo state `cartaoId` e um `<Select>` "Cartão de pagamento" no formulário (logo após "Descrição" / "Nome na Fatura", antes do toggle "Editar só este mês").
- O seletor fica **desabilitado** quando `editarApenasMes` está ligado (a troca de cartão é uma alteração estrutural da compra, não de uma parcela isolada).
- Ao salvar (modo "compra inteira"), passar `cartaoId` para `editarCompra`.
- Após salvar, invalidar as queries de `cartoes`, `compras-cartao` e `parcelas-cartao` para refletir a mudança nos dois cartões (origem e destino).

## Comportamento esperado
- Compra única ou parcelada → usuário pode trocar o cartão pelo dropdown e salvar.
- Todas as parcelas (incluindo pagas) ficam vinculadas ao novo cartão automaticamente, pois a tabela `parcelas_cartao` referencia a compra e a compra referencia o cartão.
- Toggle "Editar só este mês" desabilita o seletor de cartão (não faz sentido trocar o cartão de uma parcela isolada).
- Toast de sucesso e atualização imediata das listagens dos dois cartões envolvidos.

## Detalhes técnicos
- Sem alterações de schema — `compras_cartao.cartao_id` já existe e é editável.
- Sem alterações em `parcelas_cartao` — relacionamento via `compra_id` mantém integridade.
- RLS já cobre o caso (usuário só pode atualizar suas próprias compras e só pode escolher seus próprios cartões).
- Auditoria: o trigger `audit_compras_cartao` já registra o UPDATE com dados anteriores e novos, então a troca de cartão fica rastreada automaticamente.

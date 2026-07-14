
## Objetivo

Criar um único conceito **Despesas Recorrentes** que substitui `assinaturas` e o fluxo de `transactions` com `tipo_lancamento='recorrente'`. O usuário cadastra o modelo uma vez; o sistema pré-gera N ocorrências futuras (transactions ou compras de cartão) já vinculadas à recorrência-mãe. Alterações no modelo afetam apenas ocorrências futuras ainda não pagas.

## Arquitetura

### 1. Nova tabela `despesas_recorrentes` (modelo/template)

Campos principais:
- `nome`, `descricao`, `valor`, `moeda`, `category_id`, `subcategoria_id`
- `frequencia` — `diaria | semanal | quinzenal | mensal | bimestral | trimestral | semestral | anual`
- `intervalo` int (ex.: a cada 2 meses)
- `data_inicio`, `data_fim` (nullable = infinita)
- `metodo_pagamento` — `dinheiro | pix | debito | conta | cartao_credito`
- `banco_id` (para pix/débito/conta), `cartao_id` (para cartão de crédito), `responsavel_id`
- `status` — `ativa | pausada | cancelada`
- `dia_lembrete`, `observacoes`, `link_cancelamento`, `vinculo_automatico`
- `horizonte_geracao_meses` int default 12 — janela pré-gerada
- `origem_migracao` — `assinatura | transaction_recorrente | manual` (para rastrear migração)

### 2. Vínculo com as ocorrências (sem tabela extra)

- Adicionar `recorrencia_id UUID` em `transactions` e em `compras_cartao`, com FK `ON DELETE SET NULL`.
- Cada ocorrência gerada carrega esse `recorrencia_id`. Edições/exclusões individuais não afetam a mãe.

### 3. Geração de ocorrências (pré-gerada, no cliente)

Novo módulo `src/services/despesas-recorrentes.ts`:
- `gerarOcorrencias(recorrencia, ate)` calcula datas de `data_inicio` até `min(data_fim, hoje + horizonte)`.
- Para cada data:
  - Se `cartao_credito` → cria `compras_cartao` (usa `calcularMesFaturaCartao` com fechamento do cartão) + `parcelas_cartao` de 1x. Categoria = "Fatura do Cartão" (regra canônica).
  - Caso contrário → cria `transactions` com `type='expense'`, `status='pending'`, `due_date`, `banco_id`, `category_id` etc.
- Ao criar recorrência: gera todas as ocorrências dentro do horizonte.
- Ao editar recorrência: apaga ocorrências futuras `status='pending'` (transactions) ou compras futuras não pagas (compras_cartao onde `mes_inicio > mês atual` e sem pagamento) com o mesmo `recorrencia_id`, e regenera com o novo modelo.
- Ao pausar/cancelar: idem — remove futuras pendentes.
- Job de "manutenção" client-side: hook `useDespesasRecorrentes` chama `gerarProximasSeNecessario()` no mount para estender o horizonte à medida que o tempo passa.

### 4. Migração de dados existentes

Migration única e idempotente:
- Adiciona colunas `recorrencia_id` em `transactions` e `compras_cartao`.
- Cria `despesas_recorrentes` com RLS + GRANTs + trigger `updated_at`.
- Migra cada `assinaturas` → 1 linha em `despesas_recorrentes` (`origem_migracao='assinatura'`, mapeando `metodo_pagamento`, `cartao_id_pagamento` → `cartao_id`).
- Migra pais de `transactions` recorrentes (parent_id NULL + `tipo_lancamento='recorrente'`) → `despesas_recorrentes`, e propaga `recorrencia_id` para os filhos.
- Após a migração, a página "Assinaturas" passa a ser um filtro dentro do novo módulo (Categoria = streaming/software). Mantemos a rota `/assinaturas` redirecionando para `/recorrentes?filtro=assinatura` para não quebrar links.

### 5. UI

Nova página `src/pages/Recorrentes.tsx` + componentes:
- `NovaRecorrenciaDialog.tsx` — form completo (nome, valor, categoria, frequência+intervalo, data início/fim, método, banco/cartão, responsável, observações).
- `EditarRecorrenciaDialog.tsx` — aviso "só afeta lançamentos futuros pendentes".
- `RecorrenciaCard.tsx` — lista com próxima cobrança, total pago histórico, ações (pausar/cancelar/reativar/excluir).
- `DetalhesRecorrenciaDialog.tsx` — histórico de ocorrências (pagas + pendentes) filtradas por `recorrencia_id`.

Aplicar tokens do design system (memórias `mem://style/*`), light theme, mobile-first.

### 6. Integração com o resto do sistema

- Dashboard, relatórios, calendário e fluxo de caixa já consomem `transactions` e `compras_cartao` — funcionam automaticamente porque as ocorrências viram esses registros.
- `useCalendarioEventos`: remover ramo "assinaturas" (ficam como transactions com `recorrencia_id`).
- Radar de Gastos Invisíveis: passa a ler `despesas_recorrentes` ativas.
- Ajuste no `useAjusteEstimado`: opcionalmente somar recorrências futuras dentro do mês que ainda não têm ocorrência gerada (edge case do horizonte).

### 7. Menu/rotas

- Novo item "Recorrentes" na sidebar (substitui "Assinaturas").
- `/assinaturas` → redirect para `/recorrentes`.

## Entrega em fases

1. Migration SQL (tabela + colunas + RLS + GRANTs + backfill).
2. Regenerar types Supabase; criar `services/despesas-recorrentes.ts` com gerador.
3. `useDespesasRecorrentes` (CRUD + regeneração de futuras).
4. UI (página + dialogs + card).
5. Rotas/sidebar + redirect de Assinaturas.
6. Ajustes em `useCalendarioEventos` e `useAssinaturas` (deprecar, mantendo shim de leitura durante 1 versão).

## Notas técnicas

- Cartão: reusar `calcularMesFaturaCartao` de `src/lib/dateUtils.ts` e criar `parcelas_cartao` de 1x com `mes_referencia` = mês da fatura, `valor` = valor da recorrência.
- Idempotência da geração: chave lógica única `(recorrencia_id, data_prevista)` — verificar antes de inserir para evitar duplicatas se `gerarProximasSeNecessario` rodar múltiplas vezes.
- Edições que aumentam retroativamente o histórico ficam **fora de escopo** (regra do usuário: só futuras).
- Exclusão da recorrência: FK `ON DELETE SET NULL` mantém histórico; só remove futuras pendentes antes do delete.
- Todas as queries filtradas por `user_id` e `deleted_at IS NULL` conforme padrão do projeto.

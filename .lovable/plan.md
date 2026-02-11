

# Historico Detalhado de Metas

## Problema Atual

O historico de movimentacoes das metas e derivado da tabela `transactions` buscando por padroes de descricao ("Deposito na meta: X" / "Retirada da meta: X"). Isso tem limitacoes:
- Nao registra o saldo resultante apos cada operacao
- Nao tem campo de motivo/descricao especifico da movimentacao
- A descricao e generica e fixa

## Solucao

Criar uma tabela dedicada `movimentacoes_meta` para registrar cada operacao com dados completos, e atualizar o historico visual para exibir todas as colunas solicitadas.

## 1. Nova tabela no banco de dados

Criar tabela `movimentacoes_meta` com as colunas:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `meta_id` (uuid, NOT NULL, FK para metas)
- `tipo` (text, NOT NULL - "deposito" ou "retirada")
- `valor` (numeric, NOT NULL)
- `saldo_resultante` (numeric, NOT NULL - saldo da meta apos a operacao)
- `motivo` (text, nullable - descricao/motivo especifico)
- `created_at` (timestamptz, default now())

Politicas RLS: CRUD restrito ao proprio usuario (auth.uid() = user_id).

## 2. Atualizar logica de deposito e retirada

**Arquivo**: `src/hooks/useMetas.ts`

- Na funcao `useAdicionarValorMeta`: apos atualizar a meta e criar a transacao, inserir registro em `movimentacoes_meta` com tipo "deposito", valor, saldo_resultante (novoValor) e motivo.
- Na funcao `useRetirarValorMeta`: idem com tipo "retirada".
- Adicionar campo `motivo` opcional nos parametros de ambas as mutations.

## 3. Atualizar formularios de deposito e retirada

**Arquivo**: `src/components/dashboard/GerenciarMetaDialog.tsx`

- Adicionar campo de texto "Motivo/Descricao" nas tabs de Depositar e Retirar (ex: "Poupanca inicial", "Pagamento cartao credito").
- Passar o motivo para as mutations.

## 4. Atualizar hook de historico

**Arquivo**: `src/hooks/useHistoricoMeta.ts`

- Buscar dados da nova tabela `movimentacoes_meta` em vez da `transactions`.
- Incluir `saldo_resultante` e `motivo` no tipo `MovimentacaoMeta`.
- Manter fallback para transacoes antigas (buscar de `transactions` para movimentacoes anteriores a criacao da tabela).

## 5. Redesenhar componente de historico

**Arquivo**: `src/components/dashboard/HistoricoMetaTab.tsx`

Cada linha do historico exibira:

```text
[Data] [Tipo] [Motivo] [Valor] [Saldo apos]
```

Exemplo visual:
- 20/01 | Deposito | Poupanca inicial | +R$ 5.000,00 | Saldo: R$ 5.000,00
- 22/01 | Retirada | Pagamento cartao | -R$ 1.200,00 | Saldo: R$ 3.800,00

Cores: depositos em verde, retiradas em vermelho (ja implementado, sera mantido).

A ordenacao sera cronologica (mais recente primeiro), agrupada por mes como ja esta hoje.

## Detalhes Tecnicos

- A tabela `movimentacoes_meta` precisa de FK para `metas(id)` com `ON DELETE CASCADE` para limpar automaticamente ao excluir uma meta.
- O `saldo_resultante` e calculado no momento da operacao: para deposito = valorAtualAnterior + valor; para retirada = valorAtualAnterior - valor.
- Movimentacoes antigas (antes da nova tabela) continuarao visiveis via fallback da tabela `transactions`, mas sem saldo_resultante e motivo.
- Invalidar query `historico-meta` nas mutations de deposito e retirada.


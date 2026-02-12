
# Treinar a IA para Entender o Sistema Financeiro

## Problema Atual

A IA tem um entendimento superficial do sistema e pode enviar informacoes erradas porque:

1. **Calculo de saldo errado**: O codigo atual calcula `saldoBancos + receitas - despesas` usando apenas as ultimas 100 transacoes, mas o sistema real usa TODAS as transacoes completed acumuladas
2. **Conceitos financeiros ausentes**: A IA nao conhece Patrimonio Total, Saldo Estimado, Saldo Disponivel, diferenca entre titular e terceiros nos cartoes
3. **Dados incompletos**: Falta informacao sobre responsaveis (quem deve o que), acertos de fatura, movimentacoes de metas/investimentos, categorias de meta que devem ser excluidas
4. **System prompt generico**: Nao explica como o sistema funciona, quais sao as regras de negocio

## O que sera feito

Reescrever a logica de contexto e o system prompt da edge function `ai-chat` para que a IA entenda 100% como o sistema funciona.

## Mudancas Detalhadas

### 1. Corrigir o calculo de saldo (critico)

**Antes (errado):**
```
saldoReal = somaSaldoInicialBancos + receitas100ultimas - despesas100ultimas
```

**Depois (correto, igual ao sistema):**
```
saldoInicial = somaSaldoInicialBancos (ou profile.saldo_inicial se nao tem bancos)
saldoDisponivel = saldoInicial + TODAS receitas completed - TODAS despesas completed
patrimonioTotal = saldoDisponivel + totalMetas + totalInvestimentos
saldoEstimado = saldoDisponivel + aReceber - aPagar - faturaCartaoTitular
```

### 2. Buscar dados completos

Adicionar queries que faltam:
- **Todas transacoes completed** (sem limite de 100) para calculo de saldo correto
- **Responsaveis** ativos para contexto de cartoes (titular vs terceiros)
- **Acertos de fatura** pendentes
- **Movimentacoes de metas** recentes
- **Movimentacoes de investimentos** recentes
- **Categorias de meta** ("Deposito em Meta", "Retirada de Meta") para excluir dos totais exibidos
- **Parcelas do cartao** com filtro por responsavel titular
- **Transacoes pending** do mes (a receber e a pagar)

### 3. Reescrever o system prompt com conhecimento completo

O novo prompt vai ensinar a IA:

- **Estrutura do sistema**: Bancos, Cartoes, Transacoes, Metas, Investimentos, Responsaveis, Orcamentos
- **Regras de calculo**:
  - Saldo Disponivel = saldo_inicial_bancos + receitas_completed - despesas_completed (historico completo)
  - Patrimonio Total = Saldo Disponivel + Metas + Investimentos
  - Saldo Estimado = Saldo Disponivel + A Receber - A Pagar - Fatura Titular
  - Fatura do cartao: separar titular de terceiros
  - Limite usado do cartao = todas parcelas nao pagas (nao apenas do mes)
- **Status de transacoes**: completed = efetivada, pending = pendente/agendada
- **Cartoes**: dia_fechamento, dia_vencimento, parcelas, compras com responsaveis
- **Metas**: depositos e retiradas geram transacoes com categorias especiais que NAO contam como receita/despesa real
- **Responsaveis**: titular (EU) vs terceiros que usam meu cartao e me devem

### 4. Melhorar formatacao do contexto

- Separar claramente "dados do mes atual" vs "dados acumulados"
- Mostrar transacoes pending do mes (a receber/a pagar) com datas
- Mostrar fatura do titular vs total da fatura
- Incluir acertos pendentes por responsavel

## Arquivos modificados

- `supabase/functions/ai-chat/index.ts` - Reescrever queries, calculo de saldo e system prompt

## Detalhes Tecnicos

### Queries adicionais

```sql
-- Todas transacoes completed (para saldo real)
SELECT type, amount FROM transactions WHERE user_id = X AND status = 'completed'

-- Categorias de meta (para excluir dos totais)
SELECT id FROM categories WHERE user_id = X AND name IN ('Deposito em Meta', 'Retirada de Meta')

-- Transacoes pending do mes (a receber/a pagar)
SELECT * FROM transactions WHERE user_id = X AND status = 'pending' AND due_date BETWEEN inicioMes AND fimMes

-- Responsaveis ativos
SELECT * FROM responsaveis WHERE user_id = X AND ativo = true

-- Parcelas com responsavel para separar titular
SELECT parcelas_cartao.*, compras_cartao(responsavel_id, responsavel:responsaveis(nome, is_titular))

-- Acertos pendentes
SELECT * FROM acertos_fatura WHERE user_id = X AND status = 'pendente'

-- Movimentacoes de metas recentes
SELECT * FROM movimentacoes_meta WHERE user_id = X ORDER BY created_at DESC LIMIT 20

-- Movimentacoes de investimentos recentes
SELECT * FROM movimentacoes_investimento WHERE user_id = X ORDER BY data DESC LIMIT 20
```

### Estrutura do novo system prompt

```
Voce e o Fina, assistente financeiro pessoal.

COMO O SISTEMA FUNCIONA:
[explicacao detalhada de cada modulo]

REGRAS DE CALCULO:
[formulas exatas usadas pelo sistema]

CONCEITOS IMPORTANTES:
[titular vs terceiros, status de transacoes, etc]

DADOS DO USUARIO:
[contexto formatado com todos os dados]
```

## Nenhuma mudanca no banco de dados

Usa apenas tabelas e dados existentes.

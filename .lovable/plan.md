
# Corrigir dupla contagem de Acertos de Fatura

## Problema identificado

Ao pagar uma fatura com divisao entre responsaveis, o sistema cria:
1. Uma despesa "Fatura de Cartao" com o valor total pago ao banco
2. Despesas adicionais "Acerto de Fatura" para cada responsavel nao-titular

Isso causa dupla contagem. Exemplo real do usuario:
- Fatura Nubank: -R$ 726,64 (pago ao banco)
- Acerto Nubank Mae: -R$ 433,51 (parte da Mae, tambem como despesa)
- Total contabilizado: R$ 1.160,15, mas so saiu R$ 726,64 do bolso

Alem disso, quando o responsavel paga de volta (RegistrarAcertoDialog), nenhuma transacao de receita e criada - apenas o registro na tabela acertos_fatura e atualizado.

## Solucao

### 1. Parar de criar transacoes de despesa "Acerto de Fatura" ao pagar fatura

**Arquivo**: `src/services/compras-cartao.ts` (linhas 901-956)

Remover o bloco que cria transacoes de despesa para cada acerto recebido. Os acertos ja sao rastreados pela tabela `acertos_fatura` (linhas 959+), que e o local correto para esse controle.

O bloco a ser removido comeca em "// 2.5. Criar transacoes de despesa para cada acerto recebido" e vai ate o fechamento do for loop na linha 956.

### 2. Criar transacao de receita quando o responsavel pagar

**Arquivo**: `src/components/cartoes/RegistrarAcertoDialog.tsx`

No `handleSalvar`, apos registrar o pagamento na tabela acertos_fatura, criar uma transacao de receita:
- type: "income"
- amount: valor recebido
- description: "Pagamento cartao (Nome) - mes/ano"
- category: buscar ou criar categoria "Acerto de Fatura" como tipo "income"
- status: "completed"

Tambem invalidar as queries de transacoes para atualizar os cards.

### 3. Limpar transacoes duplicadas existentes

As transacoes de "Acerto de Fatura" ja criadas (R$ 80 + R$ 182,49 + R$ 433,51 = R$ 696) precisam ser removidas manualmente pelo usuario ou por um script. Posso criar uma acao que:
- Busca todas as transacoes com categoria "Acerto de Fatura" do tipo "expense"
- Remove-as
- Cria transacoes de receita equivalentes para os acertos que ja foram quitados na tabela acertos_fatura

### Resultado esperado

- Receitas de fevereiro: R$ 2.216 + acertos recebidos (quando Mae pagar)
- Despesas de fevereiro: ~R$ 2.885 (sem os R$ 696 de acertos fantasma)
- Saldo Real: nao sera afetado (remove despesas E receitas correspondentes)
- Fluxo correto: pagar fatura registra despesa real -> quando responsavel paga, registra receita

### Detalhes tecnicos

Alteracoes em `src/services/compras-cartao.ts`:
- Remover linhas 901-956 (criacao de transacoes expense para acertos)
- Manter linhas 959+ (registro na tabela acertos_fatura)

Alteracoes em `src/components/cartoes/RegistrarAcertoDialog.tsx`:
- Importar supabase client
- No handleSalvar, apos registrarPagamento(), buscar/criar categoria "Acerto de Fatura" tipo "income"
- Inserir transacao de receita com o valor recebido
- Invalidar queryKeys de transacoes

Limpeza de dados:
- Executar query para remover transacoes expense com categoria "Acerto de Fatura"
- Para acertos ja quitados, criar transacoes income correspondentes

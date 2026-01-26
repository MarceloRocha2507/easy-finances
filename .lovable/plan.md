
## Plano: Implementar Saldo Disponível Correto nas Transações

### Análise do Problema

Comparando as duas lógicas de cálculo no sistema:

#### Dashboard (`useCompleteStats` - linha 715):
```
Saldo Base = saldoInicial + receitas - despesas
Saldo Disponível = Saldo Base - investimentos - metas
```
✅ Mostra: **R$ 11,59** (saldo disponível atual)

#### Lista de Transações (`useTransactionsWithBalance` - linha 571):
```
Saldo = saldoInicial + receitas - despesas
```
✅ Mostra: **R$ 1.180,89** (patrimônio total)

### O Desafio Conceitual

O usuário quer ver o "saldo disponível" (descontando metas/investimentos) em cada transação histórica. Porém, há um **problema cronológico**:

**Cenário real:**
- **Hoje**: Você tem R$ 1.169,30 em metas
- **Há 3 meses**: Você tinha R$ 0,00 em metas

**Se descontarmos o valor atual de todas as transações:**
```
Transação de 3 meses atrás:
  Patrimônio: R$ 105,44
  Saldo exibido: R$ 105,44 - R$ 1.169,30 = -R$ 1.063,86 ❌ (NEGATIVO!)
  
Transação de hoje:
  Patrimônio: R$ 1.180,89
  Saldo exibido: R$ 1.180,89 - R$ 1.169,30 = R$ 11,59 ✓
```

**Por que está errado:**
As metas de hoje **não existiam no passado**. Subtrair esse valor de transações antigas cria saldos negativos incorretos e cronologicamente impossíveis.

---

## Soluções Propostas

### Opção 1: Saldo Disponível APENAS na Última Transação ⭐ (RECOMENDADA)

Mostrar o patrimônio progressivo em todas as transações, mas na **mais recente** exibir o saldo disponível real.

**Como funcionaria:**
```
🏪 Compra 1 (há 3 meses)    -R$ 100,00    Saldo: R$ 105,44 (patrimônio)
💰 Receita (há 2 meses)     +R$ 500,00    Saldo: R$ 605,44 (patrimônio)
🏪 Compra 2 (há 1 mês)      -R$ 50,00     Saldo: R$ 555,44 (patrimônio)
...
🏪 Compra 28 (hoje)         -R$ 30,00     Saldo: R$ 11,59 (disponível) ⭐
                                          Guardado: R$ 1.169,30 em metas
```

**Vantagens:**
- ✅ Cronologicamente correto
- ✅ Mostra o saldo disponível atual na última transação
- ✅ Simples de implementar
- ✅ Não requer histórico de metas

**Implementação:**
```typescript
// Calcular patrimônio progressivo
let saldo = saldoInicial;
const saldoMap = new Map<string, number>();

for (const t of allCompleted || []) {
  saldo += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
  saldoMap.set(t.id, saldo); // Armazena patrimônio bruto
}

// Buscar total guardado (metas + investimentos)
const { data: metas } = await supabase
  .from('metas')
  .select('valor_atual')
  .eq('user_id', user!.id)
  .eq('concluida', false);

const totalMetas = (metas || []).reduce(
  (sum, meta) => sum + Number(meta.valor_atual), 0
);

const { data: investimentos } = await supabase
  .from('investimentos')
  .select('valor_atual')
  .eq('user_id', user!.id)
  .eq('ativo', true);

const totalInvestido = (investimentos || []).reduce(
  (sum, inv) => sum + Number(inv.valor_atual), 0
);

const totalGuardado = totalMetas + totalInvestido;

// Ajustar APENAS a última transação para mostrar saldo disponível
if (allCompleted && allCompleted.length > 0) {
  const ultimaTransacao = allCompleted[allCompleted.length - 1];
  const saldoAtual = saldoMap.get(ultimaTransacao.id) || 0;
  saldoMap.set(ultimaTransacao.id, saldoAtual - totalGuardado);
}
```

**UI atualizada:**
- Adicionar badge "Disponível" na última transação
- Mostrar tooltip: "Este é seu saldo disponível após descontar R$ X,XX em metas e investimentos"

---

### Opção 2: Mostrar Patrimônio + Indicador Visual

Manter todas as transações mostrando patrimônio, mas adicionar um indicador visual ao lado informando o quanto está guardado.

**Como funcionaria:**
```
🏪 Compra 28 (hoje)         -R$ 30,00     Saldo: R$ 1.180,89
                                          💰 Guardado: R$ 1.169,30
                                          💵 Disponível: R$ 11,59
```

**Vantagens:**
- ✅ Cronologicamente correto
- ✅ Transparente sobre a composição do saldo
- ✅ Mostra ambos os valores

**Implementação:**
- Não alterar lógica de cálculo
- Adicionar componente visual que mostra a decomposição do saldo

---

### Opção 3: Histórico de Metas (NÃO RECOMENDADO)

Criar uma tabela de histórico para saber quanto estava guardado em cada data.

**Por que não:**
- ❌ Muito complexo
- ❌ Requer migração de dados históricos
- ❌ Difícil manutenção
- ❌ Não resolve retroativamente

---

## Recomendação Final

Implementar **Opção 1** com ajustes visuais da **Opção 2**:

1. **Todas as transações antigas**: Mostram patrimônio progressivo
2. **Última transação**: Mostra saldo disponível (descontando metas)
3. **Adicionar badge/tooltip**: Explicando a diferença

**Mudanças técnicas:**

### Arquivo: `src/hooks/useTransactions.ts` (linhas 554-572)

**Adicionar busca de metas e investimentos + ajuste da última transação:**

```typescript
// Buscar TODAS as transações completed para calcular saldo progressivo
const { data: allCompleted, error: allError } = await supabase
  .from('transactions')
  .select('id, type, amount, status, created_at')
  .eq('user_id', user!.id)
  .eq('status', 'completed')
  .order('created_at', { ascending: true });

if (allError) throw allError;

// Buscar total guardado em metas
const { data: metas } = await supabase
  .from('metas')
  .select('valor_atual')
  .eq('user_id', user!.id)
  .eq('concluida', false);

const totalMetas = (metas || []).reduce(
  (sum, meta) => sum + Number(meta.valor_atual), 0
);

// Buscar total guardado em investimentos
const { data: investimentos } = await supabase
  .from('investimentos')
  .select('valor_atual')
  .eq('user_id', user!.id)
  .eq('ativo', true);

const totalInvestido = (investimentos || []).reduce(
  (sum, inv) => sum + Number(inv.valor_atual), 0
);

const totalGuardado = totalMetas + totalInvestido;

// Calcular saldo progressivo (patrimônio bruto)
let saldo = saldoInicial;
const saldoMap = new Map<string, number>();

for (const t of allCompleted || []) {
  saldo += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
  // Armazenar patrimônio total
  saldoMap.set(t.id, saldo);
}

// Ajustar APENAS a última transação para mostrar saldo disponível
if (allCompleted && allCompleted.length > 0) {
  const ultimaTransacaoId = allCompleted[allCompleted.length - 1].id;
  const patrimonioAtual = saldoMap.get(ultimaTransacaoId) || 0;
  saldoMap.set(ultimaTransacaoId, patrimonioAtual - totalGuardado);
}

// Retornar também o totalGuardado para usar na UI
return {
  transactions: data as Transaction[],
  saldoMap,
  totalGuardado, // NOVO
  ultimaTransacaoId: allCompleted?.[allCompleted.length - 1]?.id, // NOVO
};
```

### Arquivo: `src/pages/Transactions.tsx` (componente que exibe a lista)

**Adicionar badge/tooltip na última transação:**

```tsx
{transaction.id === ultimaTransacaoId && totalGuardado > 0 && (
  <div className="text-xs text-muted-foreground mt-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className="text-xs">
            Disponível
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Patrimônio: {formatCurrency(saldoMap.get(transaction.id)! + totalGuardado)}
          </p>
          <p className="text-xs text-muted-foreground">
            Guardado: {formatCurrency(totalGuardado)}
          </p>
          <p className="text-xs font-semibold">
            Disponível: {formatCurrency(saldoMap.get(transaction.id)!)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
)}
```

---

## Comportamento Esperado

| Transação | Saldo Exibido | Tipo | Observação |
|-----------|---------------|------|------------|
| 1ª (antiga) | R$ 105,44 | Patrimônio | Cronologicamente correto |
| 2ª | R$ 605,44 | Patrimônio | Progressivo |
| ... | ... | ... | ... |
| 28ª (última) | R$ 11,59 | **Disponível** | Desconta metas atuais ⭐ |

**Visual na última transação:**
```
🏪 Supermercado                     -R$ 30,00
   Alimentação • Hoje, 14:30        Saldo: R$ 11,59 [Disponível]
```

Com tooltip mostrando:
```
💰 Patrimônio: R$ 1.180,89
📊 Guardado: R$ 1.169,30
💵 Disponível: R$ 11,59
```

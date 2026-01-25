
## Plano: Corrigir Lógica do Saldo por Transação

### Problema Identificado

O cálculo do saldo está **conceitualmente incorreto**. O código atual subtrai o valor total das metas atuais (R$ 1.169,30) de **cada transação histórica**, resultando em valores sem sentido cronológico.

#### Exemplo do problema:

**Cenário:**
- Você tem 28 transações ao longo do tempo
- Hoje você tem R$ 1.169,30 em metas

**O que acontece no código atual (linhas 590-596 do useTransactions.ts):**
```
Transação 1 (há 3 meses): Receita de R$ 100
- Saldo bruto: R$ 105,44
- Saldo exibido: R$ 105,44 - R$ 1.169,30 = -R$ 1.063,86 ❌ (negativo!)

Transação 28 (hoje): Despesa de R$ 50
- Saldo bruto: R$ 1.180,89
- Saldo exibido: R$ 1.180,89 - R$ 1.169,30 = R$ 11,59 ✓
```

**Por que está errado:**
As metas de R$ 1.169,30 **não existiam há 3 meses**! Subtrair esse valor de transações antigas é anacrónico e gera saldos negativos incorretos.

---

## Solução Proposta

**Mostrar o Saldo Bruto (Patrimônio Total)** após cada transação, sem descontar metas/investimentos.

### Por quê?
1. **Cronologicamente correto**: Mostra exatamente quanto você tinha após cada transação
2. **Simples de calcular**: `saldo_inicial + receitas - despesas` até aquele ponto
3. **Sem dependência de dados atuais**: Não precisa de informação sobre metas que não existiam naquele momento

### O que muda na tela?
Cada transação mostrará:
```
📦 Supermercado                     -R$ 150,00
   Alimentação • Hoje, 14:30        Saldo: R$ 1.180,89
```

**Nota**: Este saldo representa o patrimônio total após a transação. Para ver o saldo disponível (descontando metas/investimentos), consulte o Dashboard.

---

## Mudanças Técnicas

### Arquivo: `src/hooks/useTransactions.ts`

**Remover** as linhas 554-577 (busca de metas e investimentos) e **modificar** as linhas 590-596:

**Código Atual (ERRADO):**
```typescript
// Buscar total de metas não concluídas
const { data: metas } = await supabase
  .from('metas')
  .select('valor_atual')
  .eq('user_id', user!.id)
  .eq('concluida', false);

const totalMetas = (metas || []).reduce(
  (sum, meta) => sum + Number(meta.valor_atual), 0
);

// Buscar total de investimentos ativos
const { data: investimentos } = await supabase
  .from('investimentos')
  .select('valor_atual')
  .eq('user_id', user!.id)
  .eq('ativo', true);

const totalInvestido = (investimentos || []).reduce(
  (sum, inv) => sum + Number(inv.valor_atual), 0
);

// Total guardado = Metas + Investimentos
const totalGuardado = totalMetas + totalInvestido;

// Calcular saldo progressivo (descontando metas e investimentos)
let saldo = saldoInicial;
const saldoMap = new Map<string, number>();

for (const t of allCompleted || []) {
  saldo += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
  // Saldo disponível = saldo total - total guardado
  saldoMap.set(t.id, saldo - totalGuardado); // ❌ ERRO: subtrai valor atual de transação antiga
}
```

**Código Corrigido:**
```typescript
// Calcular saldo progressivo (patrimônio bruto)
let saldo = saldoInicial;
const saldoMap = new Map<string, number>();

for (const t of allCompleted || []) {
  saldo += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
  // Armazenar o patrimônio total após cada transação
  saldoMap.set(t.id, saldo);
}
```

**Resultado esperado:**
- Primeira transação: Saldo correto e positivo
- Última transação: Saldo = R$ 1.180,89 (patrimônio bruto)
- Valores cronologicamente consistentes

---

## Alternativa (se preferir mostrar saldo disponível)

Se você realmente quiser ver o "saldo disponível" nas transações, podemos:

1. **Adicionar uma coluna explicativa** na UI informando que o valor é o patrimônio bruto
2. **Criar um tooltip** que explica: "Este é seu patrimônio total. Para o saldo disponível (descontando metas), veja o Dashboard"
3. **Adicionar um histórico de metas** no banco (muito mais complexo) para saber quanto estava guardado em cada momento

---

## Comportamento Esperado

| Antes (errado) | Depois (correto) |
|----------------|------------------|
| Transações antigas com saldo negativo | Todas mostram saldo positivo progressivo |
| Última transação: R$ 11,59 (disponível) | Última transação: R$ 1.180,89 (patrimônio) |
| Inconsistência cronológica | Cronologicamente correto |

**Para ver o saldo disponível (R$ 11,59):** Consulte o Dashboard, que calcula `patrimônio - metas - investimentos`.

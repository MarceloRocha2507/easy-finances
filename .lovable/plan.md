
# Plano: Depósito em Meta Reduz Saldo Disponível (Implementado ✅)

## Status: CONCLUÍDO

Quando o usuário depositar valor em uma meta, esse valor deve ser **subtraído do saldo disponível**. Isso significa criar uma **despesa interna** que representa a transferência do dinheiro livre para a meta.

## Nova Lógica

```text
ANTES (depósito isolado):
┌─────────────────────────────────────────────┐
│ Depósito em Meta = apenas aumenta a meta   │
│ Saldo Disponível = não muda                │
└─────────────────────────────────────────────┘

DEPOIS (depósito com transferência):
┌─────────────────────────────────────────────┐
│ Depósito em Meta = aumenta a meta          │
│ + Cria despesa interna = reduz disponível  │
│ Patrimônio Total = permanece o mesmo       │
└─────────────────────────────────────────────┘
```

**Exemplo prático:**
- Saldo Disponível: R$ 96,00
- Depositar R$ 50,00 na meta
- Resultado:
  - Saldo Disponível: R$ 46,00 (-50)
  - Meta: +R$ 50,00
  - Patrimônio Total: mesmo (apenas moveu dinheiro)

## Abordagem

Criar uma **categoria especial** "Transferência para Metas" e registrar uma transação de despesa automática quando o usuário deposita em uma meta.

### Fluxo do Depósito

1. Usuário clica em "Depositar R$ 50"
2. Sistema verifica se há saldo disponível suficiente
3. Se sim:
   - Aumenta `valor_atual` da meta
   - Cria transação de despesa do tipo "Transferência para Metas"
4. Se não: mostra erro "Saldo insuficiente"

### Fluxo da Retirada

1. Usuário clica em "Retirar R$ 50"
2. Sistema verifica se há valor suficiente na meta
3. Se sim:
   - Reduz `valor_atual` da meta
   - Cria transação de receita do tipo "Retirada de Metas"
4. O dinheiro volta para o saldo disponível

## Alterações Necessárias

### 1. Banco de Dados

Criar categoria especial para transferências de metas (se não existir):
- Nome: "Transferência para Metas"
- Tipo: expense
- Ícone: piggy-bank
- Sistema: true (não pode ser excluída)

### 2. Hook `useMetas.ts` - Função `useAdicionarValorMeta`

Modificar para:
1. Verificar saldo disponível antes de permitir depósito
2. Criar transação de despesa automática
3. Atualizar valor da meta

```typescript
mutationFn: async (data: { 
  id: string; 
  valor: number; 
  valorAtualAnterior: number; 
  valorAlvo: number;
  saldoDisponivel: number; // novo parâmetro
}) => {
  // Validar saldo
  if (data.valor > data.saldoDisponivel) {
    throw new Error("Saldo insuficiente para este depósito");
  }

  // 1. Atualizar meta
  await supabase.from("metas").update({...});

  // 2. Criar transação de despesa
  await supabase.from("transactions").insert({
    type: "expense",
    amount: data.valor,
    description: `Depósito na meta: ${meta.titulo}`,
    category_id: "categoria-transferencia-metas",
    status: "completed",
    date: today,
  });
}
```

### 3. Hook `useMetas.ts` - Ajustar Retirada

Quando retirar valor da meta, criar transação de **receita**:

```typescript
// Retirada = dinheiro volta para disponível
await supabase.from("transactions").insert({
  type: "income",
  amount: data.valor,
  description: `Retirada da meta: ${meta.titulo}`,
  category_id: "categoria-retirada-metas",
  status: "completed",
  date: today,
});
```

### 4. UI `GerenciarMetaDialog.tsx`

- Passar `saldoDisponivel` para validação
- Mostrar saldo disponível no campo de depósito
- Desabilitar botão se valor > saldo
- Mostrar mensagem de erro clara

### 5. Ajustar `useCompleteStats`

Não contar categorias especiais de metas no cálculo do saldo (ou deixar contar, já que o fluxo está correto).

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| BD: `categories` | Criar categoria "Transferência para Metas" |
| `src/hooks/useMetas.ts` | Criar transação ao depositar/retirar |
| `src/components/dashboard/GerenciarMetaDialog.tsx` | Validar saldo, mostrar disponível |
| `src/components/dashboard/MetasEconomia.tsx` | Passar saldoDisponivel para o dialog |

## Detalhes Técnicos

### Categoria de Sistema

```sql
INSERT INTO categories (user_id, name, type, icon, color, is_system)
VALUES (NULL, 'Depósito em Meta', 'expense', 'piggy-bank', '#6366f1', true);

INSERT INTO categories (user_id, name, type, icon, color, is_system)
VALUES (NULL, 'Retirada de Meta', 'income', 'piggy-bank', '#22c55e', true);
```

**Nota:** Precisamos verificar se a tabela `categories` suporta `is_system` ou `user_id = NULL`.

### Alternativa: Categoria por Usuário

Se não for possível criar categoria de sistema, criar automaticamente para cada usuário na primeira transferência.

### Validação no Dialog

```tsx
// Em GerenciarMetaDialog.tsx
const saldoDisponivel = completeStats?.saldoDisponivel ?? 0;

<Input
  type="number"
  max={saldoDisponivel} // limitar ao disponível
  value={valorDeposito}
  onChange={(e) => setValorDeposito(e.target.value)}
/>
<p className="text-xs text-muted-foreground">
  Saldo disponível: {formatCurrency(saldoDisponivel)}
</p>

<Button
  disabled={
    parseFloat(valorDeposito) > saldoDisponivel ||
    parseFloat(valorDeposito) <= 0
  }
>
```

## Resultado Esperado

| Ação | Saldo Disponível | Em Metas | Patrimônio |
|------|------------------|----------|------------|
| Inicial | R$ 96,00 | R$ 1.169,30 | R$ 1.265,30 |
| Depositar R$ 50 | R$ 46,00 | R$ 1.219,30 | R$ 1.265,30 |
| Retirar R$ 20 | R$ 66,00 | R$ 1.199,30 | R$ 1.265,30 |

O patrimônio total permanece o mesmo porque é apenas uma **movimentação interna** entre saldo disponível e metas.

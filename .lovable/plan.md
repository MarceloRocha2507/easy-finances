

## Plano: Bancos como Contas com Saldo Real

### Entendimento da Solicitação

Você quer que os **Bancos** funcionem como **contas bancárias completas**, onde:
1. Cada banco tem seu **próprio saldo** (não apenas agrupa cartões)
2. A **soma dos saldos de todos os bancos** = **Saldo Real** do sistema
3. Transações podem ser vinculadas a bancos específicos
4. O ajuste de saldo passa a ser **por banco**, não global

---

## Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────┐
│                    SALDO REAL CONSOLIDADO                    │
│    = Saldo Nubank + Saldo Inter + Saldo Itaú + ...          │
├─────────────────────────────────────────────────────────────┤
│  Banco Nubank          │  Banco Inter          │  Banco Itaú │
│  Saldo: R$ 2.500       │  Saldo: R$ 1.800      │  Saldo: R$  │
│  3 cartões             │  2 cartões            │  1 cartão   │
│  Conta: Corrente       │  Conta: Corrente      │  Conta:     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Mudanças no Banco de Dados

### 1.1 Adicionar Colunas à Tabela `bancos`

| Coluna | Tipo | Padrão | Descrição |
|--------|------|--------|-----------|
| saldo_inicial | numeric | 0 | Saldo base da conta |
| tipo_conta | text | 'corrente' | Tipo: corrente, poupança, digital |
| agencia | text | NULL | Número da agência |
| conta | text | NULL | Número da conta |

### 1.2 Migração do Saldo Global

O sistema atualmente usa `profiles.saldo_inicial` como saldo único. A migração irá:
1. Criar um banco padrão "Conta Principal" para usuários existentes
2. Transferir o `saldo_inicial` do `profiles` para esse banco
3. Manter compatibilidade retroativa

### 1.3 Vincular Transações a Bancos

Adicionar coluna opcional na tabela `transactions`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| banco_id | uuid (FK) | Banco relacionado à transação |

---

## 2. Novo Fluxo de Cálculo do Saldo

### Fórmula Atual
```text
Saldo Real = profiles.saldo_inicial + Receitas - Despesas
```

### Nova Fórmula
```text
Saldo Real = Σ (banco.saldo_inicial) + Receitas - Despesas
```

Ou, para visualização por banco:
```text
Saldo do Banco X = banco.saldo_inicial + Receitas(banco_id=X) - Despesas(banco_id=X)
```

---

## 3. Alterações nos Componentes

### 3.1 Página de Bancos (Atualizar)

**Campos adicionais no formulário:**
- Saldo inicial da conta
- Tipo de conta (Corrente, Poupança, Digital, Investimento)
- Agência e Conta (opcionais)

**Card do Banco:**
```text
┌─────────────────────────────────────────┐
│ 🟣 Nubank                               │
│ Conta Digital                           │
├─────────────────────────────────────────┤
│ Saldo Atual        R$ 2.543,00          │
│ (inicial + transações)                  │
├─────────────────────────────────────────┤
│ Cartões vinculados: 2                   │
│ Limite disponível: R$ 5.000             │
│ [Ajustar Saldo] [Editar] [Excluir]      │
└─────────────────────────────────────────┘
```

### 3.2 Dialog de Ajustar Saldo (Por Banco)

Mover a lógica atual do `AjustarSaldoDialog` para funcionar **por banco**:
- Selecionar o banco
- Informar o saldo do extrato
- Sistema recalcula o `saldo_inicial` daquele banco

### 3.3 Dashboard - Saldo por Banco

Novo componente exibindo:
```text
┌─────────────────────────────────────────┐
│ 💰 Saldo por Conta                      │
├─────────────────────────────────────────┤
│ Nubank (Digital)       R$ 2.543,00      │
│ Inter (Corrente)       R$ 1.200,00      │
│ Itaú (Poupança)        R$ 5.000,00      │
├─────────────────────────────────────────┤
│ SALDO TOTAL            R$ 8.743,00      │
└─────────────────────────────────────────┘
```

### 3.4 Transações (Opcional)

Adicionar campo "Conta/Banco" no cadastro de transações:
- Dropdown com bancos cadastrados
- Permite rastrear de qual conta saiu/entrou o dinheiro

---

## 4. Arquivos a Modificar/Criar

### Migração SQL
```text
supabase/migrations/[timestamp]_add_saldo_to_bancos.sql
- ALTER TABLE bancos ADD COLUMN saldo_inicial
- ALTER TABLE bancos ADD COLUMN tipo_conta
- ALTER TABLE bancos ADD COLUMN agencia
- ALTER TABLE bancos ADD COLUMN conta
- Trigger para atualizar updated_at
```

### Services
```text
src/services/bancos.ts
- Atualizar tipos (Banco, BancoComResumo)
- Nova função: calcularSaldoBanco()
- Nova função: ajustarSaldoBanco()
```

### Hooks
```text
src/hooks/useTransactions.ts
- Modificar useCompleteStats para somar saldo_inicial de todos os bancos
- Novo hook: useSaldoPorBanco()
```

### Componentes
```text
src/components/bancos/
├── NovoBancoDialog.tsx      (atualizar com novos campos)
├── EditarBancoDialog.tsx    (atualizar com novos campos)
├── BancoCard.tsx            (exibir saldo calculado)
└── AjustarSaldoBancoDialog.tsx (NOVO - ajuste por banco)

src/components/dashboard/
└── SaldoPorBanco.tsx        (exibir consolidado no Dashboard)
```

### Páginas
```text
src/pages/Bancos.tsx         (atualizar layout e funcionalidades)
```

---

## 5. Migração de Dados Existentes

Para usuários que já têm `profiles.saldo_inicial`:

```sql
-- Criar banco padrão para usuários existentes
INSERT INTO bancos (user_id, nome, saldo_inicial, cor)
SELECT 
  user_id, 
  'Conta Principal', 
  saldo_inicial,
  '#6366f1'
FROM profiles
WHERE saldo_inicial != 0
AND NOT EXISTS (
  SELECT 1 FROM bancos WHERE bancos.user_id = profiles.user_id
);
```

---

## 6. Ordem de Implementação

```text
Fase 1: Banco de Dados
├── 1.1 Migração: adicionar colunas em bancos
├── 1.2 Migração: vincular transações (opcional)
└── 1.3 Migrar saldo_inicial existente para banco padrão

Fase 2: Backend/Services
├── 2.1 Atualizar tipos em bancos.ts
├── 2.2 Funções de cálculo de saldo por banco
└── 2.3 Atualizar useCompleteStats (somar todos os bancos)

Fase 3: UI - Bancos
├── 3.1 Atualizar NovoBancoDialog (novos campos)
├── 3.2 Atualizar EditarBancoDialog (novos campos)
├── 3.3 Atualizar BancoCard (exibir saldo)
├── 3.4 Criar AjustarSaldoBancoDialog
└── 3.5 Atualizar página Bancos.tsx

Fase 4: Dashboard
├── 4.1 Criar/Atualizar SaldoPorBanco
└── 4.2 Integrar no Dashboard principal

Fase 5: Transações (Opcional)
├── 5.1 Adicionar campo banco_id
├── 5.2 BancoSelector no formulário de transação
└── 5.3 Filtros por banco
```

---

## 7. Detalhes Técnicos

### SQL de Migração

```sql
-- Adicionar colunas para saldo e tipo de conta
ALTER TABLE public.bancos 
ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_conta TEXT DEFAULT 'corrente',
ADD COLUMN IF NOT EXISTS agencia TEXT,
ADD COLUMN IF NOT EXISTS conta TEXT;

-- Migrar saldo existente do profiles para um banco padrão
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT user_id, saldo_inicial 
    FROM profiles 
    WHERE saldo_inicial != 0
  LOOP
    -- Verificar se usuário já tem banco
    IF NOT EXISTS (SELECT 1 FROM bancos WHERE user_id = profile_record.user_id) THEN
      INSERT INTO bancos (user_id, nome, saldo_inicial, cor, tipo_conta)
      VALUES (
        profile_record.user_id,
        'Conta Principal',
        profile_record.saldo_inicial,
        '#6366f1',
        'digital'
      );
    END IF;
  END LOOP;
END $$;
```

### Cálculo Consolidado (TypeScript)

```typescript
// Em useCompleteStats ou hook dedicado
async function calcularSaldoConsolidado() {
  // Buscar soma de saldo_inicial de todos os bancos
  const { data: bancos } = await supabase
    .from('bancos')
    .select('saldo_inicial')
    .eq('user_id', userId)
    .eq('ativo', true);
  
  const saldoInicialTotal = bancos?.reduce(
    (acc, b) => acc + Number(b.saldo_inicial || 0), 
    0
  ) || 0;
  
  // Saldo Real = soma dos saldos iniciais + receitas - despesas
  const saldoReal = saldoInicialTotal + completedIncome - completedExpense;
  
  return saldoReal;
}
```

---

## 8. Resultado Esperado

### Página de Bancos
```text
┌─────────────────────────────────────────────────────────────┐
│  Bancos                                    [+ Nova Conta]    │
│  Gerencie suas contas bancárias                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  │ 🟣 Nubank       │  │ 🟠 Inter        │  │ 🔵 Itaú         │
│  │ Conta Digital   │  │ Conta Corrente  │  │ Poupança        │
│  │ R$ 2.543,00     │  │ R$ 1.200,00     │  │ R$ 5.000,00     │
│  │ 2 cartões       │  │ 1 cartão        │  │ 0 cartões       │
│  │ [Ajustar] [···] │  │ [Ajustar] [···] │  │ [Ajustar] [···] │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘
├─────────────────────────────────────────────────────────────┤
│  SALDO TOTAL CONSOLIDADO                   R$ 8.743,00       │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard
```text
┌─────────────────────────────────────────┐
│ Saldo Disponível                        │
│ R$ 8.743,00                             │
│ ────────────────────────                │
│ Nubank:     R$ 2.543,00                 │
│ Inter:      R$ 1.200,00                 │
│ Itaú:       R$ 5.000,00                 │
│ [Ver todas as contas]                   │
└─────────────────────────────────────────┘
```

---

## 9. Considerações

### Compatibilidade
- Usuários existentes terão seus dados migrados automaticamente
- O `profiles.saldo_inicial` pode ser mantido como fallback ou zerado após migração

### Cartões sem Banco
- Cartões podem continuar sem banco vinculado (opcional)
- Cartões não afetam o saldo da conta, apenas mostram limite/fatura

### Transações sem Banco
- Transações existentes continuarão funcionando
- Novo campo `banco_id` é opcional
- Se não informado, a transação afeta o "saldo geral"


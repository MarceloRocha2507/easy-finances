
# Plano: Adicionar Campo "Saldo Inicial Guardado" no Perfil

## Objetivo

Criar um campo nas preferências do usuário para registrar dinheiro que **já estava guardado antes de usar o sistema**. Isso permite regularizar metas existentes sem precisar criar receitas retroativas.

## Como Vai Funcionar

| Situação | Atual | Novo |
|----------|-------|------|
| Patrimônio calculado | Saldo Inicial + Receitas - Despesas | Saldo Inicial + **Saldo Inicial Guardado** + Receitas - Despesas |
| Seu caso | R$ 96,00 (não considera os R$ 1.265 guardados antes) | R$ 1.361,30 (96 + 1.265,30) |
| Saldo Disponível | R$ 0,00 (patrimônio menor que metas) | R$ 96,00 (1.361,30 - 1.265,30) |

## Alterações Necessárias

### 1. Banco de Dados
Adicionar coluna `saldo_inicial_guardado` na tabela `profiles` com valor padrão 0.

### 2. Interface - Tab Preferências
Adicionar campo no `PreferenciasTab.tsx` para o usuário informar quanto já tinha guardado em metas antes de usar o sistema.

### 3. Hook de Saldo
Atualizar `useSaldoInicial.ts` para buscar e salvar o novo campo.

### 4. Cálculo do Patrimônio
Atualizar `useTransactions.ts` para incluir o "saldo inicial guardado" no cálculo do patrimônio.

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `profiles` (banco) | Nova coluna `saldo_inicial_guardado` |
| `src/hooks/useSaldoInicial.ts` | Buscar e atualizar novo campo |
| `src/components/profile/PreferenciasTab.tsx` | Campo de input para saldo guardado |
| `src/hooks/useTransactions.ts` | Incluir no cálculo do patrimônio |

## Detalhes Técnicos

### Migration SQL

```sql
ALTER TABLE profiles 
ADD COLUMN saldo_inicial_guardado numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.saldo_inicial_guardado IS 
'Valor que o usuário já tinha guardado em metas antes de usar o sistema';
```

### Hook `useSaldoInicial.ts`

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['saldo-inicial', user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('profiles')
      .select('saldo_inicial, saldo_inicial_guardado')
      .eq('user_id', user!.id)
      .single();
    
    return {
      saldoInicial: Number(data?.saldo_inicial) || 0,
      saldoInicialGuardado: Number(data?.saldo_inicial_guardado) || 0,
    };
  },
});
```

### Cálculo em `useTransactions.ts`

```typescript
// Buscar saldo inicial guardado junto com saldo inicial
const { data: profile } = await supabase
  .from('profiles')
  .select('saldo_inicial, saldo_inicial_guardado')
  .eq('user_id', user!.id)
  .single();

const saldoInicialGuardado = Number(profile?.saldo_inicial_guardado) || 0;

// Patrimônio = Saldo Inicial + Saldo Guardado Anterior + Receitas - Despesas
const saldoBase = saldoInicial + saldoInicialGuardado + stats.completedIncome - stats.completedExpense;
```

### Interface `PreferenciasTab.tsx`

Adicionar seção "Saldos Iniciais" com:
- Saldo Inicial (já existe, pode adicionar aqui também)
- Saldo Inicial Guardado (novo campo)
- Descrição explicando o uso

## Resultado Esperado

Ao preencher R$ 1.265,30 no campo "Saldo inicial guardado":

| Campo | Antes | Depois |
|-------|-------|--------|
| Patrimônio | R$ 96,00 | R$ 1.361,30 |
| Em Metas | R$ 1.265,30 | R$ 1.265,30 |
| Saldo Disponível | R$ 0,00 | R$ 96,00 |

O sistema passa a reconhecer que você já tinha esse dinheiro guardado antes de começar a usar o app.

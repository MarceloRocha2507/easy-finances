
# Plano: Corrigir Exibição do Saldo na Página de Transações

## Diagnóstico

A implementação do campo "Saldo Inicial Guardado" está **funcionalmente correta**. O cálculo em `useCompleteStats` já inclui:

```typescript
const saldoBase = saldoInicial + saldoInicialGuardado + stats.completedIncome - stats.completedExpense;
```

### Por que os valores ainda mostram R$ 96,00?

**O campo `saldo_inicial_guardado` está zerado no banco:**

| user_id | saldo_inicial | saldo_inicial_guardado |
|---------|---------------|------------------------|
| seu_id  | -1175.45      | **0** |

Você ainda não preencheu o valor R$ 1.265,30 no campo "Saldo Inicial Guardado" em Preferências.

## Ação Imediata (sem código)

1. Acesse **Perfil > Preferências**
2. Preencha **R$ 1.265,30** no campo "Saldo Inicial Guardado (em metas)"
3. Clique em **Salvar**

Após isso, os valores serão recalculados automaticamente:

| Campo | Antes | Depois |
|-------|-------|--------|
| Saldo Real | R$ 96,00 | R$ 1.361,30 |
| Saldo Estimado | R$ 96,00 | R$ 1.361,30 |

## Melhorias Sugeridas na Interface

Para evitar confusão futura, proponho melhorias visuais na página de Transações:

### 1. Mostrar Composição do Patrimônio

Adicionar um tooltip ou expandir o card "Saldo Inicial da Conta" para mostrar a composição:

**Atual:**
- Saldo Inicial da Conta: -R$ 1.175,45

**Novo:**
- Saldo Inicial (conta): -R$ 1.175,45
- Saldo Inicial (guardado): +R$ 1.265,30
- **Patrimônio Inicial Total:** R$ 89,85

### Alterações em `src/pages/Transactions.tsx`

Exibir o breakdown no card de saldo inicial, incluindo o `saldoInicialGuardado` quando disponível.

## Detalhes Técnicos

### Modificar Card de Saldo Inicial (Transactions.tsx linhas 700-720)

```tsx
{/* Card de Saldo Inicial - ATUALIZADO */}
<div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-primary/10">
      <Wallet className="w-4 h-4 text-primary" />
    </div>
    <div>
      <span className="text-xs text-muted-foreground">Saldo Inicial</span>
      <p className="font-semibold">
        {formatCurrency((stats?.saldoInicial || 0) + (stats?.saldoInicialGuardado || 0))}
      </p>
      {(stats?.saldoInicialGuardado || 0) > 0 && (
        <p className="text-[10px] text-muted-foreground">
          conta: {formatCurrency(stats?.saldoInicial || 0)} | 
          guardado: {formatCurrency(stats?.saldoInicialGuardado || 0)}
        </p>
      )}
    </div>
  </div>
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={() => setEditarSaldoOpen(true)}
    className="gap-2"
  >
    <Settings className="w-4 h-4" />
    Configurar
  </Button>
</div>
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Transactions.tsx` | Mostrar saldoInicialGuardado no card de saldo inicial |

## Resultado Esperado

Após preencher o valor em Preferências:

1. **Saldo Real** mostrará R$ 1.361,30 (patrimônio total)
2. **Saldo Estimado** mostrará R$ 1.361,30
3. **Card de Saldo Inicial** mostrará a composição:
   - conta: -R$ 1.175,45
   - guardado: +R$ 1.265,30

## Resumo

O problema principal é que **você ainda não salvou o valor** no novo campo. A implementação está correta, só precisa de:

1. **Ação do usuário**: Preencher R$ 1.265,30 em Preferências
2. **Melhoria opcional**: Mostrar breakdown no card de saldo inicial

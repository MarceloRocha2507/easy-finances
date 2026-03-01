
# Fix: Transações recorrentes criando apenas 1 ocorrência

## Causa raiz

Quando o usuário ativa o toggle "É uma transação recorrente?" com o tipo "Única", o `handleSubmit` verifica na linha 410:

```typescript
if (formData.tipoLancamento !== 'unica') {
  createInstallmentMutation.mutate(...); // Cria múltiplas ocorrências
} else {
  createMutation.mutate(data); // Cria apenas 1 registro
}
```

Como `tipoLancamento` continua sendo `'unica'` mesmo com `is_recurring = true`, o código cai no branch simples e cria apenas 1 registro. A lógica de geração de múltiplas ocorrências (que está no `useCreateInstallmentTransaction`) nunca é chamada.

Além disso, quando o toggle recorrente está ativo, não aparece nenhum seletor de "quantos meses" — o usuário não tem como definir quantas repetições deseja.

## Solução

### 1. Arquivo: `src/pages/Transactions.tsx` — handleSubmit (linhas 410-429)

Alterar a condição para também rotear pelo `createInstallmentMutation` quando `is_recurring` estiver ativo:

```typescript
} else if (formData.tipoLancamento !== 'unica' || formData.is_recurring) {
  createInstallmentMutation.mutate({
    baseTransaction: data,
    totalParcelas: formData.totalParcelas,
    tipoLancamento: formData.is_recurring && formData.tipoLancamento === 'unica' 
      ? 'fixa' 
      : formData.tipoLancamento,
  }, { ... });
```

Isso garante que transações com `is_recurring = true` passem pela lógica que gera múltiplos registros, tratando-as como "fixa" internamente.

### 2. Arquivo: `src/pages/Transactions.tsx` — Adicionar seletor de repetições para recorrentes (após linha 867)

Quando `is_recurring` está ativo e `tipoLancamento === 'unica'`, exibir um seletor de "Quantos meses?" (reaproveitando o mesmo padrão já usado para "fixa"):

```tsx
{formData.is_recurring && formData.tipoLancamento === 'unica' && (
  <div className="space-y-2">
    <Label>Quantos meses?</Label>
    <Select value={formData.totalParcelas.toString()} onValueChange={...}>
      <SelectContent>
        {[3, 6, 12, 18, 24, 36, 48].map(...)}
      </SelectContent>
    </Select>
  </div>
)}
```

### Resultado esperado

- Ao criar uma transação recorrente mensal de 12x, serão gerados 12 registros individuais no banco
- Todos compartilham o mesmo `parent_id` para identificação como grupo
- Cada registro tem sua data incrementada mês a mês
- O seletor de repetições aparece quando o toggle recorrente está ativo

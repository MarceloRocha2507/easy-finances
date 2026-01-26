
## Plano: Corrigir Seletor Global de Mês para Re-verificar Duplicatas

### Problema Identificado

Ao selecionar "Fixar todas as compras em: março/2026", o sistema:
1. ✅ Atualiza o estado `mesFaturaGlobal`
2. ✅ Atualiza o `mesFatura` de cada item via `useEffect`
3. ❌ **NÃO** re-verifica duplicatas após a mudança

Como o fingerprint de duplicatas inclui o mês de referência, mudar o mês deveria atualizar a verificação de duplicatas.

### Causa Raiz

```typescript
// Linha 155-163 - useEffect atual
useEffect(() => {
  if (modoMesFatura === "fixo" && mesFaturaGlobal && previewData.length > 0) {
    setPreviewData(prev => prev.map(p => ({
      ...p,
      mesFatura: mesFaturaGlobal
    })));
  }
}, [modoMesFatura, mesFaturaGlobal]);
// ❌ Não chama verificarDuplicatas()
```

### Solução

Substituir o `useEffect` por um handler dedicado que:
1. Atualiza todos os `mesFatura`
2. Chama `verificarDuplicatas()` com os dados atualizados
3. Atualiza o `previewData` com o resultado

### Alterações

**Arquivo:** `src/pages/cartoes/ImportarCompras.tsx`

| Seção | Alteração |
|-------|-----------|
| Estado | Remover o `useEffect` das linhas 155-163 |
| Novo handler | Criar `handleMesFaturaGlobalChange()` assíncrono |
| Select | Usar o novo handler no `onValueChange` |
| RadioGroup | Também usar handler ao mudar modo |

### Novo Código

```typescript
// Remover useEffect das linhas 155-163

// Novo handler para mudança de mês global
async function handleMesFaturaGlobalChange(novoMes: string) {
  setMesFaturaGlobal(novoMes);
  
  if (previewData.length > 0 && cartaoId) {
    // Atualiza o mês de todas as compras
    const dadosAtualizados = previewData.map(p => ({
      ...p,
      mesFatura: novoMes
    }));
    
    // Re-verifica duplicatas com os novos meses
    const comDuplicatas = await verificarDuplicatas(cartaoId, dadosAtualizados);
    setPreviewData(comDuplicatas);
  }
}

// Handler para mudança de modo (automático/fixo)
async function handleModoMesFaturaChange(novoModo: ModoMesFatura) {
  setModoMesFatura(novoModo);
  
  if (novoModo === "automatico" && previewData.length > 0 && cartaoId && cartao) {
    // Recalcula mês automático para cada compra
    const dadosAtualizados = previewData.map(p => {
      if (p.dataCompra) {
        const mesFaturaCalculado = calcularMesFatura(p.dataCompra, cartao.dia_fechamento);
        return { ...p, mesFatura: mesFaturaCalculado };
      }
      return p;
    });
    
    const comDuplicatas = await verificarDuplicatas(cartaoId, dadosAtualizados);
    setPreviewData(comDuplicatas);
  } else if (novoModo === "fixo") {
    // Inicializa com mês atual se não houver seleção
    const mesInicial = mesFaturaGlobal || format(new Date(), "yyyy-MM");
    if (!mesFaturaGlobal) {
      setMesFaturaGlobal(mesInicial);
    }
    await handleMesFaturaGlobalChange(mesInicial);
  }
}
```

### Alterações no JSX

```typescript
// RadioGroup - linha ~551
<RadioGroup
  value={modoMesFatura}
  onValueChange={handleModoMesFaturaChange}  // ← novo handler
  ...
>

// Select do mês fixo - linha ~567
<Select
  value={mesFaturaGlobal}
  onValueChange={handleMesFaturaGlobalChange}  // ← novo handler
>
```

### Import Adicional

```typescript
import { calcularMesFaturaCartaoStr } from "@/lib/dateUtils";
```

### Fluxo Após Correção

```text
Usuário seleciona "março/2026"
       ↓
handleMesFaturaGlobalChange("2026-03")
       ↓
1. setMesFaturaGlobal("2026-03")
2. Atualiza mesFatura de todas as linhas
3. await verificarDuplicatas() → re-analisa com novo mês
4. setPreviewData(resultado)
       ↓
UI atualiza com:
- Todos os itens mostrando "março/2026" na coluna Fatura
- Resumo por mês mostrando apenas "mar/26"
- Duplicatas re-verificadas corretamente
```

### Benefícios

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Atualiza mês | ✅ | ✅ |
| Re-verifica duplicatas | ❌ | ✅ |
| Atualiza resumo por mês | Parcial | ✅ Correto |
| UX consistente | ❌ | ✅ |

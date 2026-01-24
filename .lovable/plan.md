
## Plano: Melhorar Exibição de Duplicatas na Importação

### Situação Atual

A funcionalidade de verificação de duplicatas **já está implementada**:
- Ao clicar em "Processar dados", o sistema verifica duplicatas automaticamente
- Linhas duplicadas aparecem com fundo amarelo e ícone de alerta
- Texto "Já existe compra similar" aparece na coluna descrição
- Checkbox "Importar" permite forçar a importação mesmo com duplicata

### Problema Identificado

Quando o usuário **altera o mês da fatura** de uma compra no seletor, o sistema:
1. Reseta o status de duplicata para `false`
2. **NÃO re-verifica** se existe duplicata no novo mês

Isso pode causar confusão pois uma compra que era duplicata pode deixar de aparecer como tal (ou vice-versa) sem que o usuário perceba.

### Melhoria Proposta

**Re-verificar duplicatas automaticamente** ao alterar o mês da fatura.

---

### Mudanças no Código

#### Arquivo: `src/pages/cartoes/ImportarCompras.tsx`

**1. Modificar `handleAtualizarMesFatura` para re-verificar duplicatas:**

```typescript
async function handleAtualizarMesFatura(linha: number, mesFatura: string) {
  // Primeiro atualiza o mês
  const updatedPreview = previewData.map((p) => {
    if (p.linha === linha) {
      return { ...p, mesFatura };
    }
    return p;
  });

  // Depois re-verifica duplicatas para todas as compras
  if (cartaoId) {
    const comDuplicatas = await verificarDuplicatas(cartaoId, updatedPreview);
    setPreviewData(comDuplicatas);
  } else {
    setPreviewData(updatedPreview);
  }
}
```

**2. Adicionar indicador visual mais claro (opcional)**

Trocar a mensagem atual por um componente mais visível:

Na coluna "Duplicata", além do checkbox, mostrar um tooltip com detalhes da compra existente:

```tsx
{p.possivelDuplicata && (
  <div className="flex items-center gap-2">
    <Tooltip>
      <TooltipTrigger>
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Compra similar já existe:</p>
        <p className="text-xs">{p.duplicataInfo?.descricao}</p>
      </TooltipContent>
    </Tooltip>
    <Checkbox ... />
    <label>Importar</label>
  </div>
)}
```

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/cartoes/ImportarCompras.tsx` | Modificar `handleAtualizarMesFatura` para ser `async` e chamar `verificarDuplicatas()` após atualizar o mês |

### Comportamento Esperado

1. Usuário cola texto e clica "Processar dados"
2. Sistema mostra preview com duplicatas marcadas em amarelo
3. Se usuário alterar o mês de uma compra:
   - Sistema re-verifica duplicatas automaticamente
   - Linha pode ficar amarela (se virar duplicata) ou normal (se deixar de ser)
4. Usuário pode marcar checkbox "Importar" para forçar importação de duplicatas
5. Ao clicar "Importar", apenas compras válidas e não-duplicatas (ou forçadas) são importadas

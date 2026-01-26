

## Plano: Corrigir Layout do Cabeçalho "Forçar Todos"

### Problema Identificado

O texto "Forçar todos" está sendo cortado na tabela porque:
1. A largura da coluna (`w-28` = 112px) é insuficiente
2. O texto está quebrado em múltiplas linhas

### Solução

**Arquivo:** `src/pages/cartoes/ImportarCompras.tsx`

| Alteração | Descrição |
|-----------|-----------|
| Aumentar largura da coluna | Mudar de `w-28` para `w-32` ou `min-w-fit` |
| Ajustar layout | Usar `whitespace-nowrap` para evitar quebra de linha |
| Texto mais compacto | Trocar "Forçar todos" por "Forçar ✓" ou manter com layout melhor |

### Código Proposto

```typescript
<TableHead className="w-32">
  {stats.duplicatas > 0 ? (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <Checkbox
        id="forcar-todos"
        checked={previewData.filter(p => p.possivelDuplicata).every(p => p.forcarImportacao)}
        onCheckedChange={(checked) => {
          setPreviewData(prev => prev.map(p => 
            p.possivelDuplicata ? { ...p, forcarImportacao: checked === true } : p
          ));
        }}
        className="h-3.5 w-3.5"
      />
      <label htmlFor="forcar-todos" className="text-xs cursor-pointer font-normal">
        Forçar
      </label>
    </div>
  ) : (
    <span className="text-xs">Duplicata</span>
  )}
</TableHead>
```

### Mudanças Visuais

| Antes | Depois |
|-------|--------|
| "Fo" (cortado) | "✓ Forçar" (completo) |
| "to" (segunda linha) | Linha única |
| Sem label quando não há duplicatas | Mostra "Duplicata" quando não há duplicatas |

### Benefícios

- Texto visível por completo
- Layout consistente
- Menor ocupação de espaço horizontal


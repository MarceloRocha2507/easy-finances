
# Plano: Adicionar Coluna "Última Alteração" na Tabela de Despesas

## Objetivo

Tornar a hora da última alteração mais visível, exibindo-a diretamente como uma coluna na tabela ao invés de escondida em um tooltip.

## Situação Atual

- A informação `updated_at` já existe e é retornada pela query
- Está sendo exibida no tooltip do botão Editar (pouco visível)
- A função `formatarTempoRelativo` já está importada e funcionando

## Mudanças Técnicas

### Arquivo: `src/pages/DespesasCartao.tsx`

#### 1. Adicionar novo TableHead na linha 660

Entre "Valor" e a coluna de ações (vazia), adicionar:

```typescript
<TableHead className="hidden xl:table-cell text-center">Alterado</TableHead>
```

Usar `xl:table-cell` para exibir apenas em telas maiores, evitando poluição visual em mobile.

#### 2. Adicionar nova TableCell na linha 778

Após a célula de Valor e antes da célula de ações:

```typescript
<TableCell className="hidden xl:table-cell text-center">
  <span className="text-xs text-muted-foreground">
    {p.updated_at ? formatarTempoRelativo(p.updated_at) : '-'}
  </span>
</TableCell>
```

#### 3. Atualizar colSpan das mensagens de loading/vazio

Alterar `colSpan={8}` para `colSpan={9}` nas linhas 666 e 674 para acomodar a nova coluna.

## Layout Final da Tabela

| ✓ | Descrição | Data | Categoria | Responsável | Parcela | Valor | Alterado | Ações |
|---|-----------|------|-----------|-------------|---------|-------|----------|-------|
| □ | Nortmotos | 05/01 | - | - | 4/4 | R$ 499 | há 5 min | ✎ ↺ 🗑 |

## Comportamento Responsivo

| Tela | Coluna "Alterado" |
|------|-------------------|
| xl (1280px+) | Visível |
| lg, md, sm | Oculta (info ainda disponível no tooltip do Editar) |

## Arquivos a Modificar

1. `src/pages/DespesasCartao.tsx`
   - Adicionar `TableHead` para "Alterado"
   - Adicionar `TableCell` com tempo relativo formatado
   - Ajustar `colSpan` das linhas de loading/empty

## Tempo Estimado

2-3 minutos para implementar.

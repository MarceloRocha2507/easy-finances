
# Plano: Adicionar Opção para Marcar como Duplicada

## Objetivo

Permitir que o usuário marque manualmente uma compra como duplicata, mesmo que o sistema não tenha detectado automaticamente. Isso é útil quando:
- O usuário sabe que a compra já existe mas com descrição diferente
- O sistema não detectou uma variação de escrita
- O usuário quer excluir determinada linha da importação

## Solução

Adicionar um novo campo `marcadaDuplicataManual` ao `PreviewCompra` e uma opção visual na tabela para marcar/desmarcar linhas como duplicatas.

## Mudanças Técnicas

### 1. Arquivo: `src/services/importar-compras-cartao.ts`

Adicionar novo campo no tipo `PreviewCompra`:

```typescript
export interface PreviewCompra {
  // ... campos existentes ...
  possivelDuplicata: boolean;
  duplicataInfo?: DuplicataInfo;
  forcarImportacao: boolean;
  marcadaDuplicataManual: boolean;  // NOVO
  fingerprint?: string;
}
```

Inicializar o campo como `false` na função `parseLinhasCompra`.

### 2. Arquivo: `src/pages/cartoes/ImportarCompras.tsx`

#### a) Atualizar estatísticas para considerar duplicatas manuais

```typescript
const duplicatas = previewData.filter(
  (p) => (p.possivelDuplicata || p.marcadaDuplicataManual) && !p.forcarImportacao
);
const aImportar = validas.filter(
  (p) => (!p.possivelDuplicata && !p.marcadaDuplicataManual) || p.forcarImportacao
);
```

#### b) Adicionar handler para marcar duplicata manual

```typescript
function handleToggleDuplicataManual(linha: number, checked: boolean) {
  setPreviewData((prev) =>
    prev.map((p) => {
      if (p.linha === linha) {
        return {
          ...p,
          marcadaDuplicataManual: checked,
          forcarImportacao: checked ? false : p.forcarImportacao, // Desmarcar forçar se marcar duplicata
        };
      }
      return p;
    })
  );
}
```

#### c) Atualizar UI da tabela

Na coluna de "Duplicata", mostrar opção para marcar/desmarcar:

| Cenário | UI Exibida |
|---------|-----------|
| Não é duplicata (sistema ou manual) | Checkbox "Ignorar" |
| Marcada manualmente como duplicata | Badge amarelo + checkbox "Forçar" |
| Detectada automaticamente como duplicata | Ícone warning + checkbox "Forçar" |

#### d) Lógica visual

```
Se p.possivelDuplicata:
  → Mostra ícone warning + tooltip + "Forçar"

Senão se p.marcadaDuplicataManual:
  → Mostra badge "Manual" + "Forçar"
  
Senão (não é duplicata):
  → Mostra checkbox "Ignorar" para marcar manualmente
```

## Comportamento Esperado

| Ação do Usuário | Resultado |
|-----------------|-----------|
| Marca linha como duplicata | Linha não será importada (conta em "ignoradas") |
| Desmarca "Ignorar" | Linha volta ao normal |
| Marca "Forçar" em duplicata manual | Importa mesmo sendo marcada |

## Arquivos a Modificar

1. `src/services/importar-compras-cartao.ts`
   - Adicionar campo `marcadaDuplicataManual` ao tipo
   - Inicializar como `false` no parsing

2. `src/pages/cartoes/ImportarCompras.tsx`
   - Atualizar cálculo de estatísticas
   - Adicionar handler `handleToggleDuplicataManual`
   - Atualizar UI da coluna "Duplicata"
   - Atualizar lógica de importação para considerar duplicatas manuais

## Tempo Estimado

5-8 minutos para implementar.

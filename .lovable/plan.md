
# Plano: Corrigir Verificação de Duplicatas - Tipo de Dado `DATE`

## Problema Identificado

O erro no console é claro:
```
"operator does not exist: date ~~ unknown"
```

A query atual usa `.like()` para comparar o campo `mes_inicio`:
```typescript
.or(mesesArray.map(m => `mes_inicio.like.${m}%`).join(","))
```

Porém, `mes_inicio` é do tipo `DATE` (não `TEXT`), e o operador `LIKE` (que no SQL é `~~`) não funciona com datas.

## Solução

Alterar a lógica para usar comparação de range de datas:

| Antes | Depois |
|-------|--------|
| `mes_inicio LIKE '2026-02%'` | `mes_inicio >= '2026-02-01' AND mes_inicio < '2026-03-01'` |

Para múltiplos meses, construir uma query com `OR`:
```sql
(mes_inicio >= '2026-02-01' AND mes_inicio < '2026-03-01')
OR (mes_inicio >= '2026-03-01' AND mes_inicio < '2026-04-01')
```

## Mudanças Técnicas

### Arquivo: `src/services/importar-compras-cartao.ts`

#### 1. Criar função auxiliar para calcular range

```typescript
function calcularRangeMes(mesFatura: string): { inicio: string; fim: string } {
  const [ano, mes] = mesFatura.split("-").map(Number);
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  
  // Próximo mês
  const proxMes = mes === 12 ? 1 : mes + 1;
  const proxAno = mes === 12 ? ano + 1 : ano;
  const fim = `${proxAno}-${String(proxMes).padStart(2, '0')}-01`;
  
  return { inicio, fim };
}
```

#### 2. Alterar query na função `verificarDuplicatas`

Substituir a query com `.or()` e `.like()` por uma query com range de datas:

```typescript
// Antes:
.or(mesesArray.map(m => `mes_inicio.like.${m}%`).join(","))

// Depois: Construir filtros OR para cada mês
const filtros = mesesArray
  .map(m => {
    const { inicio, fim } = calcularRangeMes(m);
    return `and(mes_inicio.gte.${inicio},mes_inicio.lt.${fim})`;
  })
  .join(",");

// Query com OR entre os meses
.or(filtros)
```

#### 3. Ajustar extração do mês para indexação

```typescript
// Antes:
const mesFatura = existente.mes_inicio.substring(0, 7);

// Depois: O campo é DATE, então precisa ser formatado
const mesDate = new Date(existente.mes_inicio);
const mesFatura = format(mesDate, "yyyy-MM");
```

## Arquivo Modificado

- `src/services/importar-compras-cartao.ts`
  - Adicionar função `calcularRangeMes`
  - Atualizar query em `verificarDuplicatas` para usar `gte/lt` em vez de `like`
  - Formatar `mes_inicio` corretamente ao indexar por mês

## Resultado Esperado

| Cenário | Resultado |
|---------|-----------|
| Importar compras de Fevereiro/2026 | Query busca `mes_inicio >= 2026-02-01 AND < 2026-03-01` |
| Verificar duplicatas em múltiplos meses | Query com OR entre os ranges |
| Comparar mês existente | Formata DATE para "yyyy-MM" corretamente |

## Tempo Estimado

2-3 minutos para implementar a correção.



## Plano: Corrigir Parsing de Valores em Compras Parceladas

### O Problema
Na linha:
```
2026-01-05,Nortmotos - Parcela 4/8,175.00 eu
```

O regex atual `[,;]?\s*([\d.,]+)\s+(\w+)\s*$` pode estar capturando incorretamente porque:
1. O padrão `[\d.,]+` captura dígitos, pontos e vírgulas
2. Quando temos `4/8,175.00`, a barra `/` quebra a captura de forma inesperada
3. Pode estar capturando `8,175.00` como valor (resultando em 8175.00) em vez de `175.00`

### A Solução
Melhorar o regex para garantir que:
1. A barra `/` seja excluída da captura do valor
2. O valor só seja capturado quando estiver separado do resto por vírgula ou espaço
3. Tratar o caso onde a parcela `X/Y` está colada na vírgula do valor

### Alteração no Arquivo

**Arquivo:** `src/services/importar-compras-cartao.ts`

**Mudança no regex (linha 278):**

```typescript
// ANTES (problemático):
const matchFinal = resto.match(/[,;]?\s*([\d.,]+)\s+(\w+)\s*$/);

// DEPOIS (corrigido):
// Garantir que o valor começa após vírgula/ponto-e-vírgula ou espaço
// e não faz parte de um padrão X/Y
const matchFinal = resto.match(/[,;]\s*([\d]+[.,]?\d*)\s+(\w+)\s*$/);
```

**Lógica melhorada:**
1. `[,;]` - Exigir que haja uma vírgula ou ponto-e-vírgula antes do valor (separa da descrição)
2. `([\d]+[.,]?\d*)` - Capturar: dígitos, opcionalmente seguidos de vírgula/ponto e mais dígitos
3. `\s+(\w+)\s*$` - Espaço, responsável, fim da linha

### Exemplo de Parsing Corrigido

| Entrada | Antes (bug) | Depois (correto) |
|---------|-------------|------------------|
| `Parcela 4/8,175.00 eu` | valor=8175.00 | valor=175.00 |
| `Parcela 1/2,41.21 mae` | valor=241.21 | valor=41.21 |
| `Anthropic,10.41 eu` | valor=10.41 ✓ | valor=10.41 ✓ |

### Casos Especiais a Tratar

Para valores no formato brasileiro `102,25`:
```
2026-01-05,54.824.042 LUCAS - 2/3,102,25 eu
```

Neste caso, `102,25` deve ser parseado como `102.25`. O regex precisa identificar que:
- `2/3` é parcela (não valor)
- `102,25` é o valor (após a vírgula que separa da descrição)

**Solução adicional:** Verificar se há padrão `X/Y` antes do valor e garantir que a captura começa depois dele.

```typescript
// Regex mais robusto que ignora parcelas:
// Primeiro tenta encontrar valor após parcela X/Y
let matchFinal = resto.match(/\d+\/\d+[,;]\s*([\d]+[.,]?\d*)\s+(\w+)\s*$/);

// Se não encontrar, tenta o padrão normal
if (!matchFinal) {
  matchFinal = resto.match(/[,;]\s*([\d]+[.,]?\d*)\s+(\w+)\s*$/);
}
```

### Código Final Proposto

```typescript
// Encontrar responsável no final (última palavra)
// Formato: "... ,valor responsavel" ou "... X/Y,valor responsavel"

// Primeiro: tentar capturar após padrão de parcela X/Y
let matchFinal = resto.match(/\d+\/\d+[,;]\s*([\d]+[.,]?\d*)\s+(\w+)\s*$/);

// Fallback: padrão normal com vírgula/ponto-e-vírgula antes do valor
if (!matchFinal) {
  matchFinal = resto.match(/[,;]\s*([\d]+[.,]?\d*)\s+(\w+)\s*$/);
}

// Último fallback: espaço antes do valor (formato sem vírgula)
if (!matchFinal) {
  matchFinal = resto.match(/\s([\d]+[.,]\d+)\s+(\w+)\s*$/);
}

if (!matchFinal) {
  preview.erro = "Formato inválido: esperado 'valor responsável' no final";
  resultado.push(preview);
  continue;
}
```

### Testes a Validar

Após a correção, as seguintes linhas devem funcionar corretamente:

```
2026-01-05,Nortmotos - Parcela 4/8,175.00 eu         → valor=175.00, parcela 4/8
2026-01-20,Comercial Peixoto - Parcela 1/2,41.21 mae → valor=41.21, parcela 1/2
2026-01-05,54.824.042 LUCAS - 2/3,102,25 eu          → valor=102.25, parcela 2/3
2026-01-22,IOF de compra internacional,0.16 eu       → valor=0.16, única
2026-01-05,Mp *Growthsupplements - Parcela 2/3,49,47 eu → valor=49.47, parcela 2/3
```


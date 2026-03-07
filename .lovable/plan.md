

## Problema identificado

Dois bugs no hook `useFaturasNaListagem` que causam faturas de cartao ausentes no "Total a Pagar":

### Bug 1: Janela fixa de 4 meses
O hook busca parcelas apenas do "mes atual + proximos 3 meses" (linhas 40-49). Quando o usuario navega para meses passados ou meses alem dessa janela no Dashboard, nenhuma fatura de cartao aparece porque os dados simplesmente nao foram buscados.

### Bug 2: Compras sem responsavel sao ignoradas
Na linha 71-72, o filtro `compra?.responsavel?.is_titular === true` exclui compras onde `responsavel_id` e null. Como esse campo e nullable, compras feitas sem atribuir responsavel (que deveriam ser tratadas como do titular) sao ignoradas.

## Solucao

**Arquivo: `src/hooks/useFaturasNaListagem.ts`**

1. Aceitar um parametro opcional `mesReferencia?: Date` para determinar a janela de busca dinamicamente, em vez de usar sempre o mes atual
2. Quando `mesReferencia` for fornecido, centralizar a janela nesse mes (1 mes antes + 3 meses depois)
3. Incluir a queryKey com o mes de referencia para invalidar corretamente
4. Corrigir o filtro de titular: tratar `responsavel_id` null ou `responsavel` null como titular (`isTitular = true`)

**Arquivo: `src/components/dashboard/TotalAPagarCard.tsx`**

- Passar `mesReferencia` para `useFaturasNaListagem(mesReferencia)` para que o hook busque dados do mes correto

### Alteracao no filtro de titular (linha 70-72 do hook):
```typescript
// Antes:
const isTitular = compra?.responsavel?.is_titular === true;
if (!isTitular) continue;

// Depois:
const responsavel = compra?.responsavel;
const isTitular = responsavel === null || responsavel?.is_titular === true;
if (!isTitular) continue;
```

### Alteracao na janela de meses (linhas 40-49 do hook):
Usar o `mesReferencia` passado como parametro para calcular o range, garantindo que o mes selecionado no Dashboard sempre esteja coberto.


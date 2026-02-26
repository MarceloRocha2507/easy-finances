

# Alinhar Valores de Faturas entre Cards e Contas a Pagar

## Problema

O card "Fatura Cartao" no dashboard e a secao "Contas a Pagar" mostram valores diferentes porque usam logicas distintas:

- **Card (useCompleteStats)**: filtra parcelas apenas do **titular** (`is_titular === true`) e apenas do mes selecionado
- **Contas a Pagar (useFaturasNaListagem)**: soma **todas** as parcelas nao pagas (titular + terceiros) sem filtro de responsavel

## Solucao

Modificar o hook `useFaturasNaListagem` para filtrar apenas parcelas cujo responsavel e titular, alinhando com a logica do `useCompleteStats`.

## Arquivo modificado

| Arquivo | Acao |
|---------|------|
| `src/hooks/useFaturasNaListagem.ts` | Adicionar filtro de titular na query |

## Mudanca detalhada

### `useFaturasNaListagem.ts`

Alterar a query de parcelas (linha 52-58) para incluir o join com `compras_cartao -> responsaveis` e filtrar apenas `is_titular = true`:

**Antes:**
```typescript
.select('valor, mes_referencia, compra_id, compras_cartao!inner(cartao_id)')
.eq('paga', false)
.eq('ativo', true)
```

**Depois:**
```typescript
.select('valor, mes_referencia, compra_id, compras_cartao!inner(cartao_id, responsavel:responsaveis(is_titular))')
.eq('paga', false)
.eq('ativo', true)
```

E no loop de agrupamento (linha 65-75), adicionar verificacao:

```typescript
for (const p of parcelas) {
  const compra = p.compras_cartao as any;
  const cartaoId = compra?.cartao_id;
  if (!cartaoId) continue;

  // Filtrar apenas parcelas do titular
  const isTitular = compra?.responsavel?.is_titular === true;
  if (!isTitular) continue;

  // ... resto da logica de agrupamento
}
```

Isso garante que parcelas de terceiros (responsaveis nao titulares) nao sejam incluidas no total exibido em "Contas a Pagar", alinhando com o valor do card "Fatura Cartao".


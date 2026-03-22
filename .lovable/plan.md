

## Plan: Filter Parcelamentos to show only titular (EU) entries

The user wants the Parcelamentos page to only show installments where the responsible person is the titular (is_titular = true) or where no responsible is assigned (null), matching the existing pattern used elsewhere in the app.

### Changes

**File: `src/pages/cartoes/Parcelamentos.tsx`**

1. Update the query select to include `is_titular` from the `responsaveis` join: add `is_titular` to the select fields
2. After fetching compras, filter out entries where `responsaveis` exists and `is_titular` is false — keep only entries where:
   - `responsavel_id` is null (no responsible = titular)
   - OR `responsaveis.is_titular` is true
3. Remove the "Responsável" filter dropdown since only titular entries will be shown
4. Remove the `filtroResponsavel` state and its usage in the filtering logic
5. Remove display of `responsavelNome` in the card items (or keep showing "Eu" label)

### Technical detail

In the query loop (line ~77), add a check after fetching each compra:
```typescript
const responsavel = compra.responsaveis as any;
const isTitular = !responsavel || responsavel?.is_titular === true;
if (!isTitular) continue;
```

This follows the same titular filtering pattern used in `useFaturasNaListagem.ts` and other parts of the app.




## Plan: Fix Parcelamentos not showing data

**Problem**: The `is_titular` field is not included in the `responsaveis` select query, so when a purchase has a responsible person assigned, `is_titular` is always `undefined`, causing the filter `responsavel?.is_titular === true` to fail and skip all entries with a responsible person.

**Fix**: Add `is_titular` to the responsaveis select in the Supabase query.

**File: `src/pages/cartoes/Parcelamentos.tsx`**

Change the select from:
```
responsaveis(id, nome, apelido)
```
to:
```
responsaveis(id, nome, apelido, is_titular)
```

This single-line fix ensures the titular check has the data it needs to work correctly.


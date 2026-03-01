
# System Review - Issues Found and Fixes

## 1. Auth: signIn does not handle errors properly
**File:** `src/pages/Auth.tsx`
The `signIn` function in `useAuth` returns `{ error }` but the Auth page uses try/catch instead of checking the returned error. If `signIn` returns an error without throwing, the user won't see any error feedback.

**Fix:** Check the returned `{ error }` from `signIn` and show a toast if there's an error.

## 2. Auth: signUp function exists but is never used
**File:** `src/hooks/useAuth.tsx`, `src/pages/Auth.tsx`
The Auth page only has a login form -- there's no sign-up UI. The `signUp` function is exported but unused. This is likely intentional (admin-only user creation), so no change needed, but worth noting.

## 3. Missing `user_id` filter on transaction queries
**File:** `src/hooks/useTransactions.ts`
The `useTransactions` hook (line 100-137) and `useMonthlyData` (line 267-303) do **not** filter by `user_id`. They rely entirely on RLS policies. While RLS should handle this, if RLS is ever misconfigured, all users' data would be exposed. The `useTransactionStats` and `useExpensesByCategory` hooks also don't filter by `user_id` explicitly.

**Fix:** Add `.eq('user_id', user!.id)` to all transaction queries as defense-in-depth, consistent with how `useCompleteStats` already does it.

## 4. Duplicate `useToast` imports
**File:** `src/hooks/useAdmin.ts`
Imports `useToast` from `@/components/ui/use-toast` while some files use `@/hooks/use-toast`. Both exist as re-exports, but should be consistent.

**No fix needed** -- both paths work, this is cosmetic.

## 5. Potential Supabase 1000-row limit issue
**File:** `src/hooks/useTransactions.ts`
The `useTransactionsWithBalance` hook (line 793-800) fetches ALL completed transactions without a `.limit()`. For users with 1000+ transactions, the default Supabase limit will silently truncate results, causing incorrect balance calculations.

**Fix:** Add `.limit(10000)` or paginate to ensure all records are fetched for balance calculations.

## 6. Missing error handling in `useCompleteStats`
**File:** `src/hooks/useTransactions.ts` (line 884-1077)
The `useCompleteStats` hook makes 6+ sequential database calls. If any intermediate call fails (e.g., `bancos`, `investimentos`, `metas`), the error is not caught, potentially crashing the dashboard.

**Fix:** Add try/catch or handle missing tables gracefully, similar to how `useDashboardCompleto` already wraps the metas query in try/catch.

## 7. `useMonthlyData` includes all transaction statuses
**File:** `src/hooks/useTransactions.ts` (line 267-303)
Unlike `useTransactionStats` which filters `.eq('status', 'completed')`, `useMonthlyData` fetches ALL transactions regardless of status. This means cancelled/pending transactions inflate the bar chart.

**Fix:** Add `.eq('status', 'completed')` filter to `useMonthlyData`.

---

## Summary of Changes

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/Auth.tsx` | Fix error handling in signIn flow |
| 2 | `src/hooks/useTransactions.ts` | Add `user_id` filter to `useTransactions` and `useMonthlyData` |
| 3 | `src/hooks/useTransactions.ts` | Add row limit to `useTransactionsWithBalance` |
| 4 | `src/hooks/useTransactions.ts` | Add `status: completed` filter to `useMonthlyData` |
| 5 | `src/hooks/useTransactions.ts` | Add defensive error handling in `useCompleteStats` for optional tables |

These are all non-visual, behavior-preserving fixes that improve data accuracy and security.

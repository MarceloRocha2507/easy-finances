

## Problem

When paying a credit card invoice ("Pagar Fatura"), the system creates a transaction in the `transactions` table but does **not** set the `banco_id` field. Since the "Saldo Real" is calculated as `saldo_inicial + sum(transactions where banco_id = banco.id)`, the payment transaction is invisible to the balance calculation.

## Root Cause

In `src/services/compras-cartao.ts`, the `pagarFaturaComTransacao` function (line 939-953) inserts a transaction without `banco_id`. The card (`cartao`) has a `banco_id` field linking it to a bank, but this value is never passed through.

## Plan

### 1. Pass `banco_id` from the card to the payment function

**File: `src/services/compras-cartao.ts`**
- Add `bancoId: string | null` to the `PagarFaturaInput` type
- Include `banco_id: input.bancoId` in the transaction insert (line 941)

### 2. Pass the card's `banco_id` from the dialog

**File: `src/components/cartoes/PagarFaturaDialog.tsx`**
- Add `banco_id` to the `pagarFaturaComTransacao` call, sourcing it from `cartao.banco_id`

### 3. Add bank selector fallback in the dialog

If the card has no linked bank (`banco_id` is null), add an optional `BancoSelector` in the payment summary section so the user can choose which bank to debit. This ensures transactions always have a `banco_id` when possible.

This will make the payment correctly deduct from the "Saldo Real" by linking the expense transaction to the appropriate bank account.




## Diagnóstico: Fatura paga não cria transação de despesa

### O que encontrei

**Problema principal:** Quando todas as compras de um cartão são estornadas, o total da fatura vai para 0 ou negativo. Na função `pagarFaturaComTransacao` (linha 889), existe a condição:

```typescript
if (input.valorTotal > 0) {
  // cria transação de despesa
}
```

Ou seja, se o valor total é ≤ 0 (após estornos), a transação de despesa simplesmente não é criada. O pagamento apenas marca as parcelas como pagas sem registrar nada no saldo.

**Problema secundário:** Inconsistência no nome da categoria:
- O trigger `create_default_categories` cria "Fatura **do** Cartão"
- A função `pagarFaturaComTransacao` busca "Fatura **de** Cartão"
- Resultado: o mesmo usuário tem as duas categorias duplicadas no banco

### Correções

**1. `src/services/compras-cartao.ts` — Unificar nome da categoria**
- Na função `pagarFaturaComTransacao`, trocar `"Fatura de Cartão"` por `"Fatura do Cartão"` (alinhado com o trigger e o resto do sistema)
- Adicionar fallback: se não encontrar "Fatura do Cartão", buscar "Fatura de Cartão" como alternativa

**2. `src/services/compras-cartao.ts` — Permitir transação mesmo com valor 0**
- Manter a condição `valorTotal > 0` para não criar transação de R$0 (faz sentido)
- Mas garantir que quando o usuário explicitamente clica "Pagar Fatura", o fluxo não falhe silenciosamente
- Adicionar log/toast informativo quando valor é 0 para o usuário entender que não há nada a pagar

**3. `src/pages/Transactions.tsx` — Classificação robusta**
- Atualizar o filtro para aceitar ambos os nomes: `'Fatura de Cartão'` ou `'Fatura do Cartão'`

**4. `src/components/cartoes/PagarFaturaDialog.tsx` — Feedback quando total é zero**
- Se `totalFatura <= 0`, mostrar mensagem explicativa ao invés de permitir confirmação silenciosa sem efeito


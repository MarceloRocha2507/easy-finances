
# Plano: Corrigir Mês de Início das Compras Restauradas

## Diagnóstico

As compras foram restauradas corretamente da auditoria, mas o campo `mes_inicio` estava salvo incorretamente no backup original. Para compras parceladas importadas com parcela intermediária (ex: "Parcela 4/8"), o `mes_inicio` deveria refletir o mês em que aquela parcela específica aparece na fatura.

| Compra | parcela_inicial | mes_inicio atual | mes_inicio correto |
|--------|-----------------|------------------|-------------------|
| Nortmotos - Parcela 4/8 | 4 | 2026-01-01 | 2026-04-01 |
| Mp *Aliexpress - Parcela 5/12 | 5 | 2026-01-01 | 2026-05-01 |
| Jim.Com* 59117744 Aur - 3/3 | 3 | 2026-01-01 | 2026-03-01 |
| Marcelo Rocha - 2/2 | 2 | 2026-01-01 | 2026-02-01 |
| ... (9 compras afetadas) | | | |

O erro está na fórmula: o `mes_inicio` correto é `2026-01-01 + (parcela_inicial - 1) meses`.

## Solução em 2 Etapas

### Etapa 1: Corrigir `mes_inicio` das compras

Atualizar o campo `mes_inicio` das 9 compras com `parcela_inicial > 1`:

```sql
UPDATE compras_cartao
SET mes_inicio = (mes_inicio::date + ((parcela_inicial - 1) || ' months')::interval)::date
WHERE cartao_id = '8607c9f1-ccdc-42df-ad2a-d2669c7b347c'
  AND parcela_inicial > 1;
```

### Etapa 2: Regenerar parcelas

Após corrigir o `mes_inicio`, as parcelas existentes estarão com `mes_referencia` errado. Será necessário:

1. **Deletar parcelas atuais** dessas compras
2. **Regenerar via "Verificar Parcelas"** com os valores corretos

```sql
-- Deletar parcelas das compras afetadas
DELETE FROM parcelas_cartao
WHERE compra_id IN (
  SELECT id FROM compras_cartao 
  WHERE cartao_id = '8607c9f1-ccdc-42df-ad2a-d2669c7b347c'
    AND parcela_inicial > 1
);
```

## Resultado Esperado

Após a correção:

| Compra | Parcela | Mês Referência |
|--------|---------|----------------|
| Nortmotos - 4/8 | 4 | Abril/2026 |
| Nortmotos - 4/8 | 5 | Maio/2026 |
| Mp *Aliexpress - 5/12 | 5 | Maio/2026 |
| Marcelo Rocha - 2/2 | 2 | Fevereiro/2026 |

## Sequência de Execução

1. Executar UPDATE no `mes_inicio` das compras
2. Deletar parcelas incorretas
3. Clicar em "Verificar Parcelas" para regenerar

## Tempo Estimado

Menos de 1 minuto para executar as correções SQL.

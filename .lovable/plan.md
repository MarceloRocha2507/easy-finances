
# Plano: Verificar Duplicatas Apenas no Mês Selecionado

## Problema Atual

O sistema de detecção de duplicatas usa um "fingerprint" que identifica todo o **contrato de parcelamento** (mesmo valor total, mesma descrição base, mesmo número de parcelas). Isso faz com que:

- "Nortmotos - Parcela 4/4" para Março/2026 seja marcada como duplicata
- Porque já existe "Nortmotos - Parcela 3/4" em Fevereiro/2026 no banco
- O sistema considera que são "a mesma compra" (mesmo parcelamento)

Isso não é o comportamento desejado. Você quer importar a parcela 4/4 para Março sem que ela seja bloqueada pela parcela 3/4 de Fevereiro.

## Solução

Alterar a lógica de verificação de duplicatas para comparar **apenas no mesmo mês de fatura**, verificando:

1. Mesma descrição (normalizada)
2. Mesmo mês de fatura (`mesFatura`)
3. Valor similar (±R$0.10)

Isso permite importar parcelas diferentes de um mesmo parcelamento em meses diferentes sem conflito.

## Mudanças Técnicas

### Arquivo: `src/services/importar-compras-cartao.ts`

#### 1. Simplificar o Fingerprint

Remover o cálculo de `mes_base` e usar apenas:
- Descrição normalizada
- Mês da fatura (não o mês base teórico)
- Valor da parcela

```text
Antes:  "mp *aliexpress|12|449.64|2025-10" (mês base da 1ª parcela)
Depois: "mp *aliexpress|37.47|2026-03"     (mês da fatura selecionado)
```

#### 2. Ajustar Query do Banco

Filtrar apenas compras cujo `mes_inicio` corresponda ao mês que está sendo importado:

```sql
-- Antes: busca TODAS as compras do cartão
SELECT * FROM compras_cartao WHERE cartao_id = ? AND ativo = true

-- Depois: busca apenas compras do mês específico
SELECT * FROM compras_cartao 
WHERE cartao_id = ? 
  AND ativo = true
  AND mes_inicio LIKE '2026-03%'  -- Mês da fatura sendo importada
```

#### 3. Detectar Duplicatas por Mês

Para cada compra no lote, verificar se já existe no banco:
- Uma compra com descrição similar
- No mesmo mês de fatura
- Com valor próximo (±R$0.10)

### Comportamento Esperado Após a Mudança

| Importando | Já existe no banco | Resultado |
|------------|-------------------|-----------|
| Nortmotos 4/4 (Mar/26) | Nortmotos 3/4 (Fev/26) | **OK - Não é duplicata** |
| Nortmotos 4/4 (Mar/26) | Nortmotos 4/4 (Mar/26) | Duplicata |
| Aliexpress 6/12 (Mar/26) | Aliexpress 5/12 (Fev/26) | **OK - Não é duplicata** |
| Aliexpress 6/12 (Mar/26) | Aliexpress 6/12 (Mar/26) | Duplicata |

## Impacto

- Compras parceladas poderão ser importadas mês a mês sem falsos positivos
- A detecção de duplicata real (mesma linha reimportada) continua funcionando
- Comportamento mais intuitivo e alinhado com a expectativa do usuário

## Arquivos a Modificar

1. `src/services/importar-compras-cartao.ts`
   - Função `gerarFingerprint`: simplificar para usar mês da fatura diretamente
   - Função `verificarDuplicatas`: filtrar por mês e comparar descrição + valor
   - Função `detectarDuplicatasNoLote`: ajustar fingerprint

## Tempo Estimado

Menos de 5 minutos para implementar as alterações.

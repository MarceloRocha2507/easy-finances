## Detecção automática de parcelamento na leitura de comprovantes

Estender a função de IA já existente (`analisar-comprovante-cartao`) para identificar parcelamentos do tipo "3x de R$ 50,00", "em 3x sem juros", "parcelado em 6x", etc., e preencher automaticamente o campo de parcelas no `NovaCompraCartaoDialog`.

### 1. Edge function `supabase/functions/analisar-comprovante-cartao/index.ts`

- Adicionar campo `parcelas` ao JSON schema da tool `registrar_dados_comprovante`:
  - `parcelas`: integer entre 1 e 24, default 1.
- Atualizar o system prompt em PT-BR para instruir a IA a:
  - Procurar padrões como "Nx de R$ Y", "em N vezes", "parcelado em N", "N parcelas".
  - Quando encontrar, retornar `parcelas = N` e `valor = valor total` (N × Y, ou o total exibido no comprovante se já vier somado).
  - Se não houver indicação de parcelamento, retornar `parcelas = 1` (compra à vista).
  - Ignorar parcelamentos cancelados/recusados.

### 2. Frontend `src/components/cartoes/NovaCompraCartaoDialog.tsx`

- Em `handleImagemComprovante`, após receber a resposta da edge function:
  - Preencher o campo de parcelas existente do formulário com `data.parcelas` quando vier > 1.
  - Manter o comportamento atual de preencher valor, descrição, nomeFatura e dataCompra.
- Quando `parcelas > 1`, exibir no toast de sucesso uma menção explícita ("Detectado: 3x — revise antes de salvar").
- Não alterar a UI do bloco de upload nem o fluxo manual.

### Fora de escopo

- Detectar juros embutidos ou valor de parcela individual além do total.
- Suporte a parcelamentos > 24x.
- Mudanças no schema do banco — apenas leitura efêmera.

### Arquivos afetados

- **Editado**: `supabase/functions/analisar-comprovante-cartao/index.ts`
- **Editado**: `src/components/cartoes/NovaCompraCartaoDialog.tsx`

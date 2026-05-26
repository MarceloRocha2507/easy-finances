## Problema

Nas imagens da fatura Nubank, o modelo de visão está extraindo de forma inconsistente as linhas em **verde com sinal negativo**:

- Imagem 1: perdeu "Crédito de parcelamento de compra" de R$ 34,90 e R$ 30,00 (08 MAI).
- Imagem 2: capturou corretamente "Crédito de parcelamento de compra" de R$ 114,20 (09 MAI).
- Imagem 3: perdeu "Pagamento recebido" de R$ 74,67 (24 MAI).
- Imagem 4: perdeu "Pagamento recebido" de R$ 20,00 (22 MAI).

Ou seja, o prompt já descreve corretamente os tipos, mas o modelo está "pulando" linhas — provavelmente porque o texto verde tem baixo contraste no fundo escuro e o modelo trata a linha como decorativa.

Não há bug de código no frontend (o filtro `valor > 0 && estabelecimento` aceita perfeitamente esses tipos, pois `valor` vem positivo e `estabelecimento` é o próprio texto "Pagamento recebido" / "Crédito de parcelamento de compra"). A correção é no **prompt da Edge Function**.

## Mudanças

Arquivo único: `supabase/functions/analisar-comprovante-cartao/index.ts`, bloco `nubankRules`.

### 1. Adicionar bloco de instrução visual explícita no topo do bloco Nubank

Antes de "COMO A FATURA DO NUBANK FUNCIONA", adicionar uma seção **"ATENÇÃO VISUAL — LINHAS VERDES"** explicando que:

- No app do Nubank (tema escuro), TODAS as linhas com valor em **verde** OU com sinal `– R$` / `-R$` na frente são lançamentos válidos e DEVEM ser extraídas com `sinal="credito"`.
- Essas linhas têm o mesmo peso visual que compras normais — não são cabeçalhos, não são decoração, NÃO PODEM ser ignoradas.
- Tipos esperados em verde: `pagamento_fatura` ("Pagamento recebido", "Pagamento de fatura"), `estorno_parcelamento` ("Crédito de parcelamento de compra"), `estorno` ("Estorno X", "Reembolso X", "Crédito <Estab>").
- A descrição "Crédito de parcelamento de compra" pode aparecer quebrada em até 3 linhas; trate sempre como UMA linha lógica.

### 2. Adicionar checklist de auto-verificação no final do bloco Nubank

Bloco final obrigatório no prompt:

```
ANTES DE FINALIZAR A RESPOSTA:
1. Releia a imagem de cima para baixo procurando QUALQUER texto em verde ou QUALQUER valor com prefixo "–" / "-".
2. Para cada um, confirme que existe um item no array "compras" com sinal="credito" e a data correspondente.
3. Conte: número de linhas verdes na imagem == número de itens com sinal="credito" no array. Se não bater, REVISE antes de responder.
4. NUNCA omita uma linha porque "parece técnica" ou "parece resumo" — extraia tudo.
```

### 3. Reforçar regra de classificação

Na seção "Classificação do tipo", deixar explícito que `Pagamento recebido` e `Pagamento de fatura` SEMPRE são extraídos (não filtrados pelo modelo), pois o frontend é quem decide se vira "Adiantar Fatura" ou se é só informativo.

## Fora de escopo

- Não mexer no parser de CSV nem em `RevisarComprasLoteDialog`.
- Não mexer no filtro do frontend.
- Não trocar de modelo de IA — apenas reforçar o prompt.

## Como validar

Após a edição, reenviar as 4 imagens de exemplo. Cada uma deve agora trazer todas as linhas verdes:
- Imagem 1: 2 itens com `tipo="estorno_parcelamento"` (34,90 e 30,00).
- Imagem 2: 1 item `estorno_parcelamento` (114,20) + 1 item `iof` (4,00).
- Imagem 3: 1 item `pagamento_fatura` (74,67).
- Imagem 4: 1 item `pagamento_fatura` (20,00).

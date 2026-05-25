## Forçar data atual nas compras detectadas pela IA

Hoje, quando a IA lê o comprovante, ela pode extrair uma data antiga (ex: data de fechamento da fatura, data de processamento) e preencher como data da compra. Isso bagunça o mês da fatura.

### Mudança

**`src/components/cartoes/RevisarComprasLoteDialog.tsx`**
- Ignorar o campo `data` vindo da IA. Inicializar todas as linhas com a data de hoje (`new Date().toISOString().split("T")[0]`).
- Remover o input de data da UI de cada linha.
- Ajustar o grid de 3 colunas (Valor / Data / Parcelas) para 2 colunas (Valor / Parcelas).
- `handleSalvarTudo` passa a usar sempre a data de hoje para `dataCompra` e cálculo do `mesFatura`.

**`src/components/cartoes/NovaCompraCartaoDialog.tsx`** (fluxo de 1 compra detectada)
- No `handleImagemComprovante`, parar de sobrescrever o campo `dataCompra` do formulário com `data.data` retornada pela IA. Manter o valor atual (que já é a data de hoje por padrão).

### Fora de escopo

- Não mexer no schema da Edge Function (a IA continua retornando `data`, apenas será ignorada no front).
- Não alterar o fluxo de criação manual (digitação) — ali o usuário continua escolhendo a data normalmente em `NovaCompraCartaoDialog`.

### Arquivos afetados

- Editado: `src/components/cartoes/RevisarComprasLoteDialog.tsx`
- Editado: `src/components/cartoes/NovaCompraCartaoDialog.tsx`

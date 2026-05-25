## Diagnóstico (com base nas imagens da fatura)

A fatura do PicPay tem um padrão muito específico que está confundindo a IA:

1. **Linhas "Fin <Nome> parcNN/MM"** (ex.: `Fin Espetinhos parc01/02` R$ 11,48): esse valor **já é o da parcela do mês**, não o total da compra. Cada uma dessas linhas vem acompanhada de duas linhas de IOF (Diario + Adicional) com centavos.
2. **Linhas "Credito Parcelamento Compra"** (ex.: R$ 21,00, R$ 25,87, R$ 41,00): **não são créditos genéricos para ignorar** — eles existem porque a fatura também lista a **compra original riscada** (ex.: `Espetinhosbom R$ 21,00`) com valor cheio. O crédito anula a compra original e fica apenas a parcela "Fin ...".
3. **Linhas riscadas** (strikethrough no app) representam a compra original substituída pelo parcelamento.

Hoje o sistema:
- Marca "Credito Parcelamento Compra" como **desmarcado por padrão** → tira R$ 189,67 do total que deveriam ser subtraídos.
- Pode estar dividindo `Fin XYZ parc01/02` (que já é parcela) por 2 quando a IA não marcou `valor_eh_parcela=true`.
- Não detecta as compras "raiz" riscadas — então conta o débito original **e** a parcela ao mesmo tempo.

## O que vou mudar

### 1. Edge function `analisar-comprovante-cartao` — prompt PicPay-aware

Acrescentar regras explícitas no system prompt:

- Toda linha começando com `Fin ` e contendo `parcNN/MM` (ou `Parcela N de M` logo abaixo): `valor_eh_parcela = true`, `parcelas = MM`, `parcela_atual = NN`, `tipo = "compra"`.
- Toda linha `IOF Diario Parcelado` ou `IOF Adicional Parcelado`: `tipo = "iof"`, `parcelas = 1`, valor inteiro.
- Toda linha `Credito Parcelamento Compra`: `tipo = "estorno_parcelamento"` (novo tipo dedicado), `sinal = "credito"`, **com a instrução de que este crédito DEVE ser incluído** porque compensa a compra original.
- Toda linha visualmente riscada (strikethrough) ou marcada como substituída por parcelamento: `tipo = "compra_substituida"` e `ignorar = true` (novo campo) — não devem ser importadas pois já viraram parcelas `Fin ...`.
- `Pagamento de Fatura`: continua excluído (`pagamento_fatura`).

### 2. Dialog `RevisarComprasLoteDialog.tsx`

- Tratar `estorno_parcelamento` como crédito **marcado por padrão** (não desmarcado) e remover o aviso "REVISAR MANUALMENTE" dele.
- Manter a flag `creditoParcelamentoGenerico` só para casos antigos/duvidosos, mas distinguir visualmente do `estorno_parcelamento` (este vem com badge "COMPENSA PARCELAMENTO" em verde, marcado).
- Linhas `ignorar=true` (compras-raiz substituídas) entram na lista mas vêm **desmarcadas** com badge "JÁ VIROU PARCELAMENTO" e explicação curta.
- No `valorEsteMes`, quando `valorEhParcela=true` retornar o valor cru (já está assim) — garantir que toda linha `Fin ... parcNN/MM` chegue com essa flag.
- Total da fatura passa a ser: `Σ débitos incluídos − Σ créditos incluídos` (já é). Com os créditos de parcelamento marcados por padrão, a conta deve bater.

### 3. Validação rápida

Após salvar, mostrar no toast a comparação:
- "Total selecionado: R$ X,XX"  
para o usuário comparar com o app do banco antes de fechar o dialog.

## Arquivos afetados

- `supabase/functions/analisar-comprovante-cartao/index.ts` — prompt, schema (`tipo` ampliado, novo campo `ignorar`), mapeamento.
- `src/components/cartoes/RevisarComprasLoteDialog.tsx` — interface, lógica de seleção padrão, badges, totais.

## Detalhes técnicos

```text
Schema CompraExtraida (adições):
  tipo: ... | "estorno_parcelamento" | "compra_substituida"
  ignorar?: boolean   // sugestão da IA de não importar

LinhaCompra (adições):
  estornoParcelamento: boolean
  ignorarSugerido: boolean

Seleção inicial (incluir):
  - ignorarSugerido → false
  - tipo === pagamento_fatura → linha não entra (já filtrado)
  - estornoParcelamento → true  (compensa raiz)
  - creditoParcelamentoGenerico (legado, sem match) → false
  - default → true
```

Sem mudanças em DB, RLS ou outras telas.
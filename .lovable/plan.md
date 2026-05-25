
## Diagnóstico

Olhando as imagens da fatura do Nubank que você enviou, identifiquei 4 padrões que estão sendo lidos errado pela IA hoje e que causam a divergência entre o total da fatura real e o total que o app registra:

### 1. Linhas "Fin <Estabelecimento> parc 01/N" — valor é da PARCELA, não da compra total
No extrato do Nubank, quando você parcela uma compra, a linha aparece assim:
- `Fin Espetinhos parc 01/02   R$ 11,43`

O `R$ 11,43` é o **valor da parcela daquele mês**, não o total da compra. O prompt atual instrui a IA a retornar "valor total" quando vê parcelamento (`3x de R$ 50,00 → 150,00`). Aplicado nessa linha, a IA faz `11,43 × 2 = 22,86` e cria uma compra de R$ 22,86 em 2x. Resultado: a parcela do mês continua R$ 11,43 (ok), mas a fatura do mês seguinte vai mostrar mais R$ 11,43 que **na verdade já vai aparecer de novo no próximo print** que você importar. Isso duplica valor ao longo dos meses.

### 2. "Crédito Parcelamento Compra" sem nome do estabelecimento
Quando o Nubank parcela uma compra, ele lança um **crédito** com o valor original da compra (ex: `Credito Parcelamento Compra R$ 28,90`) para "estornar" a compra à vista e remontá-la em parcelas. Hoje a IA detecta como crédito (ok), mas:
- O texto é sempre genérico, dificultando associar ao "Fin X" correspondente.
- Se a IA pular essa linha, a fatura fica **maior** que a do banco.

### 3. "Pagamento de Fatura" sendo capturado como crédito
Linhas como `Pagamento de Fatura R$ 26,03` aparecem no extrato. Hoje a IA pode interpretar como crédito e reduzir a fatura — mas isso é pagamento de fatura anterior, **não deve entrar** como lançamento da fatura atual.

### 4. IOF Diário/Adicional Parcelado
Vários itens de R$ 0,02 / 0,04 aparecem. Se algum for ignorado ou capturado em duplicidade, gera divergência de centavos a reais.

---

## Correções propostas (apenas no fluxo de importação por IA)

**Arquivo:** `supabase/functions/analisar-comprovante-cartao/index.ts`

1. **Detectar contexto "extrato de fatura"** no system prompt e ajustar a regra de valor:
   - Quando a linha já indica a parcela atual (`parc 01/02`, `Parcela 1 de N`, `01/12`), o valor mostrado é da **parcela**, não da compra. Nesse caso retornar `valor = valor_da_parcela × N` apenas se for explicitamente "à vista parcelada em X" sem indicação de parcela atual. **Para linhas de fatura com parcela atual visível, retornar `valor = valor_mostrado` (parcela) e marcar com um novo campo `valor_eh_parcela: true`.**

2. **Frontend (`RevisarComprasLoteDialog.tsx`)**: quando `valor_eh_parcela = true`, calcular automaticamente `valor_total = valor_parcela × parcelas` antes de salvar via `criarCompraCartao`, e ajustar `parcelaInicial` (já existe) para a parcela atual detectada. Isso garante que o app vai gerar as parcelas restantes corretamente, sem duplicar com os próximos prints.

3. **Ignorar explicitamente "Pagamento de Fatura"** no prompt (tratar como linha a ser pulada, não como crédito).

4. **Marcar "Crédito Parcelamento Compra"** com `tipo: "estorno"` e deixar visível no diálogo de revisão com um aviso ("este crédito normalmente acompanha um 'Fin X' — confirme se quer manter"). Assim você decide caso a caso.

5. **Validação visual no diálogo de revisão**: mostrar abaixo do total um resumo do tipo:
   ```
   Débitos: R$ X,XX   Créditos: −R$ Y,YY   Líquido: R$ Z,ZZ
   ```
   para você comparar diretamente com o total da fatura do banco antes de salvar.

---

## Antes de eu implementar — uma confirmação

Você consegue me dizer, para uma dessas faturas das imagens:
- Qual o **total real** que o Nubank mostrou (valor da fatura fechada)?
- Qual o total que o app está mostrando hoje para a mesma fatura?

Com esses dois números eu valido se o diagnóstico acima realmente fecha a diferença, ou se há um 5º caso que ainda não vi.

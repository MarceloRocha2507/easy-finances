

## Problema

A seção "Contas a Pagar" está visualmente pesada: header + 2 collapsibles + subtotais separados (Cartões / Contas) + banner "Total a Pagar". Muita informação exposta por padrão.

## Solução

Redesenhar como um card compacto com visão resumida por padrão, expandível ao clicar:

**Estado colapsado (padrão):**
- Uma linha única mostrando "Contas a Pagar" + total geral + quantidade de itens + chevron
- Compacto, ocupa mínimo de espaço no Dashboard

**Estado expandido (ao clicar):**
- Duas seções internas: Faturas de Cartão e Contas Pendentes (cada uma com seus itens listados diretamente, sem collapsible aninhado)
- Total geral no rodapé

## Alterações

**Arquivo: `src/components/dashboard/ContasAPagar.tsx`**

Reescrever o componente:

1. **Estado único `open`** — substituir os 3 estados (faturasOpen, contasOpen, contasExpanded) por um único `open` que controla a expansão geral

2. **Header compacto clicável** — uma linha com:
   - Icone + "Contas a Pagar"
   - Badge com quantidade total (faturas + contas)
   - Valor total em vermelho
   - Chevron

3. **Conteúdo expandido** — ao abrir:
   - Se houver faturas: label "Faturas" + lista simples (nome do cartão, vencimento curto, valor)
   - Se houver contas: label "Contas" + lista simples (descrição, vencimento curto, valor)
   - Rodapé com total geral

4. **Remover**: subtotais separados (Total Cartões / Total Contas), banner vermelho redundante, collapsibles aninhados, botão "mostrar mais"




## Plano: Unificar cards pendentes em "Total a Pagar" expansivel

### O que muda

**1. Novo componente `TotalAPagarCard`** (substitui os 2 cards + ContasAPagar)

Um card no estilo `StatCardMinimal` (fundo branco, borda arredondada, icone no canto) que:

- **Colapsado**: mostra "Total a Pagar" como titulo, valor total (contas + faturas) em vermelho grande, duas linhas de detalhe abaixo:
  - `🧾 Contas pendentes: -R$ XXX`  
  - `💳 Fatura do cartão: -R$ XXX`
  - Chevron no canto indicando expansao

- **Expandido**: ao clicar, expande mostrando:
  - Secao "Contas Pendentes" com lista de cada conta (descricao, vencimento, valor)
  - Separador visual
  - Secao "Fatura Cartão" com cada lancamento (nome cartao, vencimento, valor)
  - Rodape com link "Ver todas"

O componente reutiliza a logica de dados do `ContasAPagar` atual (queries de transactions pendentes + faturas).

**2. Dashboard.tsx**

- Na secao "Cards Pendentes" (linhas 254-279): manter apenas o card "A Receber" como `StatCardMinimal` + o novo `TotalAPagarCard` lado a lado
- Remover os cards separados "A Pagar" e "Fatura Cartão"
- Remover a linha `<ContasAPagar />` (linha 286)

**3. Arquivos**

| Arquivo | Acao |
|---|---|
| `src/components/dashboard/TotalAPagarCard.tsx` | Criar - novo componente expansivel |
| `src/components/dashboard/ContasAPagar.tsx` | Remover (substituido) |
| `src/components/dashboard/index.ts` | Trocar export ContasAPagar por TotalAPagarCard |
| `src/pages/Dashboard.tsx` | Atualizar secao de cards pendentes, remover ContasAPagar |


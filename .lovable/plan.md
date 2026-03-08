

## Plano: Mover detalhes para dentro do modal

**Arquivo: `src/components/dashboard/TotalAPagarCard.tsx` (linhas 98-111)**

Remover o bloco que exibe "Contas pendentes" e "Fatura do cartão" no card. Isso inclui o skeleton de loading e o `div` com as duas linhas de sub-info. O card ficará apenas com o título "Total a Pagar" e o valor total, igual ao card "A Receber". Os detalhes já estão no modal, então nada mais precisa ser adicionado.


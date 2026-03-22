

## Diagnóstico: A Previsão de Quitação já está funcionando

Pela análise dos logs do console, o componente `PrevisaoQuitacao` **está renderizando** na página. Com 17 parcelamentos ativos, a seção de previsão fica **abaixo de todos os cards** — é necessário rolar a página até o final para visualizá-la.

No entanto, para melhorar a experiência, posso fazer um ajuste simples:

### Mudança proposta

**Mover a seção "Previsão de Quitação" para cima** — logo após os cards de resumo (Parcelamentos Ativos / Compromisso Mensal / Total a Pagar) e antes da lista de parcelamentos individuais. Assim o gráfico e a data de quitação ficam visíveis sem precisar rolar por todos os 17 cards.

**Arquivo: `src/pages/cartoes/Parcelamentos.tsx`**
- Mover o `<PrevisaoQuitacao parcelamentos={parcelamentosFiltrados} />` de depois da lista de parcelamentos para logo após os 3 cards de resumo

Essa é uma mudança de 2 linhas — cortar e colar o componente.


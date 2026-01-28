
Objetivo
- Remover o “espaço em branco” destacado em vermelho abaixo do gráfico de “Despesas por Categoria” na rota /reports/categorias.

Diagnóstico (causa raiz)
- A seção “Charts” usa um grid com 2 colunas (lg:grid-cols-2). Em grids, a altura da linha é determinada pelo item mais alto.
- No Relatório por Categoria, o card do gráfico de barras (“Comparativo com Mês Anterior”) está bem mais alto porque o gráfico está com height=300.
- O card do donut/legenda (PieChartWithLegend) é menor (200px), então sobra um “vão” grande na coluna da esquerda até a próxima seção (“Detalhamento por Categoria”). Esse vão aparece como um grande espaço em branco na página (exatamente a área marcada).

Solução proposta (mais simples e consistente com o Dashboard)
- Reduzir a altura do gráfico de barras do relatório para ficar próxima da altura do gráfico de donut, eliminando o vão visual.
- Também ajustar o padding do header do card do gráfico de barras para ficar consistente com os cards do Dashboard (pb-2), reduzindo ainda mais a altura total do card.

Mudanças de código (1 arquivo)
1) src/pages/reports/RelatorioCategorias.tsx
   A) Card “Comparativo com Mês Anterior”
   - Alterar o ResponsiveContainer do BarChart de height={300} para height={220} (mesmo padrão do Dashboard).
   - Alterar o empty state correspondente:
     - de className="h-[300px] ..." para className="h-[220px] ..."
   - Ajustar o CardHeader para reduzir altura:
     - adicionar className="pb-2" em <CardHeader> (como no Dashboard).

Por que isso resolve
- Com o card da direita (barras) menos alto, a “linha” do grid deixa de ficar muito alta.
- Assim, a próxima seção (“Detalhamento por Categoria”) sobe e o espaço em branco destacado desaparece (ou fica mínimo/inexistente).

Critérios de aceite (o que você deve ver ao final)
- Em /reports/categorias:
  - O bloco de “Charts” não deixa um espaço grande vazio abaixo do donut na coluna esquerda.
  - “Detalhamento por Categoria” começa logo após os gráficos, sem aquele “vão” grande.

Teste rápido (end-to-end)
- Abrir /reports/categorias em desktop e:
  - Alternar mês/ano e confirmar que o layout não “estoura” e o espaço em branco não reaparece.
  - Verificar que o gráfico de barras continua legível com 220px (mostrando as categorias do slice(0, 6)).

Observação / alternativa (se você preferir manter o gráfico de barras grande)
- Caso você queira manter o gráfico de barras em 300px por questão de leitura, a alternativa seria “aumentar” o card do PieChartWithLegend (ex.: adicionar uma prop de altura/variante “tall” e usar no relatório). Isso é um pouco mais trabalho porque mexe no componente compartilhado, mas também resolve 100%.

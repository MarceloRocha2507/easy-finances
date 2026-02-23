
# Corrigir calculo de datas e exibicao de Receitas, Despesas e Saldo nos Relatorios

## Problema Principal: Bug de Timezone nas Datas

O bug raiz esta na conversao de datas usando `toISOString().split('T')[0]`. A funcao `endOfMonth()` do date-fns retorna o ultimo dia do mes com horario 23:59:59.999 no fuso local. Quando `toISOString()` converte para UTC (Brasil = UTC-3), esse horario vira 02:59:59 do **dia seguinte**.

Exemplo concreto (confirmado nos logs de rede):
- Fevereiro 2026: `endOfMonth` = 28/02 23:59:59 (local) = **01/03** 02:59:59 (UTC)
- A query envia `date <= 2026-03-01` em vez de `date <= 2026-02-28`
- Resultado: transacoes de 1 de marco sao incluidas nos totais de fevereiro

Isso infla receitas, despesas e distorce o saldo em todos os relatorios.

## Solucao

### Arquivos afetados (4 arquivos)

Substituir todas as ocorrencias de `toISOString().split('T')[0]` por `format(date, 'yyyy-MM-dd')` do date-fns, que usa o fuso local e nao converte para UTC.

**1. `src/pages/Reports.tsx` (linhas 44-45)**

De:
```
const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;
```

Para:
```
const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
```

**2. `src/pages/reports/RelatorioCategorias.tsx` (linhas 40-41, 46-47)**

Mesma substituicao nas 4 linhas que usam `toISOString`:
- `startDateStr`, `endDateStr` (linhas 40-41)
- `prevStartStr`, `prevEndStr` (linhas 46-47)

**3. `src/pages/reports/Exportacoes.tsx` (linhas 28-29)**

Mesma substituicao para `startDateStr` e `endDateStr`.

**4. `src/pages/Dashboard.tsx` (linhas 84-85)**

De:
```
const inicioMesSelecionado = new Date(...).toISOString().split('T')[0];
const fimMesSelecionado = new Date(...).toISOString().split('T')[0];
```

Para:
```
const inicioMesSelecionado = format(new Date(year, month, 1), 'yyyy-MM-dd');
const fimMesSelecionado = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
```

Nota: O Dashboard usa `new Date(year, month+1, 0)` que retorna meia-noite, entao o bug e menos provavel, mas a correcao garante consistencia.

### Resultado esperado

- Filtro de fevereiro enviara `date <= 2026-02-28` (correto)
- Receitas e despesas serao calculadas apenas com transacoes do mes selecionado
- Saldo do periodo (Receitas - Despesas) refletira valores corretos
- Graficos de evolucao e pizza mostrarao dados precisos

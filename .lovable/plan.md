

# Plano: Eliminar Espaço em Branco Entre Cards na Economia

## Problema Identificado

Na página `/economia`, os dois cards do grid (Despesas por Categoria + Gastos por Categoria) têm alturas diferentes:
- **PieChartWithLegend**: ~300px (gráfico 200px + legenda limitada)
- **RankingGastos**: ~500px+ (lista com 9 categorias + total)

Resultado: o card do gráfico fica menor, criando espaço em branco visual abaixo dele.

## Causa Raiz

1. O `PieChartWithLegend` não tem `h-full` - não se adapta ao container
2. O `RankingGastos` tem `h-full` mas é maior devido à quantidade de dados
3. O grid CSS não força alturas iguais automaticamente

## Solução

Fazer ambos os cards ocuparem a altura total disponível no grid:

1. **Adicionar `h-full`** ao card do `PieChartWithLegend`
2. **Remover `max-h-[200px]`** da legenda para permitir scroll quando necessário
3. **Usar `items-stretch`** no container do grid (padrão, mas garantir)

## Alterações Necessárias

### Arquivo: `src/components/dashboard/PieChartWithLegend.tsx`

**1. Adicionar `h-full` ao Card (linha 87-90):**
```tsx
// Antes
<Card
  className="border rounded-xl shadow-sm animate-fade-in"
  style={{ animationDelay: `${delay}s`, opacity: 0 }}
>

// Depois
<Card
  className="border rounded-xl shadow-sm animate-fade-in h-full flex flex-col"
  style={{ animationDelay: `${delay}s`, opacity: 0 }}
>
```

**2. Permitir que CardContent expanda (linha 97):**
```tsx
// Antes
<CardContent>

// Depois
<CardContent className="flex-1 flex flex-col">
```

**3. Ajustar o container interno para expandir (linha 99):**
```tsx
// Antes
<div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4">

// Depois
<div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 h-full">
```

**4. Remover limite de altura da legenda para adaptar ao espaço disponível (linha 135):**
```tsx
// Antes
<div className="space-y-2 max-h-[200px] overflow-y-auto">

// Depois
<div className="space-y-2 overflow-y-auto flex-1">
```

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Card do gráfico menor que o ranking | Cards com alturas iguais |
| Espaço em branco abaixo do gráfico | Gráfico/legenda ocupam toda altura |
| Legenda limitada a 200px | Legenda adapta-se ao espaço |

## Teste

- Verificar na página `/economia` que ambos os cards têm a mesma altura
- Verificar que a legenda pode exibir mais itens quando há espaço
- Testar em mobile onde os cards ficam empilhados


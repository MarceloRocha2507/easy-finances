
# Refatorar Layout do Dashboard

## Resumo das mudancas

Reorganizar a secao superior do Dashboard seguindo a ordem: Header > Card Resultado do Mes > Cards de Resumo (3 colunas) > Cards Pendentes (condicionais). Remover o banner "Saldo Estimado do Mes".

## Mudancas em `src/pages/Dashboard.tsx`

### 1. Novo card "Resultado do Mes" (largura total, logo apos header/alertas)
- Calculo: `resultado = completedIncome - completedExpense`
- Se resultado < 0: fundo `#FEF2F2`, valor em vermelho, icone AlertTriangle, texto "Voce gastou mais do que recebeu este mes."
- Se resultado >= 0: fundo `#F0FDF4`, valor em verde, icone CheckCircle, texto "Suas financas estao no azul este mes."
- Valor formatado em BRL, grande e centralizado
- Card inline (sem componente separado, direto no Dashboard)

### 2. Cards de Resumo (3 colunas) - Atualizar "Saldo Disponivel"
- Manter os 3 cards existentes (Saldo Disponivel, Receitas, Despesas)
- No card "Saldo Disponivel", substituir o `subInfo` atual (Investido/Em Metas) por:
  - Texto cinza: `Estimado: R$ X,XX` onde X = `estimatedBalance`
  - Icone HelpCircle (?) que ao hover exibe tooltip: "Saldo real + receitas pendentes - despesas pendentes - fatura do cartao"
- Manter o botao de editar saldo (actions)

### 3. Cards Pendentes (condicional)
- Renderizar a linha inteira somente se pelo menos um dos 4 valores for diferente de zero
- Cada card individual so aparece se seu valor != 0
- Cards: A Receber, A Pagar, Fatura Cartao, Total a Pagar
- Grid responsivo: adapta automaticamente com CSS grid

### 4. Remover EstimatedBalanceBanner
- Remover o bloco `<div className="mb-6"><EstimatedBalanceBanner ... /></div>` (linhas 249-256)
- Remover import de `EstimatedBalanceBanner` dos imports

## Ordem final do layout (de cima para baixo)
1. Header (saudacao + filtro periodo) - mantido
2. Alertas - mantido
3. Card "Resultado do Mes" - NOVO
4. Cards Resumo: Saldo Disponivel / Receitas / Despesas - ATUALIZADO
5. Cards Pendentes (condicional): A Receber / A Pagar / Fatura / Total - ATUALIZADO
6. Graficos, Comparativo, Cartoes, Faturas, Metas, FAB - mantidos

## Detalhes tecnicos

### Card Resultado do Mes (inline no Dashboard)
```text
+----------------------------------------------------------+
| (icone)  Resultado do Mes                                |
|          R$ 1.234,56      (grande, centralizado)         |
|          "Suas financas estao no azul este mes."         |
+----------------------------------------------------------+
```
- Usa `completeStats?.completedIncome` e `completeStats?.completedExpense`
- Skeleton quando `isStatsFetching`

### SubInfo do Saldo Disponivel
```text
Estimado: R$ 5.678,90 (?)
```
- O `(?)` e um `HelpCircle` com `TooltipProvider/Tooltip`
- Usa `completeStats?.estimatedBalance`

### Renderizacao condicional dos pendentes
```tsx
const pendingIncome = completeStats?.pendingIncome || 0;
const pendingExpense = completeStats?.pendingExpense || 0;
const faturaCartao = completeStats?.faturaCartao || 0;
const totalAPagar = pendingExpense + faturaCartao;
const hasAnyPending = pendingIncome > 0 || pendingExpense > 0 || faturaCartao > 0;
```
Grid usa `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` com cards filtrados.

## Arquivos modificados
| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Editar - reorganizar layout, adicionar card resultado, atualizar subInfo saldo, condicionar pendentes, remover EstimatedBalanceBanner |

Nenhum arquivo novo sera criado. Imports de `CheckCircle` e `HelpCircle` serao adicionados do lucide-react. O import de `Tooltip/TooltipProvider/TooltipContent/TooltipTrigger` sera adicionado de `@/components/ui/tooltip`.

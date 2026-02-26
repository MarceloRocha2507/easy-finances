

# Barra de Comprometimento de Renda

## O que sera feito
Adicionar uma barra de progresso de largura total entre os Cards Pendentes e os Graficos, mostrando o percentual de comprometimento da renda (despesas / receitas).

## Mudancas em `src/pages/Dashboard.tsx`

### Novo bloco (apos Cards Pendentes, antes dos Graficos - entre as linhas 271 e 274)

Um `Card` com:
- Titulo: "Comprometimento da Renda" com icone `BarChart3`
- Calculo: `percentual = (completedExpense / completedIncome) * 100` (se receita = 0, mostra 0%)
- Barra de progresso usando o componente `Progress` existente
- Percentual exibido a direita da barra (ex: "72%")
- Cores da barra conforme faixa:
  - 0-70%: verde (`[&>div]:bg-green-500`)
  - 71-99%: amarelo/laranja (`[&>div]:bg-amber-500`)
  - 100%+: vermelho (`[&>div]:bg-red-500`)
- Se >= 100%, mensagem de alerta abaixo: "Suas despesas ultrapassaram sua renda este mes."
- Skeleton durante loading (`isStatsFetching`)

### Imports necessarios
- `Progress` de `@/components/ui/progress` (novo import)
- `Percent` de `lucide-react` (novo import para o icone)

### Nenhum arquivo novo
Tudo sera implementado inline no Dashboard, usando componentes ja existentes (`Card`, `Progress`, `Skeleton`).

## Detalhes tecnicos

```text
+----------------------------------------------------------+
| BarChart3  Comprometimento da Renda                      |
| [============████████████=========]              72%     |
+----------------------------------------------------------+
```

Logica de cor:
```tsx
const barColor = percentual >= 100
  ? "[&>div]:bg-red-500"
  : percentual > 70
    ? "[&>div]:bg-amber-500"
    : "[&>div]:bg-green-500";
```

A barra usa `Math.min(percentual, 100)` como value para nao estourar visualmente, mas o texto exibe o valor real (ex: "126%").

## Arquivo modificado
| Arquivo | Acao |
|---------|------|
| `src/pages/Dashboard.tsx` | Adicionar bloco de comprometimento de renda entre pendentes e graficos |


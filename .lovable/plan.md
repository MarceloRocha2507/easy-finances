
# Refatorar "Contas a Pagar" -- Apenas Pendentes com Blocos Separados

## Resumo

Reescrever completamente o componente `ContasAPagar.tsx` para exibir exclusivamente compromissos pendentes, divididos em dois blocos: Faturas de Cartao e Contas Pendentes, com totalizador geral no rodape. O componente recebera tambem a renda do mes para calcular o percentual de comprometimento.

## Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `src/components/dashboard/ContasAPagar.tsx` | Reescrever completamente |
| `src/pages/Dashboard.tsx` | Passar prop `rendaMensal` ao componente |

Nenhum arquivo novo sera criado.

## Mudancas detalhadas

### 1. `src/components/dashboard/ContasAPagar.tsx`

#### Props
```tsx
interface ContasAPagarProps {
  mesReferencia: Date;
  rendaMensal: number; // completeStats.completedIncome
}
```

#### Dados
- **Faturas de cartao**: usar `useFaturasNaListagem()` existente, filtrar pelo mes de referencia e apenas pendentes (`statusFatura !== 'paga'`)
- **Contas pendentes**: usar `useTransactions({ startDate, endDate, type: 'expense', status: 'pending' })` -- filtra apenas pendentes direto na query

#### BLOCO 1 -- Faturas de Cartao
- Titulo: "💳 Faturas de Cartao" (so exibe se houver faturas)
- Card horizontal por cartao: icone CreditCard com cor do cartao, nome, data de vencimento, valor em vermelho, badge Pendente/Vencido
- Rodape do bloco: "Total em Cartoes: -R$ X.XXX,XX"

#### BLOCO 2 -- Contas Pendentes
- Titulo: "📋 Contas Pendentes"
- Cada item com:
  - Emoji por categoria (mapeamento por nome: Moradia->🏠, Energia->⚡, Agua->💧, Internet->📡, Assinatura->📺, outros->📌)
  - Nome + categoria em cinza
  - Data de vencimento inteligente:
    - Vencido: texto vermelho "Venceu ha X dias"
    - Vence hoje: texto laranja "Vence hoje!"
    - Vence em ate 3 dias: texto amarelo "Vence em X dias"
    - Futuro: texto cinza "Vence DD/MM"
  - Valor em vermelho
  - Badge Pendente (amarelo) ou Vencido (vermelho com animate-pulse)
- Estilo condicional:
  - Vencido: `bg-red-50 border-l-4 border-l-red-500`
  - Pendente: `bg-yellow-50 border-l-4 border-l-yellow-400`
- Ordenacao: vencidos primeiro, depois pendentes por data

#### BLOCO 3 -- Totalizador Geral (rodape)
- Tres valores em linha (`flex-col sm:flex-row`):
  - "💳 Total Cartoes: -R$ X.XXX,XX" vermelho
  - "📋 Total Contas: -R$ X.XXX,XX" vermelho
  - "⚠️ Total a Pagar: -R$ X.XXX,XX" negrito vermelho maior
- Barra de progresso: `(totalAPagar / rendaMensal) * 100`
  - Texto: "Seus compromissos pendentes representam XX% da sua renda"
  - Cor: verde ate 50%, amarelo 51-80%, vermelho acima de 80%

#### Estados
- Loading: Skeletons
- Vazio (sem faturas nem contas): mensagem "Nenhum compromisso pendente este mes" com icone

### 2. `src/pages/Dashboard.tsx`

Alterar a chamada do componente para passar a renda:
```tsx
<ContasAPagar 
  mesReferencia={mesReferencia} 
  rendaMensal={completeStats?.completedIncome || 0} 
/>
```

## Detalhes tecnicos

### Mapeamento de emojis por categoria
```tsx
const CATEGORY_EMOJI: Record<string, string> = {
  'moradia': '🏠', 'aluguel': '🏠',
  'energia': '⚡', 'luz': '⚡',
  'agua': '💧', 'água': '💧',
  'internet': '📡', 'telefone': '📡',
  'assinatura': '📺', 'streaming': '📺',
};
// fallback: '📌'
```

### Logica de data inteligente
```tsx
const diffDays = Math.floor((dueDate - today) / 86400000);
if (diffDays < 0) return { text: `Venceu há ${Math.abs(diffDays)} dias`, class: 'text-red-600' };
if (diffDays === 0) return { text: 'Vence hoje!', class: 'text-orange-500' };
if (diffDays <= 3) return { text: `Vence em ${diffDays} dias`, class: 'text-yellow-600' };
return { text: `Vence ${format(dueDate, 'dd/MM')}`, class: 'text-muted-foreground' };
```

### Cor da barra de comprometimento
```tsx
const pctRenda = rendaMensal > 0 ? (totalGeral / rendaMensal) * 100 : 0;
const barColor = pctRenda > 80 ? '[&>div]:bg-red-500' 
  : pctRenda > 50 ? '[&>div]:bg-amber-500' 
  : '[&>div]:bg-green-500';
```

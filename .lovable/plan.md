
# Incluir Faturas de Cartao na Listagem de Despesas

## Visao Geral

As faturas de cartao de credito devem aparecer na aba "Despesas" da tela de Transacoes, mescladas com as despesas comuns. Faturas pagas ja aparecem como transacoes (categoria "Fatura de Cartao"), mas precisam de diferenciacao visual. Faturas abertas e futuras precisam ser injetadas como itens virtuais.

## Como Funciona Hoje

- Quando uma fatura e paga (`pagarFaturaComTransacao`), uma transacao de despesa e criada com descricao "Fatura [NomeCartao] - [mes]" e categoria "Fatura de Cartao"
- Essas transacoes ja aparecem na listagem, mas sem diferenciacao visual
- Faturas nao pagas (mes atual e futuros) nao aparecem na listagem de transacoes

## Arquitetura da Solucao

### 1. Novo hook: `src/hooks/useFaturasNaListagem.ts`

Busca faturas de cartao nao pagas (total de parcelas por cartao por mes) e retorna como itens compativeis com a listagem de transacoes.

**Logica:**
- Buscar todos os cartoes do usuario
- Para cada cartao, calcular o total de parcelas nao pagas agrupado por mes (mes atual + proximos 3 meses)
- Determinar status: se o mes ja fechou (dia atual >= dia_fechamento), status = "Fechada - aguardando pagamento"; senao, status = "Em aberto"
- Para meses futuros, status = "Pendente"
- Retornar como array de objetos com interface compativel com `Transaction` (tipo virtual)

**Query:**
```text
parcelas_cartao (paga=false, ativo=true)
  -> JOIN compras_cartao (para obter cartao_id)
  -> JOIN cartoes (para nome, cor, dia_fechamento, dia_vencimento)
Agrupar por: cartao_id + mes_referencia
```

### 2. Tipo `FaturaVirtual` em `src/hooks/useFaturasNaListagem.ts`

```text
type FaturaVirtual = {
  id: string;               // "fatura-{cartaoId}-{mesKey}"
  type: "expense";
  amount: number;            // total das parcelas do mes
  description: string;       // "Fatura {nomeCartao}"
  date: string;              // dia_vencimento do cartao naquele mes
  status: "pending";
  due_date: string;          // data de vencimento
  created_at: string;
  isFaturaCartao: true;      // flag para diferenciacao
  cartaoNome: string;
  cartaoCor: string;
  cartaoId: string;
  statusFatura: "aberta" | "fechada" | "pendente";
  mesReferencia: string;
}
```

### 3. Modificar `src/pages/Transactions.tsx`

**3a. Importar e usar o novo hook:**
- Chamar `useFaturasNaListagem()` no componente principal
- Mesclar os resultados com `expenseTransactions` quando a tab ativa for "expense" ou "all"
- Ordenar por data (faturas futuras no final)

**3b. Alterar a renderizacao da lista:**
- Verificar se o item e uma `FaturaVirtual` (via flag `isFaturaCartao`)
- Se for, renderizar com `FaturaCartaoRow` (novo componente)
- Se nao, renderizar com `TransactionRow` (existente)

**3c. Atualizar contagem das tabs:**
- Somar a quantidade de faturas virtuais na contagem de "Despesas"

**3d. Faturas pagas (transacoes existentes):**
- Detectar transacoes com categoria "Fatura de Cartao" pelo nome da categoria
- Adicionar badge visual com icone de cartao na `TransactionRow` existente

### 4. Novo componente inline: `FaturaCartaoRow`

Dentro de `Transactions.tsx`, componente para renderizar uma fatura virtual:

**Visual:**
- Icone: `CreditCard` com fundo roxo/violeta (cor distinta das despesas comuns)
- Titulo: "Fatura {NomeCartao}" (ex: "Fatura Nubank")
- Subtitulo: data de vencimento + status badge
- Badge de status colorido:
  - "Em aberto" = badge azul
  - "Fechada" = badge amarelo/amber
  - "Pendente" = badge cinza
- Valor em vermelho (despesa) com prefixo "-"
- Ao clicar, navegar para a pagina de faturas do cartao

### 5. Diferenciacao visual para faturas PAGAS (transacoes existentes)

Na `TransactionRow`, quando `transaction.category?.name === "Fatura de Cartao"`:
- Substituir o icone da categoria por `CreditCard` com fundo roxo
- Adicionar um badge discreto com o nome do cartao (extraido da descricao "Fatura X - mes")

---

## Detalhes Tecnicos

### Hook `useFaturasNaListagem`

```text
export function useFaturasNaListagem() {
  // 1. Buscar cartoes
  // 2. Buscar parcelas nao pagas dos proximos 3 meses (agrupadas por cartao+mes)
  // 3. Para cada grupo, criar FaturaVirtual com:
  //    - amount = soma dos valores das parcelas
  //    - date = dia_vencimento do cartao no mes seguinte ao mes_referencia
  //    - status baseado no dia_fechamento vs dia atual
  // 4. Retornar array de FaturaVirtual
}
```

### Mesclagem na listagem

```text
// Em Transactions.tsx
const { data: faturasVirtuais } = useFaturasNaListagem();

const expenseTransactions = useMemo(() => {
  const expenses = searchedTransactions.filter(t => t.type === 'expense');
  // Adicionar faturas virtuais
  const combinadas = [...expenses, ...(faturasVirtuais || [])];
  return combinadas;
}, [searchedTransactions, faturasVirtuais]);
```

### Renderizacao condicional

```text
// Na lista
{sortedTransactions.map((item) => (
  'isFaturaCartao' in item ? (
    <FaturaCartaoRow key={item.id} fatura={item} />
  ) : (
    <TransactionRow key={item.id} transaction={item} ... />
  )
))}
```

### Arquivos criados
1. `src/hooks/useFaturasNaListagem.ts` - Hook para buscar faturas virtuais

### Arquivos modificados
1. `src/pages/Transactions.tsx` - Integrar faturas na listagem com diferenciacao visual

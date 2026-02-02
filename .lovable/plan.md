
# Adicionar Botão "Ver Detalhes" nas Transações

## Objetivo

Adicionar uma opção "Ver detalhes" em cada transação que abre um modal com todas as informações detalhadas do registro.

## Onde Será Adicionado

O botão será incluído nos dois locais de ações:
1. **Mobile**: Menu dropdown (DropdownMenu) - nova opção no início
2. **Desktop**: Botões que aparecem no hover - novo botão com ícone de olho

## Modal de Detalhes

O modal exibirá todas as informações da transação de forma organizada:

```text
┌─────────────────────────────────────────────────┐
│  Detalhes da Transação                      [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Ícone Categoria]                              │
│  Descrição da Transação                         │
│  Categoria: Alimentação                         │
│                                                 │
│  +R$ 1.500,00  ou  -R$ 150,00                   │
│                                                 │
├─────────────────────────────────────────────────┤
│  Informações                                    │
│  ┌─────────────────┬──────────────────────────┐ │
│  │ Tipo            │ Receita / Despesa        │ │
│  │ Data            │ 02/02/2026               │ │
│  │ Status          │ Concluída / Pendente     │ │
│  │ Vencimento      │ 05/02/2026 (se houver)   │ │
│  │ Data Pagamento  │ 02/02/2026 (se paga)     │ │
│  └─────────────────┴──────────────────────────┘ │
│                                                 │
│  (Se parcelada/fixa/recorrente)                 │
│  ┌─────────────────┬──────────────────────────┐ │
│  │ Tipo Lançamento │ Parcelada / Fixa         │ │
│  │ Parcela         │ 3 de 12                  │ │
│  │ Dia Recorrência │ 10 (se recorrente)       │ │
│  └─────────────────┴──────────────────────────┘ │
│                                                 │
│  Registro                                       │
│  ┌─────────────────┬──────────────────────────┐ │
│  │ Criado em       │ 01/02/2026 às 14:30      │ │
│  │ Atualizado em   │ 02/02/2026 às 10:15      │ │
│  │ ID              │ abc123...                │ │
│  └─────────────────┴──────────────────────────┘ │
│                                                 │
│                         [Editar]    [Fechar]    │
└─────────────────────────────────────────────────┘
```

## Alterações Técnicas

**Arquivo:** `src/pages/Transactions.tsx`

### 1. Adicionar Estado para Controlar Modal

Criar estado para armazenar a transação selecionada para visualização:

```typescript
const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
```

### 2. Criar Componente TransactionDetailsDialog

Novo componente interno que renderiza o modal de detalhes com todas as informações organizadas em seções.

### 3. Atualizar TransactionRow

Adicionar callback `onView` e incluir botão/opção "Ver detalhes":

- **Mobile (DropdownMenu)**: Adicionar item no início do menu
- **Desktop**: Adicionar botão com ícone `Eye` antes dos outros botões

### 4. Ícone a Utilizar

Importar e usar o ícone `Eye` do lucide-react para a ação de visualizar.

## Resumo das Modificações

| Local | Alteração |
|-------|-----------|
| Importações | Adicionar `Eye` do lucide-react |
| Estado | Novo state `viewingTransaction` |
| TransactionRowProps | Adicionar prop `onView` |
| TransactionRow (Mobile) | Nova opção "Ver detalhes" no dropdown |
| TransactionRow (Desktop) | Novo botão com ícone Eye |
| Novo Componente | `TransactionDetailsDialog` |
| Renderização | Incluir o dialog na página |

## Resultado Esperado

- Usuário clica em "Ver detalhes" (mobile) ou no ícone de olho (desktop)
- Modal abre com todas as informações da transação organizadas
- Botão "Editar" no modal permite ir direto para edição
- Informações sensíveis como ID são mostradas de forma discreta
- Layout responsivo e consistente com o design system atual


## Plano: Adiantamento de Fatura (Pagamento Parcial)

### Objetivo
Adicionar a funcionalidade de **adiantamento/pagamento parcial** da fatura do cartão de crédito, permitindo que o usuário faça um pagamento antecipado de qualquer valor antes do vencimento, reduzindo o saldo devedor.

### Interface Proposta

Um novo botão "Adiantar" na página de Despesas do Cartão, que abre um diálogo para registrar o pagamento parcial:

```text
┌─────────────────────────────────────────────────────────┐
│ 💳 Nubank                  Despesas do mês             │
├─────────────────────────────────────────────────────────┤
│  [Excluir] [Ajustar] [Adiantar] [Nova compra]          │  ← Novo botão "Adiantar"
├─────────────────────────────────────────────────────────┤
│  ● Pendente: R$ 1.200   ● Pago: R$ 500   Total: R$ 1.700│
└─────────────────────────────────────────────────────────┘

     Ao clicar em "Adiantar":
         ┌───────────────────────────────────┐
         │ 💵 Adiantar Fatura                │
         │                                   │
         │ Nubank - Janeiro 2026             │
         │                                   │
         │ Valor pendente: R$ 1.200,00       │
         │ ───────────────────────────────   │
         │                                   │
         │ Valor do adiantamento (R$)        │
         │ ┌───────────────────────────┬──┐  │
         │ │ 500,00                    │🧮│  │  ← Com calculadora
         │ └───────────────────────────┴──┘  │
         │                                   │
         │ Observação (opcional)             │
         │ ┌───────────────────────────────┐ │
         │ │ Ex: Adiantamento parcial      │ │
         │ └───────────────────────────────┘ │
         │                                   │
         │ ⚠️ Isso criará uma despesa de     │
         │    R$ 500 no seu saldo real.      │
         │                                   │
         │      [Confirmar Adiantamento]     │
         └───────────────────────────────────┘
```

### Comportamento

1. **O que acontece ao confirmar:**
   - Cria uma transação de despesa no saldo real (tipo "Adiantamento Fatura Nubank")
   - Marca parcelas como pagas até atingir o valor adiantado (da mais antiga para a mais recente)
   - Ou: registra o valor como crédito na fatura (abordagem alternativa)

2. **Validações:**
   - Valor deve ser > 0
   - Valor não pode ser maior que o total pendente
   - Confirmação visual do impacto no saldo

---

### Seção Técnica

#### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/cartoes/AdiantarFaturaDialog.tsx` | Novo diálogo para registrar adiantamento |

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/DespesasCartao.tsx` | Adicionar botão "Adiantar" e estado do dialog |
| `src/services/compras-cartao.ts` | Nova função `adiantarFatura()` |

---

#### Nova Função: `adiantarFatura`

```typescript
export type AdiantarFaturaInput = {
  cartaoId: string;
  nomeCartao: string;
  mesReferencia: Date;
  valorAdiantamento: number;
  observacao?: string;
};

export async function adiantarFatura(input: AdiantarFaturaInput): Promise<void> {
  // 1. Buscar parcelas pendentes ordenadas por data
  // 2. Marcar como pagas até atingir o valor (prioriza parcelas menores/mais antigas)
  // 3. Criar transação de despesa no saldo real
}
```

**Lógica de marcação de parcelas:**
- Ordenar parcelas pendentes por `data_compra` (mais antigas primeiro)
- Iterar marcando como `paga = true` até consumir o valor adiantado
- Se sobrar valor (parcela maior que restante), deixar pendente (não faz pagamento parcial de parcela individual)

**Alternativa (mais simples):**
- Criar apenas a transação de despesa
- Não marcar parcelas automaticamente (usuário marca manualmente depois)
- Essa opção é mais flexível mas menos automatizada

#### Novo Componente: `AdiantarFaturaDialog`

```tsx
interface Props {
  cartao: Cartao;
  mesReferencia: Date;
  totalPendente: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}
```

**Campos do formulário:**
- `valor`: Input numérico com calculadora integrada
- `observacao`: Textarea opcional
- Exibir valor pendente e alerta sobre impacto no saldo

#### Integração na Página

```tsx
// Estado
const [adiantarFaturaOpen, setAdiantarFaturaOpen] = useState(false);

// Novo botão no header (junto com Ajustar e Nova compra)
<Button 
  size="sm" 
  variant="outline" 
  onClick={() => setAdiantarFaturaOpen(true)}
  disabled={totalMes === 0}
>
  <Banknote className="h-4 w-4" />
  Adiantar
</Button>

// Dialog
<AdiantarFaturaDialog
  cartao={cartao}
  mesReferencia={mesRef}
  totalPendente={totalMes}
  open={adiantarFaturaOpen}
  onOpenChange={setAdiantarFaturaOpen}
  onSuccess={carregarFatura}
/>
```

---

### Resumo das Mudanças

1. **Novo componente** `AdiantarFaturaDialog`:
   - Input de valor com calculadora
   - Observação opcional
   - Confirmação do impacto no saldo

2. **Novo serviço** `adiantarFatura`:
   - Cria transação de despesa "Adiantamento Fatura X"
   - Marca parcelas como pagas até atingir o valor
   - Usa categoria "Fatura de Cartão" (mesma do pagamento normal)

3. **Página DespesasCartao**:
   - Novo botão "Adiantar" no header
   - Estado e lógica para abrir o dialog

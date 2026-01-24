

## Plano: Calculadora Básica para Campo de Valor

### Objetivo
Adicionar uma calculadora básica ao lado do campo "Valor total (R$)" no diálogo de Nova Compra, permitindo calcular rapidamente valores como "175 × 8" para obter o total de parcelas.

### Solução Proposta

#### 1. Interface Visual
Um ícone de calculadora ao lado do campo de valor que, ao clicar, abre um popover com a calculadora:

```text
Valor total (R$)
┌────────────────────────────┬───┐
│ 0,00                       │ 🧮│
└────────────────────────────┴───┘
                    │
                    ▼ (ao clicar)
         ┌───────────────────────┐
         │ Calculadora           │
         ├───────────────────────┤
         │ ┌─────────────────┐   │
         │ │ 175 × 8 = 1400  │   │
         │ └─────────────────┘   │
         │                       │
         │ 7  8  9  ÷  ⌫        │
         │ 4  5  6  ×           │
         │ 1  2  3  −           │
         │ 0  ,  C  +  =        │
         │                       │
         │      [Usar valor]     │
         └───────────────────────┘
```

#### 2. Funcionalidades da Calculadora
- Operações básicas: soma (+), subtração (−), multiplicação (×), divisão (÷)
- Suporte a decimais (vírgula brasileira)
- Botão limpar (C) e backspace (⌫)
- Exibir expressão e resultado em tempo real
- Botão "Usar valor" que transfere o resultado para o campo de valor

#### 3. Casos de Uso Principais
- **Calcular valor total de parcelas**: "175 × 8" → R$ 1.400,00
- **Somar múltiplos itens**: "50 + 30 + 25" → R$ 105,00
- **Calcular desconto**: "200 − 20" → R$ 180,00

---

### Arquivos a Criar/Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/calculator-popover.tsx` | **NOVO** - Componente reutilizável da calculadora |
| `src/components/cartoes/NovaCompraCartaoDialog.tsx` | Integrar calculadora ao campo de valor |

---

### Seção Técnica

#### Novo Componente: `CalculatorPopover`

```typescript
interface CalculatorPopoverProps {
  onResult: (value: number) => void;
  trigger?: React.ReactNode;
}
```

**Estado interno:**
- `expressao: string` - Expressão atual (ex: "175×8")
- `resultado: number | null` - Resultado calculado
- `open: boolean` - Estado do popover

**Lógica de cálculo:**
- Usar `Function` ou parser manual para avaliar expressões simples
- Substituir × por *, ÷ por /, vírgula por ponto antes de calcular
- Validar entrada para evitar injeção de código

**Layout dos botões (grid 4×5):**
```
7  8  9  ÷  ⌫
4  5  6  ×  
1  2  3  −  
0  ,  C  +  =
```

#### Integração no NovaCompraCartaoDialog

Substituir o Input de valor atual por uma estrutura com o botão da calculadora:

```tsx
<div className="space-y-2">
  <Label htmlFor="valor">Valor total (R$)</Label>
  <div className="flex gap-2">
    <Input
      id="valor"
      type="text"
      inputMode="decimal"
      placeholder="0,00"
      value={form.valor}
      onChange={(e) => setForm({ ...form, valor: e.target.value })}
      className="flex-1"
    />
    <CalculatorPopover
      onResult={(value) => {
        setForm({ ...form, valor: value.toFixed(2).replace(".", ",") });
      }}
    />
  </div>
</div>
```

#### Segurança na Avaliação de Expressões

Para evitar problemas de segurança, usar um parser simples em vez de `eval`:

```typescript
function calcularExpressao(expr: string): number | null {
  // Remover espaços e normalizar
  const normalized = expr
    .replace(/,/g, ".")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
  
  // Validar que só contém números e operadores permitidos
  if (!/^[\d+\-*/.()\s]+$/.test(normalized)) {
    return null;
  }
  
  try {
    // Usar Function para avaliar de forma mais segura que eval
    const result = new Function(`return (${normalized})`)();
    return typeof result === "number" && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}
```

---

### Resumo das Mudanças

1. **Novo componente** `CalculatorPopover`:
   - Popover com grid de botões numéricos e operadores
   - Display mostrando expressão e resultado
   - Botão "Usar valor" para aplicar resultado

2. **NovaCompraCartaoDialog**:
   - Adicionar ícone/botão de calculadora ao lado do campo valor
   - Callback para receber resultado e atualizar o form




## Plano: Melhorar estrutura e design do modal Total a Pagar

O modal atual tem um layout funcional mas básico. Vou refiná-lo seguindo o design system premium da aplicação.

### Mudanças no `TotalAPagarCard.tsx`

**1. Header do modal mais estruturado**
- Fundo sutil (`bg-muted/50`) com borda inferior, seguindo o padrão de modais do sistema
- Valor total grande e destacado abaixo do título
- Contadores de itens como badges discretos

**2. Seções com melhor hierarquia visual**
- Cada seção (Contas Pendentes / Faturas) com ícone + título em linha, separados por borda
- Itens com fundo alternado sutil no hover e padding consistente
- Badge de vencimento com cores semânticas: vermelho para atrasado, âmbar para "Hoje", neutro para futuro
- Ícone de status (circle dot) antes da data para itens atrasados

**3. Empty state**
- Mensagem amigável quando não há itens em alguma seção

**4. Rodapé mais limpo**
- Barra de total com fundo sutil (`bg-muted/30`)
- Botão "Ver todas" como link estilizado

**5. Card principal**
- Manter consistente com `StatCardMinimal` (já está bom)
- Adicionar cursor-pointer e hover sutil

### Resultado visual esperado

```text
┌──────────────────────────────┐
│  Total a Pagar               │
│  -R$ 2.450,00          [eye] │
│  🧾 Contas: -R$ 1.200       │
│  💳 Faturas: -R$ 1.250      │
└──────────────────────────────┘

         ↓ clique ↓

┌─── Modal ────────────────────┐
│ Total a Pagar                │
│ -R$ 2.450,00                 │
│ 3 contas · 2 faturas         │
├──────────────────────────────┤
│ CONTAS PENDENTES (3)         │
│ ● Aluguel       Hoje  -1200 │
│ ● Internet      3d     -150 │
│ ● Luz          12/04   -200 │
├──────────────────────────────┤
│ FATURA CARTÃO (2)            │
│ ● Nubank       2d atrás -800│
│ ● Inter        15/04   -450 │
├──────────────────────────────┤
│ Ver todas →    Total: -2450  │
└──────────────────────────────┘
```

Arquivo alterado: `src/components/dashboard/TotalAPagarCard.tsx`


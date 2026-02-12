

# Padronizar Cores Hardcoded no DetalhesCartaoDialog

## Problema

O arquivo `DetalhesCartaoDialog.tsx` utiliza cores Tailwind hardcoded (`emerald-500`) em vez dos design tokens do sistema (`income`), quebrando a consistencia visual caso os tokens sejam alterados no futuro.

## Cores a Substituir

| Linha | Atual | Novo | Contexto |
|-------|-------|------|----------|
| 269 | `text-emerald-500` | `text-income` | Valor "Disponivel" no header |
| 447 | `bg-emerald-500` | `bg-income` | Bolinha "Pago" no resumo |
| 494 | `bg-emerald-500/5` | `bg-income/5` | Background da linha paga |

## O que nao muda

- `text-destructive` ja e um design token (usado para valores de fatura e despesas pendentes)
- `#6366f1` na linha 239 e um fallback para `cartao.cor` (cor personalizada do usuario) - nao e um token do sistema
- `text-muted-foreground`, `text-foreground`, `bg-muted/50`, `border-border` ja sao tokens

## Detalhes Tecnicos

Tres alteracoes simples de classe CSS no arquivo `src/components/cartoes/DetalhesCartaoDialog.tsx`:

1. Linha 269: `text-emerald-500` para `text-income`
2. Linha 447: `bg-emerald-500` para `bg-income`  
3. Linha 494: `bg-emerald-500/5` para `bg-income/5`

Os tokens `income` estao definidos em `src/index.css` como `--income: 152 60% 36%` (light) e `--income: 152 55% 42%` (dark), mapeados em `tailwind.config.ts`.


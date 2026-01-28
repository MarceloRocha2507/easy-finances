
# Plano: Corrigir Contraste dos Icones em "Maiores Transacoes"

## Problema Identificado

Na secao "Maiores Transacoes do Periodo" (paginas `/reports` e `/reports/categorias`), os icones estao usando:
- Classes `gradient-income` / `gradient-expense` para o fundo
- Cor `text-white` para o icone

Porem, esses gradientes sao **muito claros**:
```css
.gradient-income {
  @apply bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30;
}

.gradient-expense {
  @apply bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30;
}
```

Resultado: icone branco sobre fundo esverdeado/rosado muito claro = icone invisivel.

## Solucao

Usar cores **solidas e mais vibrantes** para os icones pequenos (40x40px), com contraste adequado:

| Tipo | Fundo Atual | Fundo Proposto |
|------|-------------|----------------|
| Income | `gradient-income` (emerald-50) | `bg-emerald-500` |
| Expense | `gradient-expense` (rose-50) | `bg-rose-500` |

Esta abordagem e consistente com outros componentes do sistema (como `StatCardPrimary`) que usam cores solidas para areas pequenas.

## Alteracoes Necessarias

### Arquivo 1: `src/pages/Reports.tsx`

**Secao "Maiores Transacoes do Periodo" (linhas 313-316):**

Antes:
```tsx
<div
  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
    transaction.type === 'income' ? 'gradient-income' : 'gradient-expense'
  }`}
>
  <IconComp className="w-5 h-5 text-white" />
</div>
```

Depois:
```tsx
<div
  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
    transaction.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
  }`}
>
  <IconComp className="w-5 h-5 text-white" />
</div>
```

### Arquivo 2: `src/pages/reports/RelatorioCategorias.tsx`

Verificar se a mesma secao "Maiores Transacoes" existe e aplicar a mesma correcao.

## Resultado Esperado

- Icones com fundo verde vibrante (emerald-500) para receitas
- Icones com fundo vermelho vibrante (rose-500) para despesas
- Icone branco com alto contraste e facilmente visivel
- Consistencia visual com outros icones do sistema

## Teste

- Navegar para `/reports` e verificar que todos os icones da secao "Maiores Transacoes" estao visiveis
- Verificar tanto transacoes de receita (verde) quanto despesa (vermelho)
- Testar no modo claro e escuro



# Melhorar responsividade mobile das seções do Dashboard

## 1. Receitas vs Despesas (`src/pages/Dashboard.tsx`)

### Titulo e legenda em linha unica no mobile
- Alterar o header para empilhar titulo e legenda verticalmente em telas pequenas (`flex-col sm:flex-row`)
- Reduzir fonte do titulo para `text-sm` no mobile via classe responsiva
- Legenda fica abaixo do titulo no mobile, alinhada a esquerda

### Grafico sem cortes
- Reduzir altura do grafico de `280px` para `220px` no mobile (via estado com `useIsMobile`)
- Reduzir `margin.left` e `YAxis width` para economizar espaco
- Usar `tick={{ fontSize: 10 }}` nos eixos para telas pequenas
- Adicionar `tickFormatter` no XAxis para abreviar meses (ex: "jan." em vez de "janeiro")

## 2. Proximas Faturas (`src/components/dashboard/ProximasFaturas.tsx`)

### Manter tudo em uma linha
- Adicionar `truncate` e `max-w-[80px] sm:max-w-none` no nome do cartao para evitar quebra
- Reduzir fonte do valor para `text-xs sm:text-sm` para telas muito pequenas
- Reduzir `gap-2` para `gap-1.5` entre valor e badge
- Adicionar `whitespace-nowrap` no container de valor + badge

## 3. Ultimas Compras (`src/components/dashboard/UltimasCompras.tsx`)

### Linha unica sem cortes
- Adicionar `truncate` no nome da descricao (ja tem) e limitar largura com `max-w-[120px] sm:max-w-[180px]`
- Reduzir avatar de `w-8 h-8` para `w-7 h-7 sm:w-8 sm:h-8` no mobile
- Adicionar `whitespace-nowrap` e `shrink-0` no container de valor + badge de parcelas
- Reduzir fonte do valor para `text-xs sm:text-sm`
- Link "Ver todas" recebe `pt-2 pb-1` para espaçamento adequado

## Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `src/pages/Dashboard.tsx` | Header responsivo do grafico, altura adaptativa, eixos menores no mobile |
| `src/components/dashboard/ProximasFaturas.tsx` | Truncate no nome, fonte menor no valor, whitespace-nowrap |
| `src/components/dashboard/UltimasCompras.tsx` | Limites de largura, avatar menor, whitespace-nowrap, espacamento do link |

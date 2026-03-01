

# Modernizar seções "Próximas Faturas" e "Últimas Compras"

## Próximas Faturas (`src/components/dashboard/ProximasFaturas.tsx`)

### Layout compacto
- Reduzir ícone de `w-10 h-10` para `w-8 h-8` e ícone interno de `h-5 w-5` para `h-4 w-4`
- Reduzir padding de `p-3` para `p-2.5`
- Reduzir `space-y-3` para `space-y-2`

### Remover data por extenso
- Eliminar a linha com `Clock` + `dataVencimento.toLocaleDateString`
- Manter apenas nome do cartao na linha principal, valor em vermelho e badge de dias

### Badge de dias com cores por urgencia
- Vermelho (`destructive`): dias restantes <= 3
- Laranja (`bg-amber-100 text-amber-700`): dias restantes <= 7
- Cinza (`secondary`): dias restantes > 7

### Tipografia
- Nome do cartao: `text-sm font-medium`
- Valor: `text-sm font-semibold text-expense`

---

## Ultimas Compras (`src/components/dashboard/UltimasCompras.tsx`)

### Avatar com iniciais coloridas
- Substituir icone de sacola por um circulo colorido com as 2 primeiras letras do estabelecimento
- Gerar cor a partir do hash do nome (paleta fixa de ~8 cores)

### Layout compacto em linha unica
- Nome do estabelecimento + cartao + data numa unica linha compacta
- Descricao como `text-sm font-medium`, cartao e data como `text-xs text-muted-foreground` inline

### Valor e parcelas lado a lado
- Valor alinhado a direita com badge de parcelas inline (ex: `R$ 84,00  8x`)

### Limite de 4 itens + "Ver todas"
- Fixar limite em 4 itens (mobile e desktop)
- Adicionar link "Ver todas" ao final apontando para `/cartoes`

### Estilo geral
- Reduzir padding e espacamento similar ao Proximas Faturas
- Icone avatar `w-8 h-8 rounded-full`

---

## Alteracoes no container (Dashboard.tsx)

Nenhuma alteracao necessaria -- as duas secoes ja estao lado a lado em `grid grid-cols-1 lg:grid-cols-2`.

## Cards gerais

Ambos os cards manterao `border-0 shadow-lg` existente (fundo branco com sombra). O titulo sera reduzido de `text-lg` para `text-base` para tipografia mais leve.

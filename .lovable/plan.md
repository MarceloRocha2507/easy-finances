
# Adicionar animacoes na pagina de Transacoes

## Situacao atual
A pagina ja tem `page-enter` no container principal, mas as secoes internas (stat cards, grupos de transacoes, linhas individuais) nao possuem animacoes stagger.

## Mudancas em `src/pages/Transactions.tsx`

### 1. Stat cards com stagger
Os 6 `StatCardMinimal` ja recebem uma prop `delay` que provavelmente adiciona animation-delay. Verificar se ja esta funcionando -- eles ja tem delays de 0 a 0.25s. Se o componente `StatCardMinimal` nao aplica a animacao, envolver o grid em `<AnimatedSection>`.

### 2. Secao de saldo inicial + metas
Adicionar classe `stagger-item` com `--stagger-index: 0` no card de saldo inicial.

### 3. Grupos de transacoes com stagger
Cada grupo (`div key={grupo.key}`) recebera a classe `stagger-item` com `--stagger-index` baseado no indice do grupo (0, 1, 2...).

### 4. Linhas de transacao dentro dos grupos
Cada `TransactionRow` e `FaturaCartaoRow` recebera um wrapper com `stagger-item` e `--stagger-index` baseado no indice dentro do grupo, limitado a 12 itens.

### 5. Tabs com transicao
Os botoes de tab ja tem `transition-colors`. Manter como esta.

### 6. LoadingList com pulse
Os skeletons ja usam `animate-pulse` via componente Skeleton. Manter.

## Implementacao tecnica

- Importar `AnimatedSection` e `AnimatedItem` de `@/components/ui/animated-section`
- Envolver o bloco de saldo inicial em `<AnimatedSection delay={0}>`
- Envolver o grid de stat cards em `<AnimatedSection delay={0.1}>`
- Nos grupos: cada grupo recebe `<AnimatedItem index={grupoIdx}>`
- Dentro de cada grupo: cada item recebe style `--stagger-index` no wrapper existente
- Na lista sem agrupamento: cada item recebe `<AnimatedItem index={itemIdx}>`

## Arquivos modificados
| Arquivo | Acao |
|---------|------|
| `src/pages/Transactions.tsx` | Editar - adicionar stagger nos stat cards, grupos e linhas |

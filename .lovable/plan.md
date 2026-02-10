

# Mensagens em Lote -- Organizadas e Somente com Despesas

## Problema Atual

1. As mensagens sao geradas para TODOS os cartoes selecionados, mesmo quando nao ha despesas no mes -- resultando em mensagens vazias ou com "0 compras"
2. A mensagem consolidada fica longa e desorganizada quando ha muitos cartoes

## Solucao

### 1. `src/components/cartoes/GerarMensagensLoteDialog.tsx` -- Filtrar cartoes sem despesas

**Na etapa de geracao:**
- Apos gerar as mensagens, filtrar os resultados que nao tem despesas (mensagem vazia ou total zerado)
- Mostrar apenas cartoes que efetivamente possuem compras no mes

**Na etapa de selecao:**
- Indicar visualmente quais cartoes tem despesas no mes (opcional, melhoria de UX)

### 2. `src/services/compras-cartao.ts` -- Retornar indicador de "sem despesas"

Modificar `gerarMensagemFatura` para retornar string vazia (`""`) quando nao ha parcelas no mes para o responsavel/cartao selecionado. Isso permite ao dialog de lote identificar e ocultar cartoes sem despesas.

Atualmente, se nao ha parcelas, a funcao ainda retorna uma mensagem com "Total: R$ 0,00". A mudanca e:
- Se `parcelasFiltradas.length === 0`, retornar `""` (string vazia)
- O dialog de lote filtra resultados com mensagem vazia

### 3. `src/components/cartoes/GerarMensagensLoteDialog.tsx` -- Mensagem consolidada mais organizada

A mensagem consolidada (ao copiar tudo) sera formatada de forma mais limpa:
- Separador visual mais curto entre cartoes
- Remover cartoes sem despesas do resultado
- Exibir contador de "X cartoes com despesas de Y selecionados" no resultado
- Se nenhum cartao tiver despesas, exibir aviso informativo

## Detalhes Tecnicos

### compras-cartao.ts -- gerarMensagemFatura

Adicionar verificacao no inicio da funcao apos filtrar parcelas:

```text
Se parcelasFiltradas.length === 0:
  retornar "" (string vazia)
```

Isso vale para todos os formatos (todos, resumido, detalhado). No formato "todos", verificar se o resumo por responsavel esta vazio.

### GerarMensagensLoteDialog.tsx

- Filtrar `resultados` para remover itens com `mensagem === ""` ou `erro === true`
- Mostrar badge informativo: "3 de 5 cartoes com despesas"
- Se todos os cartoes retornarem vazio, exibir estado vazio com icone e mensagem "Nenhum cartao possui despesas neste mes"

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/services/compras-cartao.ts` | Retornar string vazia quando nao ha parcelas |
| `src/components/cartoes/GerarMensagensLoteDialog.tsx` | Filtrar cartoes sem despesas e melhorar organizacao visual |


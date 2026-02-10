

# Gerar Mensagens em Lote -- Selecao de Cartoes e Responsavel

## Objetivo

Transformar o dialog de "Gerar Mensagens em Lote" em um fluxo de 2 etapas: primeiro o usuario seleciona quais cartoes e o responsavel, depois confirma e gera.

## Alteracao

### `src/components/cartoes/GerarMensagensLoteDialog.tsx` -- Reescrever com fluxo em 2 etapas

**Etapa 1 -- Selecao (tela inicial ao abrir)**
- Lista de cartoes com checkboxes individuais + checkbox "Selecionar todos" no topo
- Cada item mostra o indicador de cor do cartao e o nome
- Dropdown de responsavel usando `useResponsaveis()` (opcoes: "Todos" + lista de responsaveis ativos), similar ao `GerarMensagemDialog`
- Botao "Gerar Mensagens" (desabilitado se nenhum cartao selecionado)
- Exibir contagem: "X cartao(oes) selecionado(s)"

**Etapa 2 -- Confirmacao e Resultado**
- Ao clicar "Gerar", exibe loading e processa `gerarMensagemFatura` para cada cartao selecionado com o responsavel escolhido (usando `Promise.allSettled`)
- Passa `responsavelId` (null se "todos") e formato adequado para a funcao existente
- Exibe resultados consolidados exatamente como ja funciona hoje (ScrollArea com blocos por cartao, copiar individual, copiar tudo, WhatsApp)
- Botao "Voltar" para retornar a etapa de selecao

## Detalhes Tecnicos

- Estado `etapa`: "selecao" | "resultado"
- Estado `cartoesSelecionados`: `Set<string>` com os IDs marcados
- Estado `responsavelId`: string ("todos" ou ID do responsavel)
- Reutiliza `useResponsaveis()` de `src/services/responsaveis.ts`
- Usa componente `Checkbox` de `src/components/ui/checkbox.tsx`
- Usa `Select/SelectContent/SelectItem` para o dropdown de responsavel
- A geracao so dispara ao clicar o botao (nao mais no useEffect ao abrir)
- Ao fechar o dialog, reseta para etapa "selecao"

## Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/cartoes/GerarMensagensLoteDialog.tsx` | Adicionar fluxo de 2 etapas com selecao de cartoes (checkboxes) e responsavel (dropdown) |


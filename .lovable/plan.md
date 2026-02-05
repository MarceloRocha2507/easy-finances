
# Detalhes de Compra do Cartao de Credito

## Objetivo

Criar um modal de detalhes para compras do cartao de credito, similar ao `TransactionDetailsDialog` ja existente para transacoes, mas adaptado para o tipo `ParcelaFatura`.

## Abordagem

Criar um novo componente `DetalhesCompraCartaoDialog` que exibe todas as informacoes da compra/parcela ao clicar na linha da tabela, seguindo o mesmo design system do `TransactionDetailsDialog`.

## Componente: `DetalhesCompraCartaoDialog`

**Arquivo:** `src/components/cartoes/DetalhesCompraCartaoDialog.tsx`

**Dados exibidos (hierarquia visual):**

1. **Cabecalho** - Icone da categoria + descricao + badge de tipo (Estorno/Ajuste)
2. **Valor em destaque** - Valor da parcela com fundo colorido (vermelho para debito, verde para credito/estorno)
3. **Secao: Informacoes da Parcela**
   - Status (Paga / Pendente) com badge colorido
   - Parcela atual (ex: "3 de 12") com badge
   - Valor unitario da parcela
   - Mes de referencia
4. **Secao: Informacoes da Compra**
   - Data da compra
   - Valor total da compra (calculado: valor parcela x total parcelas)
   - Tipo de lancamento (Unica / Parcelada / Fixa)
   - Categoria (com cor e nome)
   - Responsavel
5. **Secao: Registro**
   - Ultima alteracao (tempo relativo)
   - ID da parcela

**Botoes de acao (rodape):**
- Fechar
- Editar (abre `EditarCompraDialog`)

## Integracao na Tabela (DespesasCartao.tsx)

- Adicionar estado `detalhesCompraOpen` e reutilizar `parcelaSelecionada`
- Tornar a linha da tabela (ou a celula de descricao) clicavel para abrir os detalhes
- No mobile, adicionar opcao "Ver detalhes" no menu de acoes (DropdownMenu)
- No desktop, ao clicar na linha abre o dialog diretamente

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/cartoes/DetalhesCompraCartaoDialog.tsx` | **Criar** - Novo componente de detalhes |
| `src/pages/DespesasCartao.tsx` | **Modificar** - Adicionar estado, tornar linhas clicaveis, importar dialog |

## Design

- Seguir o padrao visual do `TransactionDetailsDialog`: icone com fundo colorido, valor em destaque centralizado, secoes com separadores, layout de chave-valor
- Dialog com `sm:max-w-md`, `overflow-y-auto`, `max-h-[90vh]`, `overflow-x-hidden` (padrao global de modais)
- Cores: vermelho para valores positivos (despesa no cartao), verde para estornos/creditos
- Responsivo: funciona igualmente em mobile e desktop

## Interacao na Tabela

- Desktop: clicar na linha abre detalhes (exceto nas colunas de checkbox e acoes)
- Mobile: a linha inteira sera clicavel, substituindo a necessidade de botoes individuais que nao cabem na tela
- Os botoes de acao (editar, estornar, excluir) continuam disponiveis dentro do dialog ou via menu contextual

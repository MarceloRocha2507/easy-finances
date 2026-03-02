

# Vinculacao automatica entre transacoes de cartao e assinaturas

## Resumo

Criar um sistema que, ao registrar ou importar compras no cartao, verifica automaticamente se correspondem a assinaturas cadastradas. Quando encontra correspondencia, marca a assinatura como paga e vincula visualmente a compra do cartao.

## Mudancas no banco de dados

Adicionar colunas na tabela `assinaturas` para rastrear o vinculo com compras de cartao:

- `compra_cartao_id` (uuid, nullable) -- referencia a compra do cartao vinculada
- `cartao_id_pagamento` (uuid, nullable) -- qual cartao pagou
- `data_pagamento` (date, nullable) -- data exata do pagamento
- `valor_cobrado` (numeric, nullable) -- valor real cobrado no cartao
- `vinculo_automatico` (boolean, default false) -- se foi vinculado automaticamente

## Arquivos novos

### `src/services/vincular-assinaturas.ts`

Servico central com a logica de correspondencia:

- `verificarCorrespondencia(descricao, valor, mesReferencia, userId)` -- busca assinaturas ativas que correspondem
  - Nome: verifica se a descricao da compra contem o nome da assinatura (case-insensitive, sem acentos)
  - Valor: tolerancia de R$ 0,50
  - Periodo: mes/ano da transacao bate com o mes de `proxima_cobranca`
- `vincularAssinaturaAutomaticamente(assinaturaId, compraCartaoId, cartaoId, dataPagamento, valorCobrado)` -- executa o vinculo
  - Atualiza `proxima_cobranca` para o proximo ciclo
  - Preenche os campos de vinculo
- `verificarCorrespondenciaParcial(descricao, valor, mesReferencia, userId)` -- retorna matches com divergencia de valor

## Arquivos modificados

### `src/services/compras-cartao.ts` -- `criarCompraCartao`

Apos criar a compra com sucesso, chamar `verificarCorrespondencia`. Se encontrar match exato (nome + valor + periodo), vincular automaticamente. Se match parcial (nome + periodo mas valor diverge), nao vincular -- sera tratado na UI.

### `src/services/importar-compras-cartao.ts` -- `importarComprasEmLote`

Apos importar cada compra, executar a mesma verificacao. Acumular resultados de vinculacoes realizadas para exibir ao usuario.

### `src/hooks/useAssinaturas.ts`

- Expandir a interface `Assinatura` com os novos campos (`compra_cartao_id`, `cartao_id_pagamento`, `data_pagamento`, `valor_cobrado`, `vinculo_automatico`)
- Ajustar `marcarComoPaga` para **nao criar transacao duplicada** quando a assinatura ja esta vinculada a uma compra de cartao (a despesa ja existe no cartao)
- Adicionar query para buscar nome do cartao vinculado (join com `cartoes`)

### `src/pages/Assinaturas.tsx` -- Listagem

Na listagem de assinaturas, quando houver vinculo:
- Exibir badge "Pago via [nome do cartao]" em vez de apenas "Ativa"
- Mostrar data do pagamento e valor cobrado
- Mudar icone para indicar vinculo com cartao

Assinaturas sem vinculo no mes vigente permanecem como "pendente" normalmente.

### `src/components/assinaturas/DetalhesAssinaturaDialog.tsx`

Adicionar secao mostrando detalhes do vinculo quando existir:
- Nome do cartao
- Data do pagamento
- Valor cobrado
- Indicador se foi vinculo automatico

### `src/hooks/useTransactions.ts` e `src/hooks/useEconomia.ts`

Ajustar a logica de inclusao de assinaturas nos relatorios: se a assinatura ja tem `compra_cartao_id` preenchido (paga via cartao), **nao somar** nos relatorios pois a despesa ja esta contabilizada via parcelas do cartao. Apenas assinaturas ativas **sem vinculo** no periodo devem ser somadas.

## Fluxo completo

```text
Usuario registra/importa compra no cartao
  |
  v
Sistema busca assinaturas ativas do usuario
  |
  v
Para cada assinatura, verifica:
  - descricao contem nome? (ex: "SPOTIFY" em "Spotify Premium")
  - valor dentro de R$ 0,50 de tolerancia?
  - mes/ano corresponde ao proxima_cobranca?
  |
  +--> Match exato: vincula automaticamente, avanca proxima_cobranca
  |
  +--> Match parcial (valor diverge): nao vincula, sinalizacao futura
  |
  +--> Sem match: nada acontece
```

## Prevencao de dupla contagem

- Assinatura vinculada a cartao: despesa ja existe em `parcelas_cartao`, entao a assinatura NAO gera lancamento separado e NAO e somada nos relatorios
- Assinatura sem vinculo: contabilizada normalmente via query de assinaturas ativas (logica ja implementada)
- `marcarComoPaga` manual: se a assinatura ja tem vinculo com cartao, pula a criacao de transacao


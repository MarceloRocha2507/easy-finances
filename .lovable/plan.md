

# Gerador de Mensagens em Lote -- Novo Formato Compacto

## Objetivo

Substituir o formato atual das mensagens em lote por um template compacto e organizado, com cabecalho, compras agrupadas por cartao (max 2 por linha), e rodape com responsavel e total geral.

## Formato Final

```
📊 FATURAS - FEVEREIRO/2026

💳 Nubank [10/03]: R$ 1.250,00
   • Netflix: R$ 39,90 | Spotify: R$ 21,90
   • iFood: R$ 85,00 | Amazon: R$ 199,00

💳 Inter [15/03]: R$ 450,00
   • Uber: R$ 32,50

Responsavel: Joao | Total: R$ 1.700,00
```

## Alteracoes

### 1. `src/services/compras-cartao.ts` -- Nova funcao `gerarMensagemLote`

Criar uma funcao dedicada que recebe uma lista de cartao IDs, mes de referencia e responsavel, e retorna UMA UNICA mensagem consolidada no template especificado.

**Logica:**
- Buscar parcelas de todos os cartoes selecionados de uma vez
- Filtrar por responsavel (se especificado)
- Excluir cartoes sem despesas
- Agrupar por cartao
- Para cada cartao: montar linha "💳 [Nome] [[DD/MM vencimento]]: R$ [total]"
- Listar compras com "•", maximo 2 por linha separadas por " | "
- Abreviar nomes de compras com mais de 20 caracteres (cortar + "...")
- Cabecalho: "📊 FATURAS - [MES]/[ANO]" (mes em maiusculas)
- Rodape: "Responsavel: [Nome] | Total: R$ [TOTAL GERAL]"
- Se responsavel = "todos", rodape mostra apenas "Total: R$ [TOTAL GERAL]"
- Se nenhum cartao tiver despesas, retornar string vazia

### 2. `src/components/cartoes/GerarMensagensLoteDialog.tsx` -- Simplificar resultado

**Etapa de selecao:** Permanece igual (checkboxes de cartoes + dropdown de responsavel).

**Etapa de resultado:** Mudar completamente:
- Em vez de blocos individuais por cartao, exibir UMA UNICA mensagem consolidada no Textarea
- Remover os blocos individuais com copiar por cartao
- Manter apenas 2 botoes: "Copiar" e "Enviar WhatsApp"
- Botao "Voltar" para retornar a selecao
- Estado vazio se nenhum cartao tiver despesas

A geracao chama `gerarMensagemLote` em vez de chamar `gerarMensagemFatura` para cada cartao individualmente.

## Detalhes Tecnicos

### gerarMensagemLote (nova funcao)

```
Parametros:
  - cartaoIds: string[]
  - mesReferencia: Date
  - responsavelId: string | null

Retorno: Promise<string> (mensagem unica ou "" se sem despesas)

Passos:
1. Para cada cartaoId, buscar parcelas + info do cartao (nome, dia_vencimento)
2. Filtrar por responsavelId se nao null
3. Ignorar cartoes com 0 parcelas
4. Montar cabecalho com mes/ano em maiusculas
5. Para cada cartao com despesas:
   - Calcular total do cartao
   - Formatar data vencimento DD/MM
   - Agrupar compras em pares de 2 por linha
   - Abreviar nomes > 20 chars
6. Montar rodape com nome do responsavel e total geral
```

### GerarMensagensLoteDialog.tsx

- Remover estado `resultados` (array) -- usar `mensagemFinal` (string unica)
- Remover logica de copiar individual e copiar tudo separados
- Simplificar para: 1 Textarea + 2 botoes

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/services/compras-cartao.ts` | Adicionar funcao `gerarMensagemLote` com template compacto |
| `src/components/cartoes/GerarMensagensLoteDialog.tsx` | Simplificar resultado para mensagem unica consolidada |



# Gerar Mensagens em Lote para Todos os Cartoes

## Objetivo

Adicionar um botao "Gerar Mensagens em Lote" na pagina de Cartoes que gera a mensagem de fatura de todos os cartoes ativos simultaneamente e exibe o resultado consolidado em um dialog.

## Alteracoes

### 1. Novo componente: `src/components/cartoes/GerarMensagensLoteDialog.tsx`

Dialog que:
- Recebe a lista de cartoes e o mes de referencia como props
- Ao abrir, chama `gerarMensagemFatura(cartaoId, mesReferencia, null, "todos")` para cada cartao em paralelo
- Exibe loading enquanto gera
- Mostra as mensagens agrupadas por cartao, cada uma em um bloco com o nome do cartao como titulo
- Botao "Copiar Tudo" que copia todas as mensagens concatenadas (separadas por linhas)
- Botao "Enviar WhatsApp" que abre WhatsApp com a mensagem consolidada
- Cada bloco individual tambem tera um botao de copiar individual

### 2. Pagina `src/pages/Cartoes.tsx`

- Importar o novo dialog
- Adicionar estado `loteOpen` para controlar a abertura do dialog
- Adicionar botao "Gerar Mensagens" no header (desktop: botao visivel, mobile: item no dropdown de acoes)
- O botao so aparece se houver cartoes cadastrados
- Passa `cartoes` e `mesReferencia` para o dialog

## Fluxo do Usuario

```text
Pagina Cartoes -> Clica "Gerar Mensagens" -> Dialog abre
  -> Mensagens sao geradas em paralelo (loading por cartao)
  -> Resultado consolidado exibido
  -> Usuario pode copiar tudo ou copiar individualmente
  -> Usuario pode enviar via WhatsApp
```

## Detalhes Tecnicos

- Reutiliza a funcao existente `gerarMensagemFatura` de `src/services/compras-cartao.ts` com formato "todos"
- Usa `Promise.allSettled` para gerar todas em paralelo sem falhar se um cartao der erro
- Segue os padroes visuais existentes do `GerarMensagemDialog` (Textarea readonly, botoes Copiar/WhatsApp)
- Usa ScrollArea para quando houver muitos cartoes




# Corrigir Calculo de Valores no "Dividir Valores"

## Problema Identificado

A funcao `calcularResumoPorResponsavel` em `src/services/compras-cartao.ts` sempre define `is_titular: false` (linha 219), ignorando o campo `is_titular` que ja vem do banco de dados atraves do JOIN com a tabela `responsaveis`.

Isso causa dois problemas:

1. **O titular nunca e identificado** -- a variavel `titular` no dialog e sempre `undefined`
2. **O calculo "Valor que eu pago"** no modo `dividir_valores` retorna 0 (porque tenta ler `titular.valorCustom` de um objeto inexistente)
3. **A secao "Eu (titular)"** nos modos normais tambem nao aparece

## Causa Raiz

Em `listarParcelasDaFatura`, o campo `is_titular` e buscado do banco (linha 159: `responsavel:responsaveis(id, nome, apelido, is_titular)`) mas **nunca e mapeado** no retorno (linhas 182-184 so mapeiam `id`, `nome`, `apelido`).

Depois, em `calcularResumoPorResponsavel`, a propriedade `is_titular` e sempre `false`.

## Solucao

### 1. `src/services/compras-cartao.ts` -- Propagar `is_titular` nos dados

**ParcelaFatura type**: Adicionar campo `is_titular?: boolean`

**listarParcelasDaFatura**: Mapear `is_titular` do responsavel no retorno:
```
is_titular: p.compra?.responsavel?.is_titular || false,
```

**calcularResumoPorResponsavel**: Usar o valor real vindo da parcela em vez de `false`:
```
is_titular: parcelas que pertencem a esse responsavel -> pegar is_titular da primeira parcela
```

### 2. Nenhuma alteracao necessaria no dialog

O `PagarFaturaDialog.tsx` ja usa `is_titular` corretamente para separar titular dos outros. O problema e apenas que o dado nunca chegava com o valor correto.

## Arquivos a modificar

| Arquivo | Alteracao |
|---|---|
| `src/services/compras-cartao.ts` | Mapear `is_titular` em `listarParcelasDaFatura` e usa-lo em `calcularResumoPorResponsavel` |


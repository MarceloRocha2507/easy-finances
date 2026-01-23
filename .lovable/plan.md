
Objetivo
- Fazer com que compras parceladas importadas (ex: “Parcela 4/8”) gerem todas as parcelas futuras automaticamente (4/8, 5/8, 6/8...) e não apenas 1 parcela no mês atual.

Diagnóstico (por que “não está parcelando” mesmo com mês correto)
- A criação de parcelas está correta no serviço `criarCompraCartao()` (ele cria do `parcelaInicial` até `parcelas`).
- O problema está antes, no parsing do texto em `parseLinhasCompra()`:
  - Para evitar o bug do valor “8,175.00”, foi adicionado um regex que captura `X/Y` junto com o trecho final (`4/8,175.00 eu`).
  - Depois o código remove `matchFinal[0]` do final para extrair a descrição:
    - Isso remove também o `4/8` da descrição.
  - Resultado:
    - A descrição vira algo como “Nortmotos - Parcela” (sem “4/8”).
    - A função `detectarParcela()` não encontra mais `4/8`, então seta `tipoLancamento="unica"`, `parcelas=1`, `parcelaInicial=1`.
    - A importação cria apenas 1 parcela.

Evidência no banco (ambiente de teste)
- Existem compras como “Nortmotos - Parcela” com `parcelas=1` e `parcela_inicial=1`, confirmando que o “4/8” foi removido antes da detecção.

Mudanças propostas (código)
1) Ajustar o parsing do “valor + responsável” para NÃO consumir o `X/Y`
Arquivo: `src/services/importar-compras-cartao.ts`
Trecho: bloco do `matchFinal` dentro de `parseLinhasCompra()`

- Substituir a abordagem atual (que inclui `\d+/\d+` no match) por um regex principal que:
  - Exige delimitador antes do valor (vírgula ou ponto-e-vírgula), evitando o bug do “8,175.00”
  - Captura o valor com `[\d.,]+` (suporta `175.00`, `102,25`, `1.234,56`)
  - Captura responsável como “último token” com `([^\s]+)` (mais robusto que `(\w+)`, pois aceita acentos)

Exemplo de regex principal:
- `[,;]\s*([\d.,]+)\s+([^\s]+)\s*$`

2) Manter os fallbacks existentes
- Continuar com fallback “se não tiver vírgula/; antes do valor”:
  - `\s([\d.,]+)\s+([^\s]+)\s*$`
- Isso garante que formatos sem vírgula antes do valor continuem funcionando.

3) Extrair a descrição sem usar “length - matchFinal[0].length” quando possível
- Em vez de remover o final por comprimento (que depende do conteúdo do match), preferir:
  - `resto = resto.slice(0, matchFinal.index).trim()`
- E manter fallback seguro caso `index` venha `undefined`:
  - `const idx = matchFinal.index ?? (resto.length - matchFinal[0].length);`
  - `resto = resto.slice(0, idx).trim();`
- Assim, a descrição mantém “Parcela 4/8” intacto e `detectarParcela()` volta a funcionar.

Como validar (passo a passo no app)
1) Ir em “Importar Compras” e colar uma linha como:
   - `2026-01-05,Nortmotos - Parcela 4/8,175.00 eu`
2) Clicar “Processar dados”
3) Conferir no preview (coluna “Tipo”) que aparece o badge `4/8` (e não “Única”).
4) Importar
5) Ir em “Despesas” do cartão e navegar os meses seguintes:
   - No mês da fatura base deve aparecer `4/8`
   - Nos meses seguintes devem aparecer `5/8`, `6/8`, etc.

Observação importante (para seus dados atuais)
- Como algumas importações anteriores foram criadas como compra única (`parcelas=1`), elas não vão “virar parceladas” automaticamente.
- Caminho mais simples: usar a opção já existente de “Excluir fatura do mês” (para o mês importado) e reimportar após essa correção.

Riscos e cuidados
- O regex novo foi desenhado para aceitar valores com vírgula/ponto e milhares, mas sempre exigindo um delimitador antes do valor (ou caindo no fallback por espaço).
- A captura do responsável como “última palavra” continua igual, só fica mais permissiva (aceita caracteres fora de `\w`).

Entrega
- 1 alteração principal em `src/services/importar-compras-cartao.ts` no bloco de parsing final.
- Sem mudanças de banco de dados.

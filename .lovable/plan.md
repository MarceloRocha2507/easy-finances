
<contexto-e-diagnostico>
Você está certo: hoje a verificação de duplicatas não pega bem o caso “parcelas soltas” (ex.: importar 5/12 e depois 6/12 da mesma compra). Isso acontece porque a regra atual de duplicata compara exatamente:

- `descricao` (normalizada)
- `valor_total` (± R$ 0,10)
- `mes_inicio` == `mesFatura` selecionado
- `parcela_inicial` == `parcelaInicial`

Esse critério falha quando a MESMA compra aparece no extrato com parcelas diferentes (5/12, 6/12, 7/12…), porque cada linha importada vira uma “compra mãe” nova e cada uma gera parcelas futuras novamente, causando:
- total “muito alto”
- parcelas duplicadas somando em meses como fevereiro/março etc.

Exemplo real que já apareceu no banco:
- “Mp *Aliexpress - Parcela 5/12” (mes_inicio 2026-02-01, parcela_inicial 5) gera 5..12 de fev..set
- “Mp *Aliexpress - Parcela 6/12” (mes_inicio 2026-03-01, parcela_inicial 6) gera 6..12 de mar..set
Resultado: mar..set ficam duplicados.

Objetivo do ajuste: detectar duplicata por “compra base”, e não por “parcela específica”.
</contexto-e-diagnostico>

<objetivo>
Antes de importar, o preview deve marcar como duplicata qualquer linha que:
1) já exista no banco como a mesma compra base (mesmo “contrato” de parcelamento), mesmo que seja outra parcela; e/ou
2) esteja duplicada dentro do próprio texto colado (mesma compra base aparecendo em várias linhas).

E isso precisa acontecer tanto ao “Processar dados” quanto ao mudar “Fatura”, e também imediatamente antes de efetivar a importação (último checkpoint).
</objetivo>

<plano-de-implementacao>
1) Ajustar o algoritmo de duplicatas para usar “fingerprint de compra base”
   - Arquivo: `src/services/importar-compras-cartao.ts`
   - Criar um “identificador” (fingerprint) que representa a compra parcelada original, independentemente de qual parcela veio no texto.
   - Componentes do fingerprint:
     - `descricao_base`: descrição sem o sufixo de parcela (ex.: remover “- Parcela 6/12”, “- 2/3”, “(2/3)”, etc.), normalizada (lowercase/sem acentos/espaços).
     - `parcelas_total`: total de parcelas (ex.: 12).
     - `valor_total`: (com tolerância), pois é o “valor real do contrato”.
     - `mes_base`: mês teórico da parcela 1. Cálculo:
       - a linha importada aponta para o mês da parcela atual (`mesFatura` da linha).
       - se a linha é `parcelaInicial = N`, então:
         - `mes_base = mesFatura - (N - 1) meses`.
       - Ex.: parcela 6 em 2026-03 → mes_base = 2025-10.

   - Atualizar `verificarDuplicatas`:
     - Query deve trazer também `parcelas` (hoje não traz) além de `descricao, valor_total, parcela_inicial, mes_inicio`.
     - Para cada compra existente:
       - calcular `descricao_base` (strip sufixo parcela + normalizar)
       - calcular `mes_base_existente = mes_inicio - (parcela_inicial - 1) meses`
       - gerar fingerprint
     - Para cada item do preview:
       - calcular `descricao_base` e `mes_base_preview` a partir de `mesFatura` e `parcelaInicial`
       - gerar fingerprint
       - marcar duplicata se existir fingerprint compatível (com tolerância de valor_total ± R$0,10).

   - Melhorar o tooltip de duplicata:
     - além da descrição encontrada, incluir também algo como:
       - “Encontrado no banco: parcela_inicial X, mes_inicio YYYY-MM”
       - “Compra base: YYYY-MM (parcela 1)”
     - Isso deixa claro por que está duplicando “meses futuros”.

2) Detectar duplicatas dentro do próprio lote (texto colado)
   - Arquivo: `src/services/importar-compras-cartao.ts` (ou helper no mesmo arquivo)
   - Antes mesmo de consultar o banco, agrupar as linhas do preview pelo mesmo fingerprint de compra base.
   - Regra:
     - manter apenas 1 linha “principal” por fingerprint (preferencialmente a menor `parcelaInicial` do grupo, pois ela cobre mais meses sem gerar sobreposição).
     - marcar as outras como `possivelDuplicata = true` com `duplicataInfo` apontando para a “linha principal do lote”.
   - Benefício:
     - mesmo sem banco, evita importar 5/12 e 6/12 juntos, que é justamente o caso que infla valores.

3) Colocar um “último checkpoint” antes de importar (para garantir que aparece antes de efetivar)
   - Arquivo: `src/pages/cartoes/ImportarCompras.tsx`
   - No `handleImportar()`:
     - rodar novamente `verificarDuplicatas(cartaoId, previewData)` imediatamente antes de enviar
     - atualizar `previewData` com o resultado
     - se houver duplicatas não forçadas (`possivelDuplicata && !forcarImportacao`):
       - não prosseguir com importação
       - mostrar um alerta/toast claro: “Existem compras duplicadas no preview. Revise/ajuste a fatura ou marque ‘Importar’ nas que deseja forçar.”
   - Isso atende exatamente “isso deve aparecer antes de ser realizado a importacao”, mesmo que o usuário não tenha reparado no badge.

4) Ajustes de UX para deixar o problema evidente
   - Arquivo: `src/pages/cartoes/ImportarCompras.tsx`
   - No header do preview:
     - manter o badge de duplicatas (já existe), mas também exibir um `Alert` quando `stats.duplicatas > 0` com explicação curta:
       - “Duplicatas podem gerar parcelas repetidas em meses futuros e inflar a fatura.”
   - No texto “Já existe compra similar”:
     - diferenciar “Duplicata no banco” vs “Duplicata no lote” (opcional, mas recomendável) para o usuário entender a origem.

5) (Recomendação extra) Limpeza das duplicatas já existentes no banco
   - Isso explica “valor muito alto” mesmo após corrigir o importador: o histórico pode já estar duplicado.
   - Eu posso criar uma ferramenta de diagnóstico/limpeza (em uma nova solicitação) para:
     - listar grupos duplicados por fingerprint (igual ao que vamos fazer no import)
     - oferecer ação segura de “desativar” compras duplicadas (ex.: set `ativo=false`) e assim remover as parcelas da fatura
     - isso deve ser feito com cuidado e revisão (idealmente com prévia).
</plano-de-implementacao>

<criterios-de-aceite>
- Ao colar linhas com “Parcela 5/12” e “Parcela 6/12” do mesmo item, o preview marca uma delas como duplicata (no lote) antes de importar.
- Ao importar novamente um item já cadastrado (mesmo que seja outra parcela), o preview marca como duplicata (no banco) antes de importar.
- Ao clicar “Importar”, se existir qualquer duplicata não forçada, o sistema impede a importação e mostra o aviso (checkpoint final).
- Após ajustar a “Fatura” no seletor, a marcação de duplicata continua correta (já há re-verificação; ela passará a funcionar melhor com o fingerprint novo).
</criterios-de-aceite>

<impacto-tecnico>
Arquivos que serão alterados:
- `src/services/importar-compras-cartao.ts`
  - enriquecer `verificarDuplicatas` (novo fingerprint por compra base)
  - adicionar utilitários: strip de sufixo de parcela + cálculo de `mes_base`
  - adicionar detecção de duplicatas dentro do lote (agrupamento)
- `src/pages/cartoes/ImportarCompras.tsx`
  - adicionar checkpoint final no `handleImportar`
  - alertas mais explícitos quando houver duplicatas

Risco/observação:
- A tolerância de valor (± R$0,10) será mantida, mas podemos ajustar para ± R$0,01 se você preferir ser mais rígido.
</impacto-tecnico>

<perguntas-rapidas-para-confirmar-assumptions>
Como não posso executar mais verificações agora (modo time-critical), vou assumir:
- Quando uma linha vem como “Parcela 6/12”, ela representa a mesma compra original e não deveria criar um “novo contrato” separado.
Se isso estiver correto, o fingerprint por compra base é o caminho certo.
</perguntas-rapidas-para-confirmar-assumptions>

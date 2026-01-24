
<contexto-e-diagnostico>
Você descreveu que, após registrar um “adiantamento”, “quase todas as compras sumiram” na tela de despesas do mês.

Pelos pontos que já observei no código, isso pode acontecer por dois motivos principais:

1) <b>Filtro de Status</b>: se você estiver com o filtro “Pendentes” ativo, e o adiantamento tiver marcado várias parcelas como “pagas”, elas deixam de aparecer (parece que sumiram, mas só mudaram de status).
2) <b>Modelo atual do adiantamento</b>: hoje o adiantamento está implementado como “marcar parcelas como pagas (em ordem)” + criar uma despesa no saldo real. Esse modelo é perigoso para “pagamento parcial” porque:
   - pagamento parcial não corresponde a “quais compras foram pagas”
   - visualmente dá a sensação de que “apagou” itens, quando na prática mudou o status

Objetivo desta correção: <b>o adiantamento não deve esconder a lista de compras</b>. Ele deve reduzir o saldo da fatura sem transformar várias compras em “pagas” automaticamente (ou, no mínimo, deixar isso opcional e bem claro).</contexto-e-diagnostico>

<objetivo>
1) Evitar que compras “sumam” após adiantamento.
2) Transformar “Adiantar” em um <b>pagamento parcial</b> da fatura (reduz o saldo da fatura), sem mexer no status individual das compras por padrão.
3) Adicionar <b>transparência e segurança</b>: mostrar exatamente o que aconteceu e permitir desfazer quando possível.</objetivo>

<plano-de-implementacao>
<step>1) Ajuste imediato de UX (para impedir “sumiu” por filtro)
- Arquivo: <code>src/pages/DespesasCartao.tsx</code>
- Adicionar um <b>Alert</b> quando:
  - o filtro de status estiver em “Pendentes” <i>e</i> existir qualquer item “Pago” no mês
- Esse alert vai explicar: “Você está filtrando pendentes. Itens pagos não aparecem.” e terá um botão: “Mostrar todos”.
- Opcional: ao concluir um adiantamento, forçar automaticamente o filtro de status para “Todos” (para o usuário enxergar que nada sumiu).</step>

<step>2) Corrigir o modelo do adiantamento (pagamento parcial de fatura)
- Arquivo: <code>src/services/compras-cartao.ts</code>
- Alterar <code>adiantarFatura()</code> para NÃO marcar parcelas como pagas por padrão.
- Em vez disso, registrar o adiantamento como um <b>crédito na fatura</b> (uma linha negativa do mês) usando o mesmo padrão já existente de “ajuste crédito”:
  - criar um registro em <code>compras_cartao</code> com <code>tipo_lancamento = "ajuste"</code> (ou outro rótulo se já for permitido) e descrição “Adiantamento …”
  - criar a parcela do mês com <code>valor = -valorAdiantamento</code>
  - isso reduz o saldo da fatura sem “sumir” compras
- Manter a criação da transação no saldo real (despesa) como já existe.</step>

<step>3) Ajustar os totais do topo para considerar valores negativos corretamente
- Arquivo: <code>src/pages/DespesasCartao.tsx</code>
- Hoje os totais usam <code>Math.abs()</code> e isso faz crédito/estorno virar “mais gasto”, o que distorce.
- Atualizar os cálculos para somar <b>o valor real</b> (<code>p.valor</code>) e:
  - mostrar “Pendente” como <code>max(0, saldo)</code>
  - se o saldo ficar negativo (adiantou mais do que devia), mostrar um chip/linha “Crédito a favor: R$ X”
- Isso também melhora o comportamento para Estornos/Ajustes em geral.</step>

<step>4) Tornar “marcar parcelas como pagas” uma opção avançada (se você quiser manter)
- Arquivo: <code>src/components/cartoes/AdiantarFaturaDialog.tsx</code>
- Adicionar um switch:
  - “Marcar compras como pagas automaticamente”
  - padrão: <b>desligado</b>
- Se ligado, aí sim aplicar a lógica antiga (selecionar parcelas e marcar paga=true), mas:
  - exibir claramente “X parcelas serão marcadas como pagas”
  - após sucesso, alternar filtro para “Todos” para o usuário enxergar que foi só mudança de status.</step>

<step>5) Segurança: “Desfazer adiantamento” (recomendado)
- Para o novo modelo (crédito na fatura), desfazer fica simples:
  - deletar a compra/parcela de ajuste criada + deletar a transação de despesa correspondente
- Implementação:
  - fazer <code>adiantarFatura()</code> retornar IDs criados (compra_id / parcela_id / transaction_id)
  - no toast de sucesso, mostrar botão “Desfazer” por alguns segundos
- Isso evita sustos e te dá reversão rápida se digitou valor errado.</step>
</plano-de-implementacao>

<criterios-de-aceite>
1) Após registrar um adiantamento, a lista de compras do mês <b>continua aparecendo</b> (não “some”).
2) O adiantamento passa a reduzir o saldo da fatura via uma linha de crédito (valor negativo) e não via “pagar compras” automaticamente (por padrão).
3) O topo (Pendente/Pago/Total) reflete corretamente ajustes/estornos/adiantamentos (sem inflar com valores negativos).
4) Se o usuário estiver filtrando “Pendentes” e existirem itens “Pagos”, aparece aviso com botão “Mostrar todos”.
5) (Se implementado) O toast do adiantamento oferece “Desfazer”.</criterios-de-aceite>

<perguntas-rapidas-para-confirmar>
Como não posso perguntar via formulário agora, confirme quando puder:
- Você quer que “Adiantar” funcione como <b>pagamento parcial da fatura</b> (reduz saldo) sem escolher compras específicas (recomendado)?
- Ou você realmente quer que ele “pague” compras individualmente (marcar como paga) e aceite que elas saiam do filtro “Pendentes”?</perguntas-rapidas-para-confirmar>

<impacto-tecnico>
Arquivos que serão alterados:
- <code>src/services/compras-cartao.ts</code> (mudar comportamento do adiantamento; opcional retorno de IDs)
- <code>src/components/cartoes/AdiantarFaturaDialog.tsx</code> (opção avançada + melhorias de feedback)
- <code>src/pages/DespesasCartao.tsx</code> (alerta de filtro + correção de totais e possivelmente ajuste automático do status após adiantamento)

Migração de banco:
- Provavelmente <b>não necessária</b> se registrarmos como “ajuste/crédito” usando tabelas existentes.</impacto-tecnico>

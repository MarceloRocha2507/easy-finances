# Plano: corrigir o "Desconsiderar despesa" em todo o sistema

## Diagnóstico
A funcionalidade "Desconsiderar do saldo" **já existe** na lista de transações (menu de cada despesa), e o campo `desconsiderada` já está no banco. O problema é que ela **só está sendo respeitada parcialmente**:

- ✅ Saldo Estimado, "A Pagar" e "A Receber" hoje **excluem** desconsideradas.
- ❌ **Saldo Disponível** (saldo final atual) **não exclui** — soma todas as despesas com status `completed`, mesmo as desconsideradas. É exatamente isso que produz o erro que você descreveu: marcar despesa como paga + lançar receita logo depois deixa o saldo errado, porque a despesa "ignorada" continua afetando o caixa.
- ❌ Gráfico **"Receitas vs Despesas"** do dashboard inclui desconsideradas.
- ❌ Gráfico **"Despesas por Categoria"** inclui desconsideradas.
- ❌ Receitas/Despesas exibidas do mês no dashboard incluem desconsideradas.
- ❌ Possivelmente: Comparativo Mensal, Gastos Diários, alertas e calendário (preciso conferir cada um).

## O que vou implementar

### 1) Tornar "Desconsiderar" verdadeiramente global
Despesa marcada como desconsiderada passa a ser ignorada **em todos** os cálculos e gráficos financeiros, sem alterar `status` no banco (mantemos a flag, sem efeito colateral em "paga/pendente").

Pontos que serão corrigidos:
- Saldo Disponível / Saldo Real (corrige o bug do saldo final).
- Receitas e Despesas do mês exibidas no dashboard.
- Gráfico "Receitas vs Despesas" (anual).
- Gráfico "Despesas por Categoria".
- Comparativo Mensal.
- Gastos Diários, Calendário e alertas — auditarei e ajustarei se incluírem desconsideradas.
- "Total Geral de Despesas" do mês.

### 2) Tornar a opção mais visível e clara
Hoje a opção fica só no menu de três pontinhos da linha. Vou:
- Manter o toggle existente, mas garantir o rótulo claro: "Desconsiderar do saldo" / "Reconsiderar no saldo".
- Adicionar um indicador visual mais explícito na própria linha quando a transação estiver desconsiderada (badge "Desconsiderada" + opacidade reduzida — parte já existe).
- Mostrar a opção também no modal de detalhes da transação, para não depender só do menu.

### 3) Garantir consistência também para receitas
A opção hoje aparece em despesas e receitas. Ela continuará funcionando para os dois, e ambas serão removidas dos cálculos quando marcadas.

### 4) Validação
- Criar uma despesa, marcar como paga, depois marcar como "Desconsiderar": Saldo Disponível volta ao valor anterior.
- Lançar uma receita logo em seguida: Saldo Disponível reflete só a receita.
- Conferir gráficos: a despesa desconsiderada some das barras e do donut.

## Detalhes técnicos
- Sem migração de banco: a coluna `transactions.desconsiderada` já existe.
- Mudanças concentradas em `src/hooks/useTransactions.ts` (queries do dashboard, gráficos e categoria) e nos componentes de dashboard/calendário/alertas que somam transações.
- Não vou trocar `status='completed'` para `pending` ao desconsiderar — manter a flag desacoplada evita efeitos colaterais em parcelamentos, recorrência, faturas e relatórios.
- Memória do projeto será atualizada para refletir que `desconsiderada` agora afeta **todos** os totais (não só o estimado).
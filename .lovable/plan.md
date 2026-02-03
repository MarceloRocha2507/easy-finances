
## Diagnóstico (por que ainda acontece)
O card que você está vendo na rota **/cartoes** NÃO usa o componente `src/components/cartoes/CartaoCard.tsx` (onde a correção foi aplicada).

Na página **`src/pages/Cartoes.tsx`** existe **outro** `function CartaoCard(...)` interno (duplicado) que calcula:

- **Fechamento** = próxima ocorrência do dia de fechamento (ok)
- **Vencimento** = próxima ocorrência do dia de vencimento **independente** (bug)

Isso gera exatamente o seu caso:
- Fechamento dia 2 → próximo fechamento vira **02/03/2026**
- Vencimento dia 10 → como ainda não passou em fevereiro, vira **10/02/2026**

Ou seja: a correção foi feita no arquivo certo, mas **na tela errada** (porque há dois “CartaoCard” diferentes no projeto).

---

## Objetivo do ajuste
Na tela **/cartoes**, fazer o “Vencimento” ser calculado **a partir da data de Fechamento exibida**, garantindo que:
- se o fechamento for **02/03**, o vencimento seja **10/03** (no seu exemplo)
- nunca apareça vencimento “no mês anterior” ao fechamento mostrado

---

## Mudanças propostas (implementação)
### 1) Corrigir o cálculo no `src/pages/Cartoes.tsx`
No `function CartaoCard({ cartao, ... })` (o componente interno da página):

1. Manter o cálculo de `dataFechamento` como “próxima ocorrência”.
2. Trocar o cálculo de `dataVencimento` para ser **relativo ao fechamento**:
   - Se `dia_vencimento > dia_fechamento` → vencimento no **mesmo mês** do fechamento
   - Se `dia_vencimento <= dia_fechamento` → vencimento no **mês seguinte** ao fechamento
3. Adicionar um `clampDiaNoMes(ano, mesIndex, dia)` (igual ao que já existe no outro componente) para evitar datas inválidas (ex.: dia 31 em mês com 30).
4. Ajustar o cálculo de “em X dia(s)” para usar início do dia (evita off-by-one por horário).

Resultado esperado no seu exemplo:
- Fechamento: **02/03/2026**
- Vencimento: **10/03/2026**

---

### 2) (Recomendado) Evitar duplicação: criar util compartilhado de datas
Para não acontecer de novo (corrigir em um lugar e esquecer o outro), mover a lógica para um helper único, por exemplo:

- `src/lib/cartaoCiclo.ts` (novo) ou `src/lib/dateUtils.ts` (existente), exportando algo como:
  - `calcularProximoFechamento(diaFechamento, baseDate)`
  - `calcularVencimentoAPartirDoFechamento(diaFechamento, diaVencimento, dataFechamento)`

E então:
- `src/pages/Cartoes.tsx` passa a usar o helper
- `src/components/cartoes/CartaoCard.tsx` também passa a usar o mesmo helper (mantendo tudo consistente)

---

### 3) (Opcional, mas ajuda muito) “Preview” no cadastro/edição do cartão
Para reduzir confusão no cadastro (porque o seletor é “dia do mês”, não “data fixa”), mostrar abaixo dos seletores um preview:
- “Próximo fechamento: dd/mm/aaaa”
- “Próximo vencimento: dd/mm/aaaa”

Isso faz o usuário ver na hora que ao escolher “Dia 2” e “Dia 10” o próximo ciclo fica em março, por exemplo.

---

## Arquivos impactados
- **Obrigatório**: `src/pages/Cartoes.tsx` (corrigir o `CartaoCard` interno)
- **Recomendado**:
  - `src/lib/dateUtils.ts` (ou novo `src/lib/cartaoCiclo.ts`) para unificar a regra
  - `src/components/cartoes/CartaoCard.tsx` para consumir o helper e manter consistência
- **Opcional (UX)**:
  - `src/components/cartoes/NovoCartaoDialog.tsx`
  - `src/components/cartoes/EditarCartaoDialog.tsx`

---

## Como vamos validar (checklist)
1. Em **/cartoes**, cartão com **fechamento dia 2** e **vencimento dia 10**:
   - Se hoje já passou do dia 2 do mês atual, deve mostrar fechamento no mês seguinte e vencimento no mesmo mês do fechamento.
2. Testar caso inverso:
   - fechamento dia 25, vencimento dia 5 → vencimento deve cair no mês seguinte ao fechamento.
3. Atualizar a página com recarregamento completo:
   - como o app é PWA, pode aparecer um prompt de atualização; aceitar a atualização para garantir que a nova versão carregou.

---

## Risco e mitigação
- Risco: outros lugares do app continuarem mostrando datas com regra antiga.
- Mitigação: centralizar a regra num helper compartilhado e reutilizar.


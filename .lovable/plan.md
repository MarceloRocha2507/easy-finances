

# Simplificar cards de cartões no Dashboard

## O que muda

Nos cards individuais de cada cartão dentro da seção "Cartões de Crédito" do Dashboard, remover informações detalhadas e manter apenas o essencial:

**Manter:**
- Icone + Nome do cartão + Bandeira
- Valor da fatura atual (em vermelho)
- Barra de progresso do limite usado

**Remover dos cards individuais:**
- Linha "Disponível" com valor em verde
- Texto "X% do limite"
- Texto "Venc. dia X"
- Badges de alerta de limite alto e vencimento próximo

O resumo geral no topo (Faturas, Limite, Disponível) permanece inalterado.

## Alterações técnicas

### Arquivo: `src/components/dashboard/CartoesCredito.tsx`

Simplificar o componente interno `CartaoCard`:

1. Remover do bloco de valores: a div "Disponível" e seu valor
2. Remover a div inferior com "X% do limite" e "Venc. dia X"
3. Remover os badges de alerta (AlertTriangle para limite alto e Clock para vencimento próximo) do header
4. Manter: header com icone/nome/bandeira, linha de fatura, e barra de progresso
5. Reduzir padding e espaçamento para um card mais compacto

O resultado será um card mais limpo com ~3 linhas de informação: nome, fatura e barra de uso.


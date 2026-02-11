
# Corrigir Saldo Real apos remocao de transacoes duplicadas

## Problema

Ao deletar as 3 transacoes de despesa "Acerto de Fatura" (R$ 80 + R$ 182,49 + R$ 433,51 = R$ 696), o saldo subiu R$ 696 porque o saldo inicial do perfil tinha sido calibrado quando essas despesas ainda existiam.

Formula do saldo: Saldo Inicial + Receitas - Despesas

- Antes: -1.176,04 + receitas - (despesas + 696) = 0
- Depois: -1.176,04 + receitas - despesas = +696

## Solucao

Atualizar o saldo inicial no perfil do usuario:

- **De**: -R$ 1.176,04
- **Para**: -R$ 1.872,04 (-1176.04 - 696.00)

Isso e uma correcao de dados no banco. Nenhum arquivo de codigo precisa ser alterado.

## Resultado

- Saldo Real voltara a R$ 0,00
- Saldo Estimado tambem sera corrigido
- Receitas e Despesas do mes nao serao afetadas

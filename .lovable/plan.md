

# Simulador de Compra

## Resumo

Criar uma funcionalidade completa de simulacao de compra que permite ao usuario projetar o impacto financeiro de uma compra nos proximos 12 meses, com grafico comparativo, tabela detalhada, veredicto da Fina IA e acoes pos-simulacao (lancar como despesa futura ou salvar simulacao).

## Tabela do banco de dados

Criar tabela `simulacoes_compra` para persistir simulacoes salvas:

| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid | NOT NULL |
| nome | text | NOT NULL |
| valor_total | numeric | NOT NULL |
| forma_pagamento | text | NOT NULL |
| parcelas | integer | 1 |
| cartao_id | uuid | NULL |
| category_id | uuid | NULL |
| data_prevista | date | NOT NULL |
| valor_seguranca | numeric | 0 |
| veredicto | text | NULL |
| created_at | timestamptz | now() |

RLS: SELECT, INSERT, DELETE restritos a `auth.uid() = user_id`.

## Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/SimuladorCompra.tsx` | Pagina principal do simulador com formulario, grafico, tabela e acoes |
| `src/hooks/useSimuladorCompra.ts` | Hook com logica de projecao financeira e CRUD de simulacoes salvas |
| `src/components/simulador/FormularioSimulacao.tsx` | Formulario de entrada com campos de nome, valor, forma de pagamento, parcelas, cartao, categoria e data |
| `src/components/simulador/GraficoProjecao.tsx` | Grafico de barras/linha comparativo "sem compra" vs "com compra" usando Recharts |
| `src/components/simulador/TabelaProjecao.tsx` | Tabela mes a mes com receitas, despesas, parcela e saldo final |
| `src/components/simulador/VeredictFinaIA.tsx` | Card com diagnostico da Fina IA em linguagem natural |
| `src/components/simulador/HistoricoSimulacoes.tsx` | Lista de simulacoes salvas com opcao de recarregar ou excluir |

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Adicionar rota `/transactions/simulador` |
| `src/components/sidebar/SidebarNav.tsx` | Adicionar item "Simulador" no submenu de Transacoes (icone `Calculator`) |
| `src/pages/Dashboard.tsx` | Adicionar botao de acao rapida "Simular Compra" |

## Logica de projecao (useSimuladorCompra.ts)

O hook recebe os dados da simulacao e calcula a projecao para os proximos 12 meses. Para cada mes futuro:

1. **Saldo base**: Comecar com o saldo disponivel atual (de `useCompleteStats`)
2. **Receitas recorrentes**: Somar transacoes do tipo income com `status = 'completed'` e `tipo_lancamento = 'fixa'` que se repetem mensalmente
3. **Despesas recorrentes**: Somar transacoes do tipo expense com `status = 'completed'` e `tipo_lancamento = 'fixa'`
4. **Assinaturas ativas**: Somar valor normalizado mensal de cada assinatura ativa
5. **Despesas futuras ja lancadas**: Transacoes pending com due_date nos meses futuros
6. **Parcela da compra simulada**: Distribuir nos meses corretos conforme forma de pagamento:
   - A vista: desconto total no mes da compra
   - Parcelado cartao: valor_total / parcelas em cada mes a partir da data da compra
   - Boleto parcelado: mesmo calculo do parcelado

### Calculo por mes

```text
Para cada mes M (1 a 12):
  receitasPrevistas[M] = soma das receitas recorrentes do mes
  despesasPrevistas[M] = soma das despesas recorrentes + assinaturas + futuras do mes
  parcelaCompra[M] = valor da parcela se o mes estiver no range
  
  saldoSemCompra[M] = saldoAnterior + receitasPrevistas[M] - despesasPrevistas[M]
  saldoComCompra[M] = saldoAnterior + receitasPrevistas[M] - despesasPrevistas[M] - parcelaCompra[M]
```

O hook retorna:
- `projecao`: array de 12 objetos com { mes, receitasPrevistas, despesasPrevistas, parcelaCompra, saldoSemCompra, saldoComCompra }
- `salvarSimulacao()`: persiste no banco
- `lancarComoDespesa()`: cria transacao(oes) futura(s) no sistema
- `simulacoesSalvas`: lista de simulacoes salvas
- `excluirSimulacao()`: remove do banco

## Veredicto da Fina IA

O veredicto sera gerado pela edge function `ai-chat` existente. O frontend envia um prompt estruturado com os dados da projecao e recebe o diagnostico. Exemplo de prompt:

```text
Analise esta simulacao de compra e de um veredicto em portugues:
- Compra: {nome}, valor: R$ {valor}
- Forma: {formaPagamento}, {parcelas}x
- Projecao de saldo dos proximos 12 meses: [array de saldos]
- Valor de seguranca: R$ {valorSeguranca}
Responda com um dos 3 niveis (aprovado/possivel com risco/nao recomendado) e explique.
```

A chamada sera feita via `supabase.functions.invoke('ai-chat')` com streaming para exibir o diagnostico progressivamente.

## Componentes visuais

### FormularioSimulacao.tsx
- Input: Nome da compra
- Input com mascara: Valor total (R$)
- Select: Forma de pagamento (A vista, Parcelado no cartao, Boleto parcelado)
- Select condicional: Cartao (aparece se parcelado no cartao, usa dados de `useCartoes`)
- Select condicional: Numero de parcelas (2 a 48)
- DatePicker: Data prevista
- Select: Categoria (usando `useCategories` filtrado por expense)
- Input: Valor de seguranca minimo (opcional, default R$ 0)
- Botao "Simular"

### GraficoProjecao.tsx
- Grafico de barras agrupadas usando Recharts (BarChart)
- Duas series: "Sem compra" (cor cinza/azul) e "Com compra" (cor primaria/vermelha)
- Eixo X: meses (Mar, Abr, Mai...)
- Eixo Y: valor em R$
- Linha horizontal pontilhada no valor de seguranca (se definido)
- Barras vermelhas nos meses com saldo negativo

### TabelaProjecao.tsx
- Colunas: Mes | Receitas | Despesas | Parcela | Saldo sem compra | Saldo com compra
- Linhas com fundo vermelho claro onde saldo com compra < 0
- Linhas com fundo amarelo onde saldo com compra < valor de seguranca
- Rodape com totais

### VeredictFinaIA.tsx
- Card com icone de IA (Sparkles) e borda colorida conforme nivel:
  - Verde (aprovado): borda green-500
  - Amarelo (risco): borda amber-500
  - Vermelho (nao recomendado): borda red-500
- Texto do veredicto renderizado com ReactMarkdown
- Botao "Analisar novamente"

### HistoricoSimulacoes.tsx
- Collapsible section "Simulacoes salvas"
- Lista de cards com nome, valor, data, veredicto resumido
- Botoes: "Recarregar" (preenche o formulario), "Excluir"

## Navegacao e acesso

### Menu lateral
Adicionar ao submenu de Transacoes:
```typescript
{ icon: Calculator, label: "Simulador", href: "/transactions/simulador" }
```
Ordem final: Visao Geral, Importar, Despesas Futuras, Assinaturas, Simulador

### Dashboard
Adicionar um botao de acao rapida no topo ou proximo aos stat cards:
```tsx
<Button variant="outline" onClick={() => navigate('/transactions/simulador')}>
  <Calculator className="h-4 w-4 mr-2" />
  Simular Compra
</Button>
```

## Fluxo do usuario

```text
1. Usuario abre Simulador (menu ou dashboard)
2. Preenche formulario e clica "Simular"
3. Sistema calcula projecao e exibe grafico + tabela
4. Fina IA gera veredicto (streaming)
5. Usuario pode:
   a. "Confirmar e lancar" -> cria transacao(oes) pending no sistema
   b. "Salvar simulacao" -> persiste no banco para consulta futura
   c. "Simular novamente" -> volta ao formulario com dados preenchidos
```

## Responsividade

- Formulario em grid de 2 colunas no desktop, 1 coluna no mobile
- Grafico com scroll horizontal no mobile
- Tabela com scroll horizontal no mobile
- Botoes de acao empilhados no mobile



# Modulo de Gerenciamento de Assinaturas Ativas

## Resumo

Criar um modulo completo de assinaturas recorrentes (Netflix, Spotify, etc.) com cadastro, listagem, dashboard de resumo e integracao com o fluxo de transacoes existente. Design consistente com o sistema premium fintech ja estabelecido.

## Tabela do banco de dados

Criar tabela `assinaturas` com RLS por `user_id`:

| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid | NOT NULL |
| nome | text | NOT NULL |
| categoria | text | 'outros' |
| valor | numeric | NOT NULL |
| moeda | text | 'BRL' |
| frequencia | text | 'mensal' |
| data_inicio | date | CURRENT_DATE |
| proxima_cobranca | date | NOT NULL |
| metodo_pagamento | text | 'cartao_credito' |
| status | text | 'ativa' |
| observacoes | text | NULL |
| category_id | uuid | NULL (FK para categories) |
| data_cancelamento | date | NULL |
| data_pausa | date | NULL |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS: CRUD restrito a `auth.uid() = user_id`.

## Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Assinaturas.tsx` | Pagina principal com listagem, filtros, dashboard de resumo e acoes |
| `src/hooks/useAssinaturas.ts` | Hook com queries e mutations (CRUD, pausar, cancelar, marcar como paga) |
| `src/components/assinaturas/NovaAssinaturaDialog.tsx` | Dialog de cadastro/edicao |
| `src/components/assinaturas/ExcluirAssinaturaDialog.tsx` | Confirmacao de exclusao |
| `src/components/assinaturas/DetalhesAssinaturaDialog.tsx` | Detalhes e historico |
| `src/components/assinaturas/index.ts` | Barrel export |

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Adicionar rota `/assinaturas` com lazy loading |
| `src/components/sidebar/SidebarNav.tsx` | Adicionar item "Assinaturas" no menu com icone `Repeat` |

## Estrutura da pagina

### Header
- Titulo "Assinaturas" com subtitulo em muted gray
- Botao "Nova Assinatura" alinhado a direita

### Dashboard de resumo (3 cards em grid)
- **Gasto Mensal**: soma de todas assinaturas ativas convertidas para mensal
- **Projecao Anual**: gasto mensal x 12
- **Ativas**: contagem de assinaturas com status 'ativa'

### Grafico de pizza
- Distribuicao por categoria usando `PieChartWithLegend` existente

### Card de alerta
- Assinaturas com renovacao nos proximos 7 dias, estilo clean com icone `AlertCircle`

### Filtros
- Status: Todas, Ativa, Pausada, Cancelada
- Categoria: Streaming, Software, Saude, Educacao, Outros
- Ordenacao: valor, nome, proxima cobranca

### Listagem
- Cards com: icone neutro em quadrado `#F3F4F6`, nome em bold `#111827`, categoria em `#9CA3AF`, valor em bold, data de renovacao
- Destaque sutil para assinaturas com renovacao em 7 dias (borda esquerda `#F59E0B`)
- Hover `#F9FAFB`, separacao por `border-b`
- Menu de acoes: Editar, Pausar/Reativar, Cancelar, Marcar como Paga, Excluir

## Logica "Marcar como Paga"

Ao marcar renovacao como paga:
1. Calcular proxima data de cobranca com base na frequencia (mensal +1 mes, trimestral +3, semestral +6, anual +12)
2. Atualizar `proxima_cobranca` na tabela `assinaturas`
3. Inserir uma transacao na tabela `transactions` com:
   - `type: 'expense'`
   - `status: 'completed'`
   - `amount: valor da assinatura`
   - `description: "Assinatura - {nome}"`
   - `category_id: category_id da assinatura`
   - `date: data atual`
   - `paid_date: data atual`
4. Invalidar queries de transacoes e dashboard

## Logica Pausar/Cancelar

- **Pausar**: muda status para 'pausada', registra `data_pausa`
- **Cancelar**: muda status para 'cancelada', registra `data_cancelamento`
- **Reativar**: muda status para 'ativa', limpa datas, recalcula `proxima_cobranca`

## Menu lateral

Adicionar item "Assinaturas" com icone `Repeat` abaixo de "Metas" nos itens principais do `mainMenuItems`, com href `/assinaturas`.

## Detalhes tecnicos

### Calculo de conversao para valor mensal
```text
mensal: valor x 1
trimestral: valor / 3
semestral: valor / 6
anual: valor / 12
```

### Calculo de proxima cobranca ao marcar como paga
```typescript
const mesesPorFrequencia = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };
const novaData = new Date(proximaCobranca);
novaData.setMonth(novaData.getMonth() + mesesPorFrequencia[frequencia]);
```

### Categorias fixas (enum no front)
Streaming, Software, Saude, Educacao, Outros

### Metodos de pagamento fixos
Cartao de Credito, Debito Automatico, Boleto, Pix

### Cache invalidation apos mutations
`['assinaturas']`, `['transactions']`, `['transaction-stats']`, `['complete-stats']`, `['dashboard-completo']`

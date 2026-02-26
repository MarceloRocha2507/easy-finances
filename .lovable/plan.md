
# Radar de Gastos Invisiveis

## Resumo

Adicionar uma funcionalidade que analisa o historico de transacoes do usuario para detectar cobrancas recorrentes nao cadastradas como assinatura. A analise roda no frontend usando os dados ja disponiveis, com persistencia de itens ignorados no banco de dados.

## Tabela do banco de dados

Criar tabela `radar_ignorados` para persistir falsos positivos descartados pelo usuario:

| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid | NOT NULL |
| descricao_pattern | text | NOT NULL |
| created_at | timestamptz | now() |

RLS: CRUD restrito a `auth.uid() = user_id`.

## Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useRadarGastos.ts` | Hook com logica de deteccao de recorrencias e gerenciamento de ignorados |
| `src/components/assinaturas/RadarGastosInvisiveis.tsx` | Componente da secao Radar com card de alerta, lista de deteccoes e acoes |

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Assinaturas.tsx` | Importar e renderizar `RadarGastosInvisiveis` entre o header e os summary cards |
| `src/components/sidebar/SidebarNav.tsx` | Adicionar badge numerico no item "Assinaturas" com contagem de gastos invisiveis |
| `src/components/assinaturas/NovaAssinaturaDialog.tsx` | Aceitar props opcionais para pre-preencher dados do radar |
| `src/components/assinaturas/index.ts` | Exportar `RadarGastosInvisiveis` |

## Logica de deteccao (useRadarGastos.ts)

O hook busca todas as transacoes de despesa dos ultimos 12 meses e agrupa por descricao normalizada (lowercase, trim). Para cada grupo com 2+ ocorrencias:

1. **Verificar valor similar**: variacao de ate 5% entre o menor e maior valor do grupo
2. **Estimar frequencia**: calcular intervalo medio entre datas e mapear para semanal (~7d), mensal (~30d), trimestral (~90d) ou anual (~365d)
3. **Excluir ja cadastradas**: comparar descricao com nomes de assinaturas existentes (match parcial, case-insensitive)
4. **Excluir ignoradas**: filtrar pela tabela `radar_ignorados`

Retorna array de deteccoes com: `descricao`, `valorMedio`, `frequenciaEstimada`, `totalOcorrencias`, `custoAnualEstimado`, `ultimaData`.

O hook tambem expoe:
- `ignorar(descricao)`: insere na tabela `radar_ignorados`
- `analisarAgora()`: invalida cache e refaz a query
- `totalDetectados`: contagem para badge

### Calculo de custo anual estimado
```text
semanal: valorMedio x 52
mensal: valorMedio x 12
trimestral: valorMedio x 4
anual: valorMedio x 1
```

## Componente RadarGastosInvisiveis.tsx

### Estrutura visual

1. **Card de alerta** (quando ha deteccoes): fundo gradiente sutil com icone `Sparkles`, texto "A Fina IA analisou suas transacoes e encontrou N possiveis assinaturas nao cadastradas", e botao "Analisar agora" a direita

2. **Lista de deteccoes**: cada item em card com:
   - Nome da transacao (descricao)
   - Valor medio formatado
   - Frequencia estimada (badge: Mensal, Trimestral, etc.)
   - Total gasto nos ultimos 12 meses
   - **Custo anual estimado** em destaque (texto maior, cor primaria)
   - Botao "Adicionar como Assinatura" (abre NovaAssinaturaDialog pre-preenchido)
   - Botao "Ignorar" (com confirmacao simples)

3. **Estado vazio**: mensagem "Nenhum gasto invisivel detectado. Suas assinaturas estao em dia!"

### Pre-preenchimento do formulario

Ao clicar "Adicionar como Assinatura", abrir `NovaAssinaturaDialog` com:
- `nome`: descricao da transacao
- `valor`: valor medio detectado
- `frequencia`: frequencia estimada
- Demais campos com defaults normais

## Badge no menu lateral

No `SidebarNav.tsx`, importar `useRadarGastos` e renderizar um badge numerico (circulo pequeno vermelho/amber) ao lado do label "Assinaturas" quando `totalDetectados > 0`. Usar o componente `NotificationBadge` ja existente ou um span inline.

## Fluxo de dados

```text
useTransactions (12 meses) + useAssinaturas + radar_ignorados
  -> useRadarGastos (algoritmo de deteccao no frontend)
    -> RadarGastosInvisiveis (UI)
    -> SidebarNav badge (contagem)
```

Nao ha necessidade de edge function pois a analise e feita no frontend com dados ja carregados. A atribuicao visual a "Fina IA" e apenas cosmetica.

## Detalhes de implementacao

### Normalizacao de descricao
```typescript
const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
```

### Tolerancia de valor (5%)
```typescript
const similar = (min: number, max: number) => max > 0 && (max - min) / max <= 0.05;
```

### Estimativa de frequencia
```typescript
const avgDays = totalDaysBetweenFirstAndLast / (occurrences - 1);
if (avgDays <= 10) return 'semanal';
if (avgDays <= 45) return 'mensal';
if (avgDays <= 120) return 'trimestral';
return 'anual';
```

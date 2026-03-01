

# Redesign Premium Fintech do Dashboard

Redesign completo de todos os componentes do dashboard para seguir uma estetica premium fintech minimalista, com cores reservadas apenas para sinais semanticos.

## Componentes a alterar (10 arquivos)

### 1. `src/components/dashboard/AlertasInteligentes.tsx`
- Remover cards individuais coloridos
- Substituir por barra unica compacta: fundo #FFFBEB, borda esquerda 3px solid #D97706, texto #92400E (13px)
- Se houver multiplos alertas, colapsar sob "X alertas" com Collapsible expandivel
- Botao de fechar em #9CA3AF
- Remover Card/CardContent, usar div simples

### 2. `src/pages/Dashboard.tsx` — Bloco "Resultado do Mes" (linhas 157-186)
- Remover fundo verde/vermelho (#F0FDF4 / #FEF2F2)
- Usar card branco padrao: border 1px #E5E7EB, border-radius 12px
- Label "Resultado do Mes" em #6B7280, 12px
- Valor em bold #111827, cor semantica apenas no valor (#16A34A positivo, #DC2626 negativo)
- Subtitulo em #9CA3AF, 11px
- Remover icones CheckCircle/AlertTriangle coloridos
- Layout inline (horizontal) em vez de centralizado vertical

### 3. `src/components/dashboard/StatCardMinimal.tsx`
- Ja esta bem proximo do target — ajustar icone para usar fundo #F3F4F6 (quadrado 28x28, border-radius 6px), stroke #9CA3AF
- Adicionar hover shadow sutil: `hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]`
- Confirmar que border-radius esta 10px e border #E5E7EB

### 4. `src/components/dashboard/ContasAPagar.tsx`
- Remover fundos amarelos das linhas (bg-[hsl(210,20%,98%)])
- Linhas separadas por 1px #F3F4F6
- Labels "Faturas de Cartao" e "Contas Pendentes" como uppercase #9CA3AF, 11px
- Valores em #DC2626
- Footer "Total a Pagar": remover fundo rosa (#FEF2F2) e borda vermelha (#FCA5A5)
- Substituir por linha limpa com borda top 1px, icone AlertTriangle em #D97706 (stroke, pequeno)
- Container branco com 1px border #E5E7EB

### 5. `src/components/dashboard/ComparativoMensal.tsx`
- Remover badge verde com fundo (pill com bgColor)
- Mostrar percentual como texto bold inline: #16A34A para reducao, #DC2626 para aumento
- Remover banner "Parabens!" verde — substituir por linha muted simples
- Remover banner de aviso amarelo — substituir por texto muted
- Labels "Mes Atual" e "Mes Anterior" em #9CA3AF, valores bold #111827
- Remover fundos bg-muted/50 dos blocos de valor — usar apenas texto

### 6. `src/components/dashboard/GastosDiarios.tsx`
- Mudar cor da linha/area de #6366f1 para #111827 (ou #3B82F6)
- Remover gradiente de area preenchida (linearGradient) — usar apenas linha
- Mudar AreaChart para LineChart (sem fill)
- Grid lines em #F3F4F6
- Tooltip branco com 1px border #E5E7EB
- Labels "Media diaria" e "Maior gasto" em #6B7280, valores bold #111827

### 7. `src/components/dashboard/CartoesCredito.tsx`
- Remover fundos coloridos dos icones (style backgroundColor com cor do cartao)
- Icones em quadrado #F3F4F6 (border-radius 6px), stroke #6B7280
- Resumo: labels em #9CA3AF, valores em #111827, "Disponivel" em #16A34A
- Progress bar 4px, track #F3F4F6
- Remover fundo bg-secondary/50 do resumo — usar texto plano
- "Venc. dia X" em #9CA3AF, 11px

### 8. `src/components/dashboard/ProximasFaturas.tsx`
- Remover quadrados coloridos de icone (backgroundColor com cor da bandeira)
- Icones em quadrado neutro #F3F4F6, stroke #6B7280
- Nome do banco bold #111827, data em #9CA3AF
- Valor em #DC2626
- Countdown "X dias" como pill neutro: fundo #F3F4F6, texto #374151, 11px
- Se vencido: fundo #FEF2F2, texto #DC2626
- Remover border-0 shadow-lg do Card — usar 1px border #E5E7EB
- Remover fundo amber para urgentes

### 9. `src/components/dashboard/UltimasCompras.tsx`
- Remover fundo colorido do icone (bg-primary/10)
- Icone em quadrado neutro #F3F4F6, stroke #6B7280
- Nome bold #111827, metadata em #9CA3AF 12px
- Valor em #111827 (neutro)
- Separador 1px #F3F4F6 entre linhas (border-b em vez de space-y)
- Remover border-0 shadow-lg — usar 1px border #E5E7EB

### 10. `src/components/dashboard/MetasEconomia.tsx`
- Nome da meta bold #111827
- Progress bar 4px, track #F3F4F6, fill #111827 (quando < 80%), #16A34A (quando >= 80%)
- "R$ X de R$ Y" em #6B7280, 12px
- "Faltam R$ X" em #9CA3AF
- Botao "+ Nova" como text link em #6B7280 (sem outline)
- Remover fundos coloridos das linhas de meta (bg-income/5, border-income/20)
- Remover icones coloridos de Target — usar icone neutro em #F3F4F6

### 11. `src/components/dashboard/PieChartWithLegend.tsx`
- Container branco, 1px border #E5E7EB, border-radius 12px (ja esta proximo)
- Titulo bold #111827
- Empty state com icone stroke muted e texto #9CA3AF

### 12. Bar Chart no `Dashboard.tsx` (linhas 283-349)
- Confirmar cores das barras: Receitas #16A34A, Despesas #DC2626 (muted, nao neon)
- Grid lines em #F3F4F6
- Axis labels em #9CA3AF, 11px
- Tooltip limpo branco com 1px border

## Regras globais aplicadas
- Nenhum fundo colorido em cards ou linhas
- Cor apenas como sinal: vermelho para negativo, verde para positivo/completo, amber para avisos
- Todos os icones stroke, cinza neutro, exceto com significado semantico
- Containers: 1px #E5E7EB border, border-radius 12px, fundo branco
- Tipografia: bold #111827 para valores, regular #6B7280 para labels, small #9CA3AF para metadata


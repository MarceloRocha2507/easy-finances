

# Redesign: Cards de Cartao de Credito - Visual Premium Fintech

## Objetivo

Redesenhar o componente `CartaoCard` dentro de `src/pages/Cartoes.tsx` (linhas 312-471) para um visual limpo e premium, estilo Stripe/Revolut, removendo bordas coloridas, fundos pasteis e decoracoes desnecessarias.

## Alteracoes

### Arquivo: `src/pages/Cartoes.tsx` (componente CartaoCard, linhas 341-470)

**Container do card:**
- Remover a barra colorida superior (`<div className="h-2" style=.../>`)
- Substituir o Card por um container com: fundo branco, borda 1px `#E5E7EB`, border-radius 12px, box-shadow `0 2px 6px rgba(0,0,0,0.06)`
- Estilo: `bg-white dark:bg-[#1a1a1a] border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-[12px] shadow-[0_2px_6px_rgba(0,0,0,0.06)]`

**Header do cartao:**
- Icone com fundo neutro `#F3F4F6` (sem cor do cartao)
- Nome em bold `#111827`, bandeira em `#9CA3AF` uppercase
- Badge "Paga"/"Aberta" como pill minimal: fundo `#DCFCE7` com texto `#15803D` (11px) para paga, fundo `#F3F4F6` com texto `#6B7280` para aberta

**Secao de datas:**
- Container com fundo `#F9FAFB`, borda 1px `#E5E7EB`, border-radius 10px
- Labels em `#6B7280`, valores em `#111827`, "em X dia(s)" em `#9CA3AF`

**Barra de uso do limite:**
- Track em `#E5E7EB`
- Cor da barra: verde `#16A34A` (< 60%), amber `#D97706` (60-85%), vermelho `#DC2626` (> 85%)
- Percentual em bold `#111827`

**Linha Limite/Usado/Disponivel:**
- "Limite" sempre em `#111827`
- "Usado" em `#D97706` se > 60%, `#DC2626` se > 85%, senao `#111827`
- "Disponivel" em `#16A34A` se disponivel > 20% do limite, senao `#111827`

**Footer da fatura:**
- Remover fundos coloridos (emerald/red)
- Usar fundo `#F9FAFB` com borda superior 1px `#E5E7EB`
- Icone em `#9CA3AF`
- Label "Fatura ..." em `#6B7280`
- Valor em bold `#111827` (sem cor verde/vermelha no valor)

### Dark mode

Todas as cores hardcoded terao equivalentes dark:
- `#111827` -> `text-[#111827] dark:text-[#F9FAFB]`
- `#F9FAFB` bg -> `bg-[#F9FAFB] dark:bg-[#111827]/30`
- `#E5E7EB` border -> `border-[#E5E7EB] dark:border-[#2a2a2a]`
- `#6B7280` -> `text-[#6B7280] dark:text-[#9CA3AF]`

### Resultado

- Cards uniformes, limpos, sem bordas coloridas ou fundos pasteis
- Cor usada apenas como sinal semantico (barra de limite, valores criticos)
- Visual premium e estruturado, consistente com o design do StatCardMinimal
- Compativel com dark mode


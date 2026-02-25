

# Aplicar visual premium ao CartaoCard standalone

## Objetivo

Alinhar o componente `src/components/cartoes/CartaoCard.tsx` com o mesmo visual premium ja aplicado nos cards da pagina `Cartoes.tsx`, garantindo consistencia visual em todo o sistema.

## Alteracoes

### Arquivo: `src/components/cartoes/CartaoCard.tsx`

**Container (linha 110-112):**
- De: `className="p-5 border rounded-md bg-card cursor-pointer hover:bg-secondary/30 transition-colors"`
- Para: `className="cursor-pointer bg-card border border-border rounded-[12px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all overflow-hidden"`
- Mover padding para um wrapper interno `<div className="p-5">`

**Header (linhas 114-134):**
- Icone: fundo neutro `bg-muted` com `rounded-[10px]`, sem cor customizada via style
- Nome: `font-semibold text-foreground`
- Bandeira: `text-[11px] uppercase tracking-wide text-muted-foreground`
- Badge de status: pill minimal com `rounded-full`, usando `bg-emerald-100 text-emerald-700` para "Fechada"/"Paga" e `bg-muted text-muted-foreground` para "Aberta". Font `text-[11px]`. Alerta "Limite critico" como `bg-red-100 text-red-700`

**Secao de datas (linhas 158-175):**
- Envolver em container com `p-3 rounded-[10px] bg-muted/50 border border-border`
- Labels em `text-[11px] text-muted-foreground`
- Valores em `text-sm font-medium text-foreground`
- "em X dia(s)" em `text-[11px] text-muted-foreground/70`

**Barra de uso (linhas 177-200):**
- Track: `bg-border` ao inves de `bg-secondary`
- Cor da barra semantica (ja existente, manter logica): verde < 60%, amber 60-85%, vermelho > 85%
- Percentual em `font-bold text-foreground`
- Remover alerta "Limite alto" com icone vermelho (redundante com a barra semantica)

**Valores Limite/Usado/Disponivel (linhas 202-218):**
- Layout: `grid-cols-3 text-center`
- Labels: `text-[11px] text-muted-foreground`
- Limite: sempre `text-foreground font-semibold`
- Usado: cor condicional — vermelho se > 85%, amber se > 60%, senao `text-foreground`
- Disponivel: verde se disponivel > 20% do limite, senao `text-foreground`. Remover classe fixa `text-income`

**Cores da barra (linhas 79-84):**
- Atualizar valores HSL para corresponder exatamente aos usados em `Cartoes.tsx`:
  - Verde: `hsl(142, 71%, 45%)` (era `hsl(152, 60%, 36%)`)
  - Amber: `hsl(45, 93%, 47%)` (ja igual)
  - Vermelho: `hsl(0, 72%, 51%)` (era `hsl(0, 65%, 51%)`)

## Resultado

- O `CartaoCard` standalone tera visual identico ao card inline da pagina `Cartoes.tsx`
- Consistencia total: mesmos border-radius, shadows, cores semanticas, tipografia e espacamento
- Dark mode compativel via classes Tailwind existentes (`text-foreground`, `bg-muted`, `border-border`)

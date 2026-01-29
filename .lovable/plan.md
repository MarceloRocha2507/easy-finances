
# Plano: Correção de Responsividade na Página de Transações

## Problemas Identificados (baseado na screenshot)

### 1. TransactionRow - Linha de Detalhes Cortando
**Problema**: A linha inferior com "Ontem, 09:06 • D..." está sendo cortada porque há muita informação horizontal:
- Data/hora
- Separador "•"
- Categoria
- Vencimento (se pendente)
- Saldo (já escondido em mobile)

O separador "•" entre a data e a categoria está ocupando espaço desnecessário em mobile, e a categoria está truncando de forma estranha.

### 2. Badges de Status/Parcelas
**Problema**: Os badges "Pendente", "1/12", etc. podem estar empurrando o conteúdo e causando overflow.

---

## Alterações Detalhadas

### Arquivo: `src/pages/Transactions.tsx`

#### 1. Simplificar linha de detalhes em mobile (linhas 990-1002)

**Antes:**
```tsx
<div className="flex items-center gap-2">
  <p className="text-sm text-muted-foreground">
    {formatTransactionDay(transaction.date, transaction.created_at)}
  </p>
  <span className="text-muted-foreground/50">•</span>
  <p className="text-sm text-muted-foreground truncate">
    {transaction.category?.name || 'Sem categoria'}
  </p>
  {transaction.due_date && isPending && (
    <span className="text-xs text-muted-foreground">
      • Vence {format(parseISO(transaction.due_date), "dd/MM", { locale: ptBR })}
    </span>
  )}
  ...
</div>
```

**Depois:**
```tsx
<div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
  <span>
    {formatTransactionDay(transaction.date, transaction.created_at)}
  </span>
  {/* Categoria - esconder em mobile, mostrar em sm+ */}
  <span className="hidden sm:contents">
    <span className="text-muted-foreground/50">•</span>
    <span className="truncate max-w-[100px]">
      {transaction.category?.name || 'Sem categoria'}
    </span>
  </span>
  {/* Vencimento - esconder em mobile */}
  {transaction.due_date && isPending && (
    <span className="hidden sm:inline">
      • Vence {format(parseISO(transaction.due_date), "dd/MM", { locale: ptBR })}
    </span>
  )}
  ...saldo...
</div>
```

#### 2. Limitar badges na linha principal (linhas 965-988)

**Mudanças:**
- Esconder badge "Pendente/Vencido" em mobile (já está visível pelo ícone amarelo/vermelho)
- Manter apenas badge de parcela em mobile pois é informação essencial

```tsx
{/* Badge de Parcela - manter visível */}
{transaction.tipo_lancamento === 'parcelada' && transaction.numero_parcela && transaction.total_parcelas && (
  <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
    {transaction.numero_parcela}/{transaction.total_parcelas}
  </span>
)}

{/* Badge de Status - esconder em mobile pois o ícone colorido já indica */}
{isPending && (
  <span className={cn(
    "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline",
    isOverdue 
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
  )}>
    {isOverdue ? 'Vencido' : 'Pendente'}
  </span>
)}
```

#### 3. Reduzir padding e tamanho em mobile (linha 939)

```tsx
// Antes
<div className="group flex items-center py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors">

// Depois
<div className="group flex items-center py-2 sm:py-3 px-2 sm:px-4 hover:bg-muted/50 rounded-lg transition-colors">
```

#### 4. Reduzir tamanho do ícone da categoria em mobile (linhas 941-950)

```tsx
// Antes
<div className={cn(
  "w-9 h-9 rounded-lg flex items-center justify-center mr-3 shrink-0",
  ...
)}>

// Depois  
<div className={cn(
  "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shrink-0",
  ...
)}>
  <IconComponent className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", ...)} />
```

#### 5. Valor com fonte menor em mobile (linhas 1042-1050)

```tsx
// Antes
<span className={cn(
  "font-semibold tabular-nums ml-4",
  ...
)}>

// Depois
<span className={cn(
  "font-semibold tabular-nums ml-2 sm:ml-4 text-sm sm:text-base",
  ...
)}>
```

---

## Resumo das Alterações

| Localização | Alteração |
|-------------|-----------|
| TransactionRow padding | `py-2 sm:py-3 px-2 sm:px-4` |
| Ícone categoria | `w-8 h-8 sm:w-9 sm:h-9` |
| Badge parcela | `text-[10px] sm:text-xs px-1 sm:px-1.5` |
| Badge status | `hidden sm:inline` (esconder em mobile) |
| Linha detalhes | Esconder categoria e vencimento em mobile |
| Valor | `text-sm sm:text-base ml-2 sm:ml-4` |

## Padrões Utilizados

1. **`hidden sm:contents/inline`**: Esconder info secundária em mobile
2. **Tamanhos adaptativos**: `text-xs sm:text-sm`, `w-8 sm:w-9`
3. **Indicadores visuais**: Usar cor do ícone ao invés de badges em mobile
4. **Padding reduzido**: Menos espaço lateral em telas pequenas

## Resultado Esperado

- Data/hora sempre visível
- Categoria oculta em mobile (info secundária)
- Badge de parcela compacto
- Badge de status oculto (ícone colorido é suficiente)
- Mais espaço horizontal para o valor
- Nenhum texto cortado ou sobreposto

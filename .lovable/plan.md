
# Plano: Correção de Responsividade no Header e Filtros da Página de Transações

## Problemas Identificados (baseado na screenshot)

### 1. Header com Filtro de Datas
O título "Transações" e o filtro de datas estão na mesma linha com `flex items-center gap-4`, fazendo os elementos ficarem espalhados verticalmente em mobile:
- Os botões de calendário empilham
- O texto "até" fica solto entre eles
- Os atalhos (Hoje, Mês) ficam em linha separada

### 2. FiltroDataRange
Os botões de data têm `min-w-[130px]` que força largura mesmo em telas pequenas, e o layout não é otimizado para mobile.

### 3. Card de Saldo Inicial
O card mostra informações espalhadas com o layout `flex-col sm:flex-row`, mas os elementos internos não estão bem organizados em mobile.

---

## Alterações Propostas

### 1. Transactions.tsx - Reorganizar Header (linhas 354-365)

**Antes:**
```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div className="flex items-center gap-4">
    <h1 className="text-xl font-semibold text-foreground">Transações</h1>
    <FiltroDataRange ... />
  </div>
  <div className="flex gap-2">
    <Button>Cartão</Button>
    <Button>Nova</Button>
  </div>
</div>
```

**Depois:**
```tsx
{/* Header - título e botões na mesma linha */}
<div className="flex items-center justify-between gap-2">
  <h1 className="text-xl font-semibold text-foreground">Transações</h1>
  <div className="flex gap-2">
    <Button variant="outline" size="sm" onClick={() => setCartaoDialogOpen(true)}>
      <CreditCard className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Cartão</span>
    </Button>
    <Button size="sm" className="gradient-primary">
      <Plus className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Nova</span>
    </Button>
  </div>
</div>

{/* Filtro de datas em linha separada */}
<FiltroDataRange ... />
```

### 2. FiltroDataRange.tsx - Layout Compacto para Mobile

**Mudanças principais:**
- Reduzir `min-w-[130px]` para `min-w-[110px]`
- Esconder o texto "até" em mobile, usar apenas ícone ou linha
- Mover calendários para layout vertical em mobile
- Agrupar atalhos de forma mais compacta

```tsx
// Linha 49 - Container principal
<div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2">
  {/* Linha de datas */}
  <div className="flex items-center gap-2 w-full sm:w-auto">
    {/* Data Inicial - botão menor em mobile */}
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-start text-left font-normal flex-1 sm:flex-none min-w-0 sm:min-w-[130px]",
            !startDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-1.5 sm:mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {startDate ? format(startDate, "dd/MM/yy", { locale: ptBR }) : "Início"}
          </span>
        </Button>
      </PopoverTrigger>
      ...
    </Popover>

    <span className="text-muted-foreground text-xs sm:text-sm shrink-0">até</span>

    {/* Data Final - mesmo padrão */}
    <Popover>
      ...
    </Popover>
  </div>

  {/* Atalhos + Refresh na mesma linha */}
  <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-start">
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={handleHoje} className="text-xs px-2 h-8">
        Hoje
      </Button>
      <Button variant="ghost" size="sm" onClick={handleEsteMes} className="text-xs px-2 h-8">
        Mês
      </Button>
      <Button variant="ghost" size="sm" onClick={handleEstaSemana} className="text-xs px-2 h-8 hidden sm:inline-flex">
        Semana
      </Button>
      <Button variant="ghost" size="sm" onClick={handleUltimos30Dias} className="text-xs px-2 h-8 hidden sm:inline-flex">
        30 dias
      </Button>
    </div>
    
    {onRefresh && (
      <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading} className="h-8 w-8">
        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      </Button>
    )}
  </div>
</div>
```

### 3. Transactions.tsx - Card de Saldo Inicial Compacto (linhas 702-733)

**Mudanças:**
- Layout mais horizontal em mobile
- Esconder label "Saldo Inicial" em mobile, usar apenas o ícone
- "Em Metas" e "Configurar" mais compactos

```tsx
<div className="flex items-center justify-between p-2 sm:p-3 gap-2 bg-muted/30 rounded-lg border border-border/50">
  {/* Saldo Inicial */}
  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
    <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
      <Wallet className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Saldo Inicial</span>
      <p className="font-semibold text-sm sm:text-base truncate">
        {formatCurrency(stats?.saldoInicial || 0)}
      </p>
    </div>
  </div>
  
  {/* Em Metas + Botão */}
  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
    {(stats?.totalMetas || 0) > 0 && (
      <div className="text-right">
        <span className="text-[10px] sm:text-xs text-muted-foreground">Em Metas</span>
        <p className="font-semibold text-primary text-sm sm:text-base">
          {formatCurrency(stats?.totalMetas || 0)}
        </p>
      </div>
    )}
    <Button 
      variant="ghost" 
      size="icon"
      onClick={() => setEditarSaldoOpen(true)}
      className="h-8 w-8"
    >
      <Settings className="w-4 h-4" />
    </Button>
  </div>
</div>
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Transactions.tsx` (linhas 354-381) | Separar título/botões do filtro, esconder texto dos botões em mobile |
| `src/pages/Transactions.tsx` (linhas 702-733) | Card de saldo compacto, botão icon-only em mobile |
| `src/components/FiltroDataRange.tsx` | Layout responsivo, datas com formato curto (dd/MM/yy), atalhos compactos |

## Resultado Esperado em Mobile

```
+---------------------------+
| Transações       [📦] [+] |  <- título + botões icon-only
+---------------------------+
| [📅 01/01/26] até [📅 31/01/26] |
| [Hoje] [Mês]           [🔄] |
+---------------------------+
| 💳 -R$ 1.175,45    [⚙️] |  <- saldo compacto
|    Em Metas R$ 1.332,33  |
+---------------------------+
```

## Padrões Utilizados

1. **Icon-only buttons em mobile**: `<span className="hidden sm:inline">`
2. **Formato de data curto**: `dd/MM/yy` em vez de `dd/MM/yyyy`
3. **Padding adaptativo**: `p-2 sm:p-3`
4. **Flex com shrink**: `shrink-0` para elementos que não devem encolher



# Plano: Simplificar e Unificar os Filtros

## Problema Identificado

A seção de filtros está visualmente "duplicada" e confusa:

1. **`FiltroDataRange` tem atalhos para o PASSADO**: "Hoje", "Semana", "Mês", "30 dias" (últimos 30 dias)
2. **A página tem atalhos para o FUTURO**: "30d", "3 meses", "6 meses", "12 meses" (próximos X)

Para uma página de "Despesas Futuras", os atalhos do passado não fazem sentido.

**Situação atual:**
```
[📅 26/01/2026] até [📅 26/04/2026] Hoje Semana Mês 30dias 🔄    30d 3meses 6meses 12meses
[Categoria ▼] [Responsável ▼] [Origem ▼] [Tipo ▼]              [≡] [⋮⋮] Limpar
```

## Solução Proposta

Consolidar tudo em UMA única linha de filtros:

**Nova estrutura:**
```
[📅 Data Inicial] até [📅 Data Final]  30d 3m 6m 12m  🔄  |  [Categoria ▼] [Responsável ▼] [Origem ▼] [Tipo ▼]  [≡ ⋮⋮]  Limpar
```

**Mudanças:**
1. Remover o componente `FiltroDataRange` (que tem atalhos do passado)
2. Usar date pickers simples diretamente na página
3. Manter apenas os atalhos de período FUTURO (30d, 3m, 6m, 12m)
4. Unir tudo em uma única linha fluída (flex-wrap)

## Mudanças Técnicas

### Arquivo: `src/pages/DespesasFuturas.tsx`

**1. Remover import do FiltroDataRange:**
```diff
- import { FiltroDataRange } from "@/components/FiltroDataRange";
+ import { Calendar } from "@/components/ui/calendar";
+ import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
+ import { CalendarIcon, RefreshCw } from "lucide-react";
```

**2. Substituir a seção de filtros (linhas 286-435) por uma versão unificada:**

```tsx
{/* Filtros - Linha única */}
<Card>
  <CardContent className="pt-4 pb-4">
    <div className="flex flex-wrap items-center gap-2">
      {/* Date Pickers */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[120px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, "dd/MM/yy", { locale: ptBR }) : "Início"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
          <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground text-sm">até</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[120px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "dd/MM/yy", { locale: ptBR }) : "Fim"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
          <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
        </PopoverContent>
      </Popover>

      {/* Atalhos de período FUTURO */}
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={handleProximos30Dias}>30d</Button>
        <Button variant="ghost" size="sm" onClick={handleProximos3Meses}>3m</Button>
        <Button variant="ghost" size="sm" onClick={handleProximos6Meses}>6m</Button>
        <Button variant="ghost" size="sm" onClick={handleProximo12Meses}>12m</Button>
      </div>

      <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading}>
        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      </Button>

      {/* Separador visual */}
      <div className="w-px h-6 bg-border hidden sm:block" />

      {/* Dropdowns de filtro */}
      <Select value={categoriaId} onValueChange={setCategoriaId}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>...</SelectContent>
      </Select>

      <Select value={responsavelId} onValueChange={setResponsavelId}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>...</SelectContent>
      </Select>

      <Select value={cartaoId} onValueChange={setCartaoId}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>...</SelectContent>
      </Select>

      <Select value={tipo} onValueChange={setTipo}>
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>...</SelectContent>
      </Select>

      {/* Toggle de visualização + Limpar */}
      <div className="flex items-center gap-1 ml-auto">
        <div className="flex border rounded-lg p-0.5">
          <Button variant={viewMode === "lista" ? "secondary" : "ghost"} size="sm">
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "agrupado" ? "secondary" : "ghost"} size="sm">
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={limparFiltros}>Limpar</Button>
      </div>
    </div>
  </CardContent>
</Card>
```

## Resultado Visual

**Antes (2 linhas confusas):**
```
[📅] até [📅] Hoje Semana Mês 30dias 🔄       30d 3meses 6meses 12meses
[Categoria▼] [Responsável▼] [Origem▼] [Tipo▼]        [≡][⋮⋮] Limpar
```

**Depois (1 linha organizada):**
```
[📅] até [📅] 30d 3m 6m 12m 🔄 | [Categoria▼] [Responsável▼] [Origem▼] [Tipo▼] [≡⋮⋮] Limpar
```

## Benefícios

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Linhas de filtros | 2 | 1 |
| Atalhos duplicados | Sim (8 botões) | Não (4 botões) |
| Espaço vertical | ~100px | ~50px |
| Clareza | Confuso | Intuitivo |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DespesasFuturas.tsx` | Remover `FiltroDataRange`, adicionar date pickers inline, unificar em uma linha |

## Tempo Estimado

5-7 minutos para implementar.


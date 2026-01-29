

# Plano: Correção de Responsividade em Todo o Sistema

## Problemas Identificados por Imagem

### Imagem 1 - Transações (Resumo e Lista)
- **Card "Saldo Inicial"**: Botão "Configu..." está cortado na lateral direita
- **Grid de 6 indicadores**: Valores estão muito apertados em mobile
- **Layout flex**: Elementos não quebram linha adequadamente

### Imagem 2 - Novo Registro (Dialog)
- Dialog parece OK, sem problemas graves

### Imagem 3 - Nova Categoria (Dialog)
- Dialog parece OK, sem problemas graves

### Imagem 4 - Despesas Futuras
- **Resumo por Cartão**: Cards cortados à direita ("Transaçõ..." truncado incorretamente)
- **Filtros**: Seletores empilhados causando scroll horizontal indesejado
- Barra de scroll horizontal visível desnecessariamente

### Imagem 5 - Cartões (Previsão de Faturas)
- **Header**: Botão "+" cortado à direita
- **Previsão de faturas**: Grid parece OK após correções anteriores

### Imagem 6 - Detalhes Cartão (Dialog)
- **Métricas**: Limite, Fatura, Disponível já corrigidos com flex-wrap
- Layout do dialog parece OK

### Imagem 7 - Editar Cartão (Dialog)
- Dialog parece OK

### Imagem 8 - Nova Compra (Dialog)
- Dialog parece OK

### Imagem 9 - Auditoria
- **Header da página**: Não aparece (cortado ou faltando)
- **Tabela**: Colunas muito largas causando scroll horizontal
- **Paginação**: Texto "Página 1 de 418" sobreposto/cortado

### Imagem 10 - Economia (Resumo)
- **Cards de resumo**: Valores cortados à direita
- **Grid 2x2 em mobile**: Não está respeitando os limites da tela
- Cards estão estourando a largura

## Arquivos a Corrigir

| Arquivo | Problemas |
|---------|-----------|
| `src/pages/Transactions.tsx` | Card saldo inicial com botão cortado |
| `src/pages/DespesasFuturas.tsx` | Grid de cartões e filtros |
| `src/pages/Cartoes.tsx` | Header com botões cortados |
| `src/pages/cartoes/Auditoria.tsx` | Tabela e paginação |
| `src/components/economia/Resumoeconomia.tsx` | Cards estourando largura |

---

## Correções Detalhadas

### 1. Transactions.tsx - Card de Saldo Inicial (linhas 700-733)

**Problema**: O layout flex com botão "Configurar" não quebra linha em mobile.

**Solução**: Reorganizar para empilhar em telas muito pequenas.

```tsx
// Antes
<div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
  <div className="flex items-center gap-3">...</div>
  <div className="flex items-center gap-4">
    ...metas...
    <Button>Configurar</Button>
  </div>
</div>

// Depois
<div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 bg-muted/30 rounded-lg border border-border/50">
  <div className="flex items-center gap-3">...</div>
  <div className="flex items-center justify-end gap-2 sm:gap-4 flex-wrap">
    ...metas...
    <Button size="sm" className="gap-1.5">
      <Settings className="w-4 h-4" />
      <span className="hidden xs:inline">Configurar</span>
    </Button>
  </div>
</div>
```

### 2. DespesasFuturas.tsx - Grid de Cartões (linhas 253-289)

**Problema**: Grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` ainda causa overflow.

**Solução**: Adicionar overflow-x-auto e ajustar breakpoints.

```tsx
// Antes
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

// Depois
<div className="flex flex-wrap gap-2 sm:gap-3">
  {resumoPorCartao.map((item) => (
    <button
      key={item.cartaoId || "transacao"}
      className="p-2 sm:p-3 rounded-lg border ... flex-1 min-w-[140px] max-w-[180px]"
      ...
    >
      ...
    </button>
  ))}
</div>
```

### 3. DespesasFuturas.tsx - Filtros (linhas 294-438)

**Problema**: Muitos seletores em linha única causando overflow.

**Solução**: Esconder filtros secundários em mobile e usar dropdown.

```tsx
// Filtros principais visíveis + secundários em dropdown no mobile
<div className="flex flex-wrap items-center gap-2">
  {/* Datas sempre visíveis */}
  ...date pickers...
  
  {/* Atalhos de período */}
  <div className="flex gap-1">...</div>
  
  {/* Mobile: dropdown com filtros extras */}
  <div className="flex sm:hidden">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">Filtros</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        ...selects de categoria, responsável, origem, tipo...
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  
  {/* Desktop: filtros inline */}
  <div className="hidden sm:flex items-center gap-2">
    ...selects...
  </div>
</div>
```

### 4. Cartoes.tsx - Header com Botões (linhas 133-148)

**Problema**: Botões "Desfazer", "Verificar Parcelas" e "+" cortados.

**Solução**: Agrupar em dropdown no mobile.

```tsx
// Antes
<div className="flex items-center gap-2">
  <DesfazerAlteracaoDialog />
  <Button>Verificar Parcelas</Button>
  <NovoCartaoDialog />
</div>

// Depois
<div className="flex items-center gap-2">
  {/* Mobile: dropdown */}
  <div className="flex sm:hidden">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Desfazer alteração</DropdownMenuItem>
        <DropdownMenuItem>Verificar parcelas</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  
  {/* Desktop: botões individuais */}
  <div className="hidden sm:flex items-center gap-2">
    <DesfazerAlteracaoDialog />
    <Button variant="outline" size="sm">
      <RefreshCw className="h-4 w-4 mr-2" />
      Verificar Parcelas
    </Button>
  </div>
  
  {/* Novo Cartão sempre visível */}
  <NovoCartaoDialog />
</div>
```

### 5. Auditoria.tsx - Tabela Responsiva (linhas 300-352)

**Problema**: Tabela com muitas colunas não cabe em mobile.

**Solução**: Esconder colunas secundárias e usar layout de cards em mobile.

```tsx
// Antes
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[160px]">Data/Hora</TableHead>
      <TableHead className="w-[100px]">Tabela</TableHead>
      <TableHead className="w-[110px]">Ação</TableHead>
      <TableHead>Descrição</TableHead>
      <TableHead className="w-[80px] text-center">Detalhes</TableHead>
    </TableRow>
  </TableHeader>
  ...
</Table>

// Depois
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Data/Hora</TableHead>
      <TableHead className="hidden sm:table-cell">Tabela</TableHead>
      <TableHead>Ação</TableHead>
      <TableHead className="hidden md:table-cell">Descrição</TableHead>
      <TableHead className="w-[60px] text-center">Ver</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data?.registros.map((registro) => (
      <TableRow key={registro.id}>
        <TableCell className="text-xs sm:text-sm">
          {format(new Date(registro.created_at), "dd/MM/yy HH:mm")}
        </TableCell>
        <TableCell className="hidden sm:table-cell">...</TableCell>
        <TableCell>
          <Badge className="text-[10px] sm:text-xs">...</Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell truncate max-w-[200px]">...</TableCell>
        <TableCell className="text-center">
          <Button size="icon" className="h-7 w-7">
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 6. Auditoria.tsx - Paginação (linhas 354-400)

**Problema**: Texto "Página X de Y (Z registros)" sobrepõe paginação.

**Solução**: Empilhar em mobile.

```tsx
// Antes
<div className="flex items-center justify-between mt-4">
  <p className="text-sm text-muted-foreground">
    Página {pagina + 1} de {totalPaginas} ({data?.total} registros)
  </p>
  <Pagination>...</Pagination>
</div>

// Depois
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
  <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
    Pág. {pagina + 1}/{totalPaginas} ({data?.total})
  </p>
  <Pagination className="justify-center sm:justify-end">
    <PaginationContent className="gap-1">
      <PaginationItem>
        <PaginationPrevious className="h-8 w-8 p-0" />
      </PaginationItem>
      {/* Mostrar menos páginas em mobile */}
      {Array.from({ length: Math.min(3, totalPaginas) }).map((_, i) => ...)}
      <PaginationItem>
        <PaginationNext className="h-8 w-8 p-0" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</div>
```

### 7. ResumoEconomia.tsx - Cards Estourando (linhas 30-154)

**Problema**: Cards com valores longos (R$ 4.593,08) estourando container.

**Solução**: Reduzir padding e fonte em mobile, usar truncate.

```tsx
// Antes
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-6">
      ...
      <p className="text-2xl sm:text-3xl font-bold">
        {formatCurrency(totalReceitas)}
      </p>
    </CardContent>
  </Card>
</div>

// Depois
<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
  <Card className="...">
    <CardContent className="p-3 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ...">
          <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 ..." />
        </div>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground font-medium">Receitas</p>
      <p className="text-lg sm:text-2xl md:text-3xl font-bold text-income mt-0.5 sm:mt-1 truncate">
        {formatCurrency(totalReceitas)}
      </p>
    </CardContent>
  </Card>
</div>
```

---

## Resumo das Alterações

| Arquivo | Alteração Principal |
|---------|---------------------|
| `src/pages/Transactions.tsx` | Card saldo inicial responsivo |
| `src/pages/DespesasFuturas.tsx` | Grid de cartões flex-wrap + filtros dropdown |
| `src/pages/Cartoes.tsx` | Botões header em dropdown mobile |
| `src/pages/cartoes/Auditoria.tsx` | Tabela com colunas hidden + paginação compacta |
| `src/components/economia/Resumoeconomia.tsx` | Cards com padding/fonte reduzidos |

## Padrões Aplicados

1. **Breakpoints**: `sm:` (640px) como ponto principal de mudança
2. **Ações**: Agrupar 3+ botões em dropdown no mobile
3. **Tabelas**: Esconder colunas secundárias com `hidden sm:table-cell`
4. **Cards**: Reduzir padding `p-3 sm:p-6` e fonte `text-lg sm:text-2xl`
5. **Texto longo**: Usar `truncate` em valores monetários
6. **Flex-wrap**: Permitir quebra de linha em containers flex
7. **Min/max-width**: Controlar tamanho de cards flexíveis

## Testes

- Viewport 375px (iPhone SE)
- Viewport 390px (iPhone 12)
- Viewport 414px (iPhone Plus)
- Viewport 768px (iPad)
- Rotação de tela (landscape)
- Verificar ausência de scroll horizontal


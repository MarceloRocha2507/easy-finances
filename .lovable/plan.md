
# Plano: Correção de Responsividade em Todo o Sistema

## Problemas Identificados nas Imagens

Com base nas imagens fornecidas, identifiquei os seguintes problemas principais de responsividade:

### Imagem 1 (Transações - Lista)
- Valores e texto se sobrepondo na linha da transação
- Ícones de ação (copiar, editar, excluir) aparecendo por cima do conteúdo
- Saldo após transação não cabe na linha em mobile

### Imagem 2 (Transações Recorrentes - Despesas Fixas)
- Switch e texto "Ativo/Pausado" sendo cortados à direita
- Layout não adaptado para telas pequenas

### Imagem 3 (Transações - Resumo)
- Texto "Configu..." cortado (botão Configurar)
- Cards de resumo muito apertados
- Grid de 6 colunas não se adapta bem

### Imagem 4 (Cartões - Previsão de Faturas)
- Valores de faturas sobrepostos (R$ 0,00R$ 1,67...)
- Grid de 4 colunas com texto/valores muito comprimidos

### Imagem 5 (DetalhesCartaoDialog)
- Métricas (Limite, Fatura, Disponível) cortadas
- Botões de ação cortados no header

### Imagem 6 (DespesasCartao)
- Header com muitos botões cortados
- Filtros não se adaptam bem

## Arquivos a Serem Corrigidos

| Arquivo | Problema Principal |
|---------|-------------------|
| `src/pages/Transactions.tsx` | Grid 6 cols, TransactionRow muito densa |
| `src/pages/transactions/Recorrentes.tsx` | Linha de transação com switch cortado |
| `src/pages/Cartoes.tsx` | Previsão de faturas - grid 4 cols fixo |
| `src/pages/DespesasCartao.tsx` | Header e filtros muito largos |
| `src/components/cartoes/DetalhesCartaoDialog.tsx` | Métricas inline cortadas |

## Solucoes Propostas

### 1. Transactions.tsx - Grid de Resumo (linhas 735)

**Problema**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` comprime demais em tablets.

**Solucao**: Usar grid mais progressivo e reduzir padding/texto em mobile.

```tsx
// Antes
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

// Depois
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
```

Tambem reduzir texto em mobile usando `text-[10px] sm:text-xs`.

### 2. Transactions.tsx - TransactionRow (linhas 937-1099)

**Problema**: Acoes sempre visiveis em mobile sobrepondo conteudo.

**Solucao**:
- Em mobile, mostrar apenas valor + menu de acoes (dropdown)
- Esconder "Saldo apos" em mobile
- Usar truncate mais agressivo

```tsx
// Antes - acoes sempre aparecem em hover
<div className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100">

// Depois - em mobile usar dropdown, em desktop manter hover
<div className="ml-2 flex gap-1 md:opacity-0 md:group-hover:opacity-100">
  {/* Em mobile: mostrar apenas 1 botao de menu */}
  <div className="flex md:hidden">
    <DropdownMenu>...</DropdownMenu>
  </div>
  {/* Em desktop: botoes individuais */}
  <div className="hidden md:flex gap-1">
    ...botoes existentes...
  </div>
</div>
```

### 3. Transactions/Recorrentes.tsx (linhas 211-276, 305-370)

**Problema**: Linha com switch + texto "Ativo" + dropdown nao cabe.

**Solucao**: Reorganizar layout para empilhar em mobile.

```tsx
// Antes
<div className="flex items-center justify-between p-3">
  <div>...info...</div>
  <div className="flex items-center gap-4">
    <p>valor</p>
    <div className="flex items-center gap-2">
      <Switch /> <span>Ativo</span>
    </div>
    <DropdownMenu>...</DropdownMenu>
  </div>
</div>

// Depois
<div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3">
  <div>...info...</div>
  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
    <p className="font-semibold">valor</p>
    <div className="flex items-center gap-2">
      <Switch />
      <span className="text-xs hidden sm:inline">Ativo</span>
    </div>
    <DropdownMenu>...</DropdownMenu>
  </div>
</div>
```

### 4. Cartoes.tsx - Previsao de Faturas (linhas 174)

**Problema**: `grid-cols-4` fixo causa sobreposicao de valores.

**Solucao**: Grid responsivo + scroll horizontal + texto menor.

```tsx
// Antes
<div className="grid grid-cols-4 gap-4 text-center">

// Depois
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
  {[0, 1, 2, 3].map((offset) => (
    <div key={offset} className="p-2 sm:p-4 rounded-xl ...">
      <p className="text-xs text-muted-foreground capitalize">{getMesLabel(offset)}</p>
      <p className="text-sm sm:text-lg font-bold value-display mt-1 truncate">
        {formatCurrency(getFaturaDoMes(titular.id, offset))}
      </p>
    </div>
  ))}
</div>
```

### 5. DespesasCartao.tsx - Header (linhas 334-397)

**Problema**: Muitos botoes de acao no header.

**Solucao**: Agrupar em dropdown no mobile.

```tsx
// Antes
<div className="flex items-center gap-2">
  <Button>Excluir</Button>
  <Button>Ajustar</Button>
  <Button>Adiantar</Button>
  <Button>Nova compra</Button>
</div>

// Depois
<div className="flex items-center gap-2">
  {/* Mobile: dropdown com acoes */}
  <div className="flex sm:hidden">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setAjustarFaturaOpen(true)}>Ajustar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAdiantarFaturaOpen(true)}>Adiantar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setExcluirFaturaOpen(true)}>Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  {/* Desktop: botoes individuais */}
  <div className="hidden sm:flex items-center gap-2">
    ...botoes existentes...
  </div>
  {/* Nova compra sempre visivel */}
  <Button size="sm" onClick={() => setNovaCompraOpen(true)}>
    <Plus className="h-4 w-4 sm:mr-1" />
    <span className="hidden sm:inline">Nova compra</span>
  </Button>
</div>
```

### 6. DespesasCartao.tsx - Filtros (linhas 476-619)

**Problema**: Filtros em linha unica estouram em mobile.

**Solucao**: Empilhar em mobile.

```tsx
// Antes
<div className="flex flex-col sm:flex-row sm:items-center gap-3">
  <div>...navegacao mes...</div>
  <div className="flex flex-1 items-center gap-2">
    ...todos os filtros em linha...
  </div>
</div>

// Depois
<div className="space-y-3">
  {/* Navegacao de mes */}
  <div className="flex items-center justify-between sm:justify-start gap-2">
    ...navegacao mes...
  </div>
  {/* Filtros - empilham em mobile */}
  <div className="flex flex-wrap items-center gap-2">
    <div className="relative flex-1 min-w-[150px] max-w-full sm:max-w-xs">...busca...</div>
    <Select>...status...</Select>
    <div className="hidden sm:flex items-center gap-2">
      <Select>...categoria...</Select>
      <Popover>...periodo...</Popover>
    </div>
    {temFiltrosAtivos && <Button>Limpar</Button>}
  </div>
</div>
```

### 7. DetalhesCartaoDialog.tsx - Metricas (linhas 231-246)

**Problema**: Metricas inline (Limite, Fatura, Disponivel) cortadas.

**Solucao**: Grid responsivo ou wrap.

```tsx
// Antes
<div className="flex items-center gap-4 mt-3 text-sm">
  <div>Limite: {limite}</div>
  <div>Fatura: {fatura}</div>
  <div>Disponivel: {disponivel}</div>
</div>

// Depois
<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs sm:text-sm">
  <div><span className="text-muted-foreground">Limite:</span> <span className="font-medium">{formatCurrency(limite)}</span></div>
  <div><span className="text-muted-foreground">Fatura:</span> <span className="font-medium text-destructive">{formatCurrency(totalMes)}</span></div>
  <div><span className="text-muted-foreground">Disponivel:</span> <span className="font-medium text-emerald-500">{formatCurrency(disponivel)}</span></div>
</div>
```

### 8. DetalhesCartaoDialog.tsx - Botoes de Acao (linhas 275-328)

**Problema**: Muitos botoes de acao cortados.

**Solucao**: Agrupar em dropdown no mobile.

```tsx
// Seguir mesmo padrao do item 5
```

## Resumo das Alteracoes

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/pages/Transactions.tsx` | Grid responsivo + dropdown mobile |
| `src/pages/transactions/Recorrentes.tsx` | Layout empilhado em mobile |
| `src/pages/Cartoes.tsx` | Grid 2/4 cols + texto menor |
| `src/pages/DespesasCartao.tsx` | Dropdown acoes + filtros wrap |
| `src/components/cartoes/DetalhesCartaoDialog.tsx` | Metricas wrap + dropdown |

## Padroes Aplicados

1. **Breakpoints consistentes**: `sm:` (640px), `md:` (768px), `lg:` (1024px)
2. **Acoes em mobile**: Agrupar em dropdown quando ha mais de 2 botoes
3. **Grids responsivos**: Comecar com menos colunas e aumentar progressivamente
4. **Texto adaptativo**: Usar `text-xs sm:text-sm` para labels
5. **Truncate agressivo**: Aplicar `truncate` em descricoes longas
6. **Flex-wrap**: Permitir quebra de linha quando necessario

## Teste

- Verificar em viewport de 375px (iPhone SE)
- Verificar em viewport de 414px (iPhone 12)
- Verificar em viewport de 768px (iPad)
- Testar rotacao de tela
- Verificar que nenhum conteudo fica cortado ou sobreposto

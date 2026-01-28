

# Plano: Padronização do Design de Todas as Páginas

## Diagnóstico das Inconsistências

Após analisar todas as páginas do sistema, identifiquei as seguintes inconsistências:

### 1. Headers das Páginas (Títulos e Descrições)

| Página | Título | Descrição | Inconsistência |
|--------|--------|-----------|----------------|
| Dashboard | `text-xl font-semibold` | Nenhuma | Sem descrição |
| Transações | `text-xl font-semibold` | Nenhuma | Sem descrição |
| Economia | `text-2xl font-semibold` | Sim | Tamanho diferente |
| Cartões | `text-2xl font-semibold tracking-tight` | Sim | Tracking extra |
| Metas | `text-2xl font-semibold tracking-tight` | Sim | Tracking extra |
| Bancos | `text-xl font-semibold` | Sim | OK |
| Relatórios | `text-2xl font-bold` | Sim | **Bold** diferente |
| Categorias | `text-xl font-semibold` | Sim | OK |
| Investimentos | `text-2xl font-bold` | Sim | **Bold** diferente |
| Admin | `text-2xl font-semibold` | Sim | Ícone no título |
| Perfil | `text-2xl font-bold` | Sim | **Bold** diferente |
| Notificações | `text-2xl font-bold` | Sim | **Bold** diferente |

### 2. Cards de Resumo/Stats

| Página | Estilo do Card | Padding | Inconsistência |
|--------|---------------|---------|----------------|
| Dashboard | `border card-hover animate-*` | `p-5` | Animações |
| Transações | Não usa cards de resumo | - | - |
| Metas | `Card` simples | `p-5` | Sem hover |
| Bancos | `border` | `p-5` | OK |
| Investimentos | `border rounded-xl` | `p-4` | Padding diferente |
| Admin | `card-hover animate-*` | `p-5` | OK |

### 3. Botões de Ação Principal

| Página | Botão | Variante/Estilo |
|--------|-------|-----------------|
| Transações | "Nova" | `size="sm" gradient-primary` |
| Cartões | "Novo Cartão" | Dialog trigger |
| Metas | "Novo objetivo" | `size="sm"` |
| Bancos | "Nova Conta" | Default (grande) |
| Investimentos | "Novo investimento" | Default (grande) |
| Categorias | "Nova Categoria" | Default (grande) |

### 4. Estados Vazios

| Página | Ícone | Texto | Ação |
|--------|-------|-------|------|
| Cartões | `CreditCard` | Centralizado | Texto simples |
| Metas | `Target` | Centralizado | Botão de ação |
| Bancos | `Building2` | Centralizado | Botão de ação |
| Investimentos | `PiggyBank` | Centralizado + border-dashed | Botão de ação |

### 5. Tabs

| Página | Estilo |
|--------|--------|
| Economia | Border-bottom customizado |
| Metas | TabsList padrão |
| Investimentos | TabsList padrão |
| Perfil | Grid 4 colunas com ícones |
| Notificações | Grid 3 colunas |

### 6. Cards de Conteúdo

| Página | Border | Shadow |
|--------|--------|--------|
| Dashboard | `border` | Via card-hover |
| Economia | Padrão | Padrão |
| Relatórios | `border-0 shadow-lg` | Explícito |
| Categorias | `border` | Padrão |

## Padrão Proposto

Baseado no design system atual (Friendly Fintech - Nubank/PicPay), vou definir um padrão único:

### Header da Página
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h1 className="text-xl font-semibold text-foreground">Título</h1>
    <p className="text-sm text-muted-foreground">Descrição opcional</p>
  </div>
  {/* Botões de ação */}
</div>
```

### Card de Estatísticas
```tsx
<Card className="border card-hover">
  <CardContent className="p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Label</p>
        <p className="text-xl font-semibold">Valor</p>
      </div>
      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Botão de Ação Principal
```tsx
<Button size="sm">
  <Plus className="h-4 w-4 mr-1.5" />
  Novo Item
</Button>
```

### Estado Vazio
```tsx
<Card className="border">
  <CardContent className="py-12 text-center">
    <Icon className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
    <h3 className="text-base font-medium mb-2">Título</h3>
    <p className="text-sm text-muted-foreground mb-4">Descrição</p>
    <Button size="sm" variant="outline">Ação</Button>
  </CardContent>
</Card>
```

### Tabs Padrão
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1 (count)</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2 (count)</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1" className="mt-4">...</TabsContent>
</Tabs>
```

## Alterações por Arquivo

### 1. `src/pages/Dashboard.tsx`
- Manter `text-xl font-semibold` (já está correto)
- Cards de stats já estão padronizados

### 2. `src/pages/Transactions.tsx`
- ✅ Header já padronizado

### 3. `src/pages/Economia.tsx`
- Alterar `text-2xl` → `text-xl`
- Remover descrição ou deixar opcional

### 4. `src/pages/Cartoes.tsx`
- Alterar `text-2xl font-semibold tracking-tight` → `text-xl font-semibold`
- Manter descrição

### 5. `src/pages/Metas.tsx`
- Alterar `text-2xl font-semibold tracking-tight` → `text-xl font-semibold`
- Adicionar `card-hover` aos cards de stats

### 6. `src/pages/Bancos.tsx`
- ✅ Já padronizado

### 7. `src/pages/Reports.tsx`
- Alterar `text-2xl font-bold` → `text-xl font-semibold`
- Alterar `border-0 shadow-lg` → `border` em todos os cards

### 8. `src/pages/Categories.tsx`
- ✅ Já padronizado

### 9. `src/pages/Investimentos.tsx`
- Alterar `text-2xl font-bold` → `text-xl font-semibold`
- Padronizar cards de resumo: `p-4` → `p-5`, adicionar `card-hover`

### 10. `src/pages/Admin.tsx`
- Alterar `text-2xl font-semibold` → `text-xl font-semibold`
- Remover ícone do título

### 11. `src/pages/Profile.tsx`
- Alterar `text-2xl font-bold` → `text-xl font-semibold`

### 12. `src/pages/Notificacoes.tsx`
- Alterar `text-2xl font-bold` → `text-xl font-semibold`

### 13. `src/pages/DespesasFuturas.tsx`
- Verificar e padronizar header

### 14. Subpáginas em `/cartoes/`, `/reports/`, `/transactions/`, `/profile/`
- Aplicar o mesmo padrão de header

## Resumo das Classes Padrão

| Elemento | Classes |
|----------|---------|
| Título H1 | `text-xl font-semibold text-foreground` |
| Descrição | `text-sm text-muted-foreground` |
| Card Container | `border card-hover` |
| Card Content | `p-5` |
| Stat Value | `text-xl font-semibold` |
| Stat Label | `text-sm text-muted-foreground mb-1` |
| Icon Container | `w-10 h-10 rounded-md bg-{color}/10 flex items-center justify-center` |
| Icon | `w-5 h-5 text-{color}` |
| Botão Principal | `size="sm"` com ícone `h-4 w-4 mr-1.5` |
| Tabs Content | `className="mt-4"` |

## Arquivos a Modificar

1. `src/pages/Economia.tsx` - Header
2. `src/pages/Cartoes.tsx` - Header
3. `src/pages/Metas.tsx` - Header + Cards
4. `src/pages/Reports.tsx` - Header + Cards
5. `src/pages/Investimentos.tsx` - Header + Cards
6. `src/pages/Admin.tsx` - Header
7. `src/pages/Profile.tsx` - Header
8. `src/pages/Notificacoes.tsx` - Header
9. `src/pages/DespesasFuturas.tsx` - Header (se necessário)
10. Subpáginas de cartões, reports, transactions, profile

## Benefícios

- **Consistência visual** em todo o sistema
- **Manutenção simplificada** com padrões claros
- **Experiência do usuário** mais profissional e coesa
- **Código mais limpo** sem variações desnecessárias


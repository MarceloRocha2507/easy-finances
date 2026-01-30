
# Plano: Histórico Completo de Alterações nas Metas

## Visão Geral

Implementar um sistema de histórico que mostra todas as movimentações (depósitos, retiradas, criação, edição) de cada meta, permitindo ao usuário acompanhar a evolução do seu objetivo ao longo do tempo.

```text
┌─────────────────────────────────────────────────────────────┐
│  📊 Gerenciar Meta: Viagem                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  [Depositar] [Retirar] [Editar] [Histórico]  ← NOVA ABA     │
│                                                              │
│  📜 Histórico de Movimentações                              │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  📅 Janeiro 2025                                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 30/01 15:42  ✅ Depósito          +R$ 100,00         │  │
│  │              Saldo: R$ 500,00 → R$ 600,00            │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 25/01 10:15  🔴 Retirada          -R$ 50,00          │  │
│  │              Saldo: R$ 550,00 → R$ 500,00            │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 20/01 09:30  💰 Receita+Depósito  +R$ 200,00         │  │
│  │              Salário · Saldo: R$ 350,00 → R$ 550,00  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  📅 Dezembro 2024                                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 15/12 14:00  🎯 Meta criada                          │  │
│  │              Objetivo: R$ 5.000,00                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Estratégia de Implementação

O sistema atual já cria transações automaticamente para cada depósito/retirada nas metas com descrições padronizadas:
- `"Depósito na meta: {titulo}"`
- `"Retirada da meta: {titulo}"`

A abordagem será buscar essas transações existentes pelo padrão de descrição, sem necessidade de criar uma nova tabela de auditoria.

---

## Alterações Técnicas

### 1. Criar Hook `useHistoricoMeta`

Novo hook em `src/hooks/useHistoricoMeta.ts` para buscar o histórico de movimentações de uma meta específica:

```tsx
export interface MovimentacaoMeta {
  id: string;
  tipo: 'deposito' | 'retirada' | 'criacao' | 'receita_deposito';
  valor: number;
  data: Date;
  descricao: string | null;
  categoria: string | null;
}

export function useHistoricoMeta(metaId: string, metaTitulo: string) {
  return useQuery({
    queryKey: ["historico-meta", metaId],
    queryFn: async () => {
      // Buscar transações relacionadas à meta pela descrição
      const { data, error } = await supabase
        .from("transactions")
        .select(`*, category:categories(name)`)
        .or(`description.ilike.%Depósito na meta: ${metaTitulo}%,description.ilike.%Retirada da meta: ${metaTitulo}%`)
        .order("date", { ascending: false });

      if (error) throw error;

      // Mapear para o formato de movimentação
      return (data || []).map(tx => ({
        id: tx.id,
        tipo: tx.type === 'expense' ? 'deposito' : 'retirada',
        valor: tx.amount,
        data: new Date(tx.date),
        descricao: tx.description,
        categoria: tx.category?.name || null,
      }));
    },
  });
}
```

### 2. Adicionar Tab "Histórico" no GerenciarMetaDialog

Atualizar `src/components/dashboard/GerenciarMetaDialog.tsx`:

**Novo TabsTrigger:**
```tsx
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="depositar">Depositar</TabsTrigger>
  <TabsTrigger value="retirar">Retirar</TabsTrigger>
  <TabsTrigger value="editar">Editar</TabsTrigger>
  <TabsTrigger value="historico">Histórico</TabsTrigger>
</TabsList>
```

**Nova TabsContent para Histórico:**
```tsx
<TabsContent value="historico" className="space-y-4 mt-4">
  <HistoricoMetaTab metaId={meta.id} metaTitulo={meta.titulo} />
</TabsContent>
```

### 3. Criar Componente `HistoricoMetaTab`

Novo componente em `src/components/dashboard/HistoricoMetaTab.tsx`:

```tsx
function HistoricoMetaTab({ metaId, metaTitulo }: Props) {
  const { data: movimentacoes, isLoading } = useHistoricoMeta(metaId, metaTitulo);

  // Agrupar por mês
  const movimentacoesPorMes = useMemo(() => {
    const grupos = new Map<string, MovimentacaoMeta[]>();
    movimentacoes?.forEach(mov => {
      const chave = format(mov.data, "MMMM yyyy", { locale: ptBR });
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave)!.push(mov);
    });
    return grupos;
  }, [movimentacoes]);

  return (
    <ScrollArea className="h-[300px]">
      {movimentacoesPorMes.size === 0 ? (
        <EmptyState />
      ) : (
        Array.from(movimentacoesPorMes.entries()).map(([mes, items]) => (
          <div key={mes} className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">{mes}</h4>
            <div className="space-y-2">
              {items.map(item => <MovimentacaoItem key={item.id} item={item} />)}
            </div>
          </div>
        ))
      )}
    </ScrollArea>
  );
}
```

### 4. Componente `MovimentacaoItem`

Renderiza cada movimentação com ícone, cor e valor formatado:

```tsx
function MovimentacaoItem({ item }: { item: MovimentacaoMeta }) {
  const config = {
    deposito: { 
      icon: Plus, 
      label: "Depósito", 
      className: "text-income bg-income/10" 
    },
    retirada: { 
      icon: Minus, 
      label: "Retirada", 
      className: "text-expense bg-expense/10" 
    },
  };

  const cfg = config[item.tipo];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", cfg.className)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{cfg.label}</p>
          <p className="text-xs text-muted-foreground">
            {format(item.data, "dd/MM/yyyy HH:mm")}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("font-semibold", 
          item.tipo === 'deposito' ? "text-income" : "text-expense"
        )}>
          {item.tipo === 'deposito' ? '+' : '-'}{formatCurrency(item.valor)}
        </p>
      </div>
    </div>
  );
}
```

---

## Fluxo de Dados

```text
+----------------+
| Meta           |
|  - id          |
|  - titulo      |
+-------+--------+
        |
        v
+-------+--------+
| useHistoricoMeta() 
|  Busca em transactions
|  WHERE description LIKE
|  "Depósito na meta: {titulo}"
|  OR "Retirada da meta: {titulo}"
+-------+--------+
        |
        v
+-------+--------+
| HistoricoMetaTab
|  - Agrupa por mês
|  - Renderiza timeline
+----------------+
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useHistoricoMeta.ts` | **Criar** | Hook para buscar movimentações da meta |
| `src/components/dashboard/HistoricoMetaTab.tsx` | **Criar** | Componente da aba de histórico |
| `src/components/dashboard/GerenciarMetaDialog.tsx` | **Modificar** | Adicionar nova aba "Histórico" |

---

## Resultado Esperado

1. **Nova aba "Histórico"** no dialog de gerenciar meta
2. **Timeline visual** agrupada por mês
3. **Depósitos em verde** com ícone de "+"
4. **Retiradas em vermelho** com ícone de "-"
5. **Data e hora** de cada movimentação
6. **Estado vazio** quando não há movimentações
7. **Scroll** para históricos longos

---

## Considerações

- **Sem nova tabela no banco**: Usa as transações já existentes
- **Busca por título**: As movimentações são encontradas pelo padrão de descrição
- **Performance**: Query filtrada por descrição ILIKE
- **Retroatividade**: Funciona para metas existentes que já têm transações


## Plano: Otimização de Performance na Navegação do Sidebar

### Diagnóstico Completo

O travamento na navegação entre seções (especialmente dentro do menu "Cartões") é causado por uma **cascata de re-renders e computações pesadas** que ocorrem a cada mudança de rota.

---

### Causas Identificadas

#### 1. Cascata de Hooks Pesados no Layout (Principal Causa)

Toda vez que você navega, o `Layout.tsx` re-renderiza e dispara esta cadeia:

```text
Layout.tsx
   └── useAlertasCount()
         └── useNotificacoes()
               └── useAlertasCompletos()
                     ├── useDashboardCompleto()    ← Busca cartões, metas, transações
                     ├── useAlertasTransacoes()    ← Busca transações pendentes
                     ├── useAlertasOrcamento()     ← Busca orçamentos
                     └── useAlertasAcertos()       ← Busca acertos pendentes
```

Cada navegação executa:
- **4 queries ao banco** simultâneas
- **Mapeamento e filtragem** de arrays grandes
- **Ordenação** de alertas por prioridade

#### 2. Falta de Memoização

| Componente | Problema |
|------------|----------|
| `MenuCollapsible` | Re-renderiza todos os itens a cada navegação |
| `isItemActive()` | Recalculada para cada sub-item em cada render |
| `isMenuActive` | Recalculada para cada menu em cada render |
| `getUserInitials()` | Função recriada a cada render |

#### 3. Estados de Menu Recalculados

Os estados `transacoesOpen`, `cartoesOpen`, etc. são inicializados com `location.pathname.startsWith()`:

```typescript
const [cartoesOpen, setCartoesOpen] = useState(
  location.pathname.startsWith("/cartoes")
);
```

Porém, quando a navegação ocorre, o componente re-renderiza mas os estados não atualizam automaticamente (são calculados apenas na montagem), causando comportamento inconsistente.

#### 4. Verificação Automática em Cartões

O `Cartoes.tsx` executa `regenerarParcelasFaltantes()` ao montar:

```typescript
useEffect(() => {
  const verificarParcelas = async () => {
    await regenerarParcelasFaltantes(); // Operação pesada
  };
  verificarParcelas();
}, []);
```

---

### Solução Proposta

#### Fase 1: Otimizar o Sistema de Alertas (Maior Impacto)

**1.1 Adicionar `staleTime` nos hooks de alertas**

```typescript
// useAlertasCompletos.ts
const { data: dashboard } = useDashboardCompleto();
// Adicionar staleTime para evitar refetch desnecessário
```

**1.2 Memoizar cálculos pesados com `useMemo`**

```typescript
const alertasOrdenados = useMemo(() => {
  return todosAlertas.sort((a, b) => ...);
}, [todosAlertas]);
```

**1.3 Mover contagem para hook separado com cache**

```typescript
// Evitar recálculo de categorias a cada render
const categorias = useMemo(() => ({
  cartao: alertasCartoes.length,
  ...
}), [alertasCartoes, ...]);
```

#### Fase 2: Memoizar Componentes do Sidebar

**2.1 Envolver `MenuCollapsible` em `React.memo`**

```typescript
export const MenuCollapsible = React.memo(function MenuCollapsible({...}) {
  // ...
});
```

**2.2 Memoizar funções `isActive`**

```typescript
const isItemActive = useCallback(
  (href: string) => location.pathname === href,
  [location.pathname]
);
```

**2.3 Memoizar `getUserInitials`**

```typescript
const userInitials = useMemo(() => {
  const fullName = user?.user_metadata?.full_name || user?.email || "";
  // ...
}, [user?.user_metadata?.full_name, user?.email]);
```

#### Fase 3: Otimizar Estados do Menu

**3.1 Sincronizar estados com a rota usando `useEffect`**

```typescript
useEffect(() => {
  setCartoesOpen(location.pathname.startsWith("/cartoes"));
  setTransacoesOpen(location.pathname.startsWith("/transactions"));
  // ...
}, [location.pathname]);
```

#### Fase 4: Debounce na Verificação de Parcelas

**4.1 Adicionar flag para evitar múltiplas execuções**

```typescript
const [verificado, setVerificado] = useState(false);

useEffect(() => {
  if (verificado) return;
  // ...
  setVerificado(true);
}, [verificado]);
```

**4.2 Mover verificação para um momento menos crítico**

```typescript
// Esperar 2 segundos após a página carregar
setTimeout(() => verificarParcelas(), 2000);
```

---

### Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/hooks/useAlertasCompletos.ts` | Adicionar `useMemo` para cálculos pesados |
| `src/hooks/useNotificacoes.ts` | Aumentar `staleTime` para evitar refetch |
| `src/components/sidebar/MenuCollapsible.tsx` | Envolver em `React.memo` + `useCallback` |
| `src/components/Layout.tsx` | Memoizar funções + sincronizar estados |
| `src/pages/Cartoes.tsx` | Debounce na verificação automática |

---

### Detalhes Técnicos

#### MenuCollapsible Otimizado

```typescript
import React, { useCallback } from "react";

export const MenuCollapsible = React.memo(function MenuCollapsible({
  icon: Icon,
  label,
  subItems,
  basePath,
  open,
  onOpenChange,
  onItemClick,
  badge,
}: MenuCollapsibleProps) {
  const location = useLocation();
  
  const isMenuActive = useMemo(() => {
    return Array.isArray(basePath)
      ? basePath.some((path) => location.pathname.startsWith(path))
      : location.pathname.startsWith(basePath);
  }, [basePath, location.pathname]);

  const isItemActive = useCallback(
    (href: string) => location.pathname === href,
    [location.pathname]
  );

  // ... resto do componente
});
```

#### Layout com Estados Sincronizados

```typescript
// Sincronizar estados de menu com a rota atual
useEffect(() => {
  const path = location.pathname;
  setTransacoesOpen(path.startsWith("/transactions"));
  setCartoesOpen(path.startsWith("/cartoes"));
  setEconomiaOpen(path.startsWith("/economia"));
  setRelatoriosOpen(path.startsWith("/reports"));
  setConfigOpen(path.startsWith("/profile") || path.startsWith("/configuracoes"));
}, [location.pathname]);
```

#### useAlertasCompletos Otimizado

```typescript
const alertasOrdenados = useMemo(() => {
  const todosAlertas = [
    ...alertasCartoes,
    ...alertasMetas,
    ...(alertasTransacoes || []),
    ...(alertasOrcamento || []),
    ...(alertasAcertos || []),
    ...alertasEconomia,
  ];
  
  return todosAlertas.sort((a, b) => 
    (prioridadeTipo[a.tipo] || 5) - (prioridadeTipo[b.tipo] || 5)
  );
}, [alertasCartoes, alertasMetas, alertasTransacoes, alertasOrcamento, alertasAcertos, alertasEconomia]);
```

---

### Ordem de Implementação

```text
1. useAlertasCompletos.ts     ← Adicionar useMemo (maior impacto)
2. useNotificacoes.ts         ← Aumentar staleTime
3. MenuCollapsible.tsx        ← React.memo + useCallback
4. Layout.tsx                 ← Sincronizar estados + memoizar
5. Cartoes.tsx                ← Debounce na verificação
```

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| ~500ms de travamento | Navegação instantânea |
| Re-fetch de dados a cada clique | Cache inteligente |
| Re-render de todo o sidebar | Apenas itens afetados |
| Verificação bloqueante | Verificação assíncrona delayed |

### Métricas de Sucesso

- Navegação entre seções do menu "Cartões" sem travamento perceptível
- Console sem re-fetches desnecessários durante navegação
- Transições suaves mantendo as micro-animações existentes

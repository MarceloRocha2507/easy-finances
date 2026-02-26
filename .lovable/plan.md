
# Mover Assinaturas para Transacoes e Adicionar Card de Resumo

## Resumo

Duas alteracoes: (1) mover "Assinaturas" do menu principal para submenu de "Transacoes", e (2) adicionar um card de resumo de assinaturas na tela de Visao Geral de Transacoes.

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/sidebar/SidebarNav.tsx` | Remover "Assinaturas" do `mainMenuItems`, adicionar como submenu em `transacoesMenu` |
| `src/pages/Transactions.tsx` | Adicionar card `StatCardMinimal` de assinaturas no grid de resumo |

## Detalhes tecnicos

### 1. SidebarNav.tsx

**Remover** a linha `{ icon: Repeat, label: "Assinaturas", href: "/assinaturas" }` do array `mainMenuItems`.

**Adicionar** ao array `transacoesMenu.subItems`:
```typescript
{ icon: Repeat, label: "Assinaturas", href: "/assinaturas" },
```

Ordem final dos subItems de Transacoes:
1. Visao Geral (`/transactions`)
2. Importar (`/transactions/importar`)
3. Despesas Futuras (`/transactions/futuras`)
4. Assinaturas (`/assinaturas`)

**Atualizar** a logica de `openMenus.transacoes` para tambem abrir quando `pathname === "/assinaturas"`:
- Estado inicial: `pathname.startsWith("/transactions") || pathname === "/assinaturas"`
- useEffect: mesma logica com `||`

**Atualizar** o `MenuCollapsible` de transacoes para incluir `includePaths={["/assinaturas"]}` ou ajustar `basePath` -- na verdade, basta que o menu abra corretamente via `openMenus`, o `MenuCollapsible` ja renderiza os subItems independentemente.

### 2. Transactions.tsx

**Importar** o hook `useAssinaturas` e o icone `Repeat`.

**Calcular** dados de assinaturas:
```typescript
const { assinaturas, isLoading: isAssinaturasLoading } = useAssinaturas();

const assinaturasAtivas = assinaturas.filter(a => a.status === 'ativa');
const totalMensal = assinaturasAtivas.reduce((sum, a) => {
  const divisor = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 }[a.frequencia] || 1;
  return sum + a.valor / divisor;
}, 0);
const renovamEssaSemana = assinaturasAtivas.filter(a => {
  const prox = new Date(a.proxima_cobranca + 'T12:00:00');
  const diff = (prox.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}).length;
```

**Adicionar** um novo `StatCardMinimal` no grid (mudando de `lg:grid-cols-3` para acomodar 7 cards, possivelmente mantendo o mesmo grid):
```tsx
<StatCardMinimal
  title="Assinaturas"
  value={totalMensal}
  icon={Repeat}
  subInfo={
    <>
      {assinaturasAtivas.length} ativas
      {renovamEssaSemana > 0 && (
        <span className="text-amber-500 ml-1">
          · {renovamEssaSemana} renovam essa semana
        </span>
      )}
    </>
  }
  onClick={() => navigate('/assinaturas')}
  delay={0.3}
  isLoading={isAssinaturasLoading}
  valueColor="expense"
/>
```

O card sera adicionado apos o card "Estimado", como o setimo card no grid. O subtexto combinara a contagem de ativas com um alerta em amarelo para renovacoes proximas.

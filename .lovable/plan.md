

# Plano: Correção da Página de Relatórios

## Problemas Identificados

### 1. Gráfico de Pizza Bugado
O gráfico atual usa labels externos que estão se sobrepondo, causando confusão visual. O Dashboard já possui um componente muito melhor: `PieChartWithLegend` que tem:
- Gráfico de rosca (donut) em vez de pizza simples
- Legenda interativa ao lado
- Hover states com destaque
- Tooltip customizado elegante

### 2. Ícones Mostrando Texto
No "Detalhamento por Categoria", os ícones aparecem como texto (`credit-card`, `car`, `package`) porque o código renderiza `{category.icon}` diretamente como string. Precisa converter essas strings para componentes Lucide.

---

## Solução

### Alterações no arquivo `src/pages/Reports.tsx`

#### 1. Importar o componente PieChartWithLegend
Substituir o gráfico de pizza manual pelo componente já existente do Dashboard.

#### 2. Criar mapeamento de ícones
Adicionar um mapa de ícones (similar ao `ICON_OPTIONS` de Categories.tsx) para converter nomes de ícones em componentes Lucide.

#### 3. Atualizar seção "Detalhamento por Categoria"
Usar o mapeamento de ícones para renderizar os componentes Lucide corretamente em vez de texto.

#### 4. Atualizar seção "Maiores Transações"
Aplicar o mesmo tratamento para os ícones das transações.

---

## Detalhes Técnicos

### Mapeamento de Ícones

```typescript
const ICON_MAP: Record<string, LucideIcon> = {
  'dollar-sign': DollarSign,
  'wallet': Wallet,
  'briefcase': Briefcase,
  'shopping-cart': ShoppingCart,
  'home': Home,
  'car': Car,
  'utensils': Utensils,
  'heart': Heart,
  'graduation-cap': GraduationCap,
  'gift': Gift,
  'plane': Plane,
  'gamepad': Gamepad2,
  'shirt': Shirt,
  'pill': Pill,
  'book': Book,
  'package': Package,
  'zap': Zap,
  'trending-up': TrendingUp,
  'tag': Tag,
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
};

function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Package;
}
```

### Substituição do Gráfico de Pizza

**Antes:**
```tsx
<Card className="border">
  <CardHeader>
    <CardTitle>Despesas por Categoria</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer>
      <PieChart>
        <Pie ... label={...} />
      </PieChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Depois:**
```tsx
<PieChartWithLegend data={pieData} />
```

### Correção dos Ícones no Detalhamento

**Antes:**
```tsx
<div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
     style={{ backgroundColor: `${category.color}20` }}>
  {category.icon}  {/* ❌ Renderiza texto como "credit-card" */}
</div>
```

**Depois:**
```tsx
{(() => {
  const IconComp = getIconComponent(category.icon);
  return (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
         style={{ backgroundColor: `${category.color}20` }}>
      <IconComp className="w-5 h-5" style={{ color: category.color }} />
    </div>
  );
})()}
```

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/Reports.tsx` | Importar PieChartWithLegend, criar ICON_MAP, corrigir renderização de ícones |

---

## Resultado Visual Esperado

### Gráfico de Pizza
- Formato donut (rosca) com centro vazio
- Legenda interativa ao lado direito
- Hover que destaca a fatia selecionada
- Tooltip elegante com valor e cor

### Detalhamento por Categoria
- Ícones Lucide renderizados corretamente (não mais texto)
- Cores aplicadas aos ícones
- Visual consistente com o resto do sistema


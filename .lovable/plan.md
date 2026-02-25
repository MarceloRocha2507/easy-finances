

# Transformar "Economia" de subcategoria em item de primeiro nivel

Como "Economia" possui apenas uma opcao ("Metas"), nao faz sentido manter o menu colapsavel. A solucao e promover "Metas" a um item de primeiro nivel no menu, usando o icone `PiggyBank` e apontando para `/economia/metas`.

## Alteracoes no arquivo `src/components/sidebar/SidebarNav.tsx`

### 1. Adicionar "Metas" ao `mainMenuItems`
Incluir `{ icon: PiggyBank, label: "Metas", href: "/economia/metas" }` apos "Categorias" no array `mainMenuItems`.

### 2. Remover `economiaMenu`
Deletar o objeto `economiaMenu` (linhas 53-59).

### 3. Remover o `MenuCollapsible` de Economia
Deletar o bloco do componente `MenuCollapsible` de economia (linhas 154-162).

### 4. Limpar estado `openMenus`
Remover `economia` do estado `openMenus` (linha 85) e do `useEffect` (linha 95).

### Menu resultante

```
Dashboard
Bancos
Categorias
Metas            <-- item de primeiro nivel
Transacoes (...)
Cartoes (...)
Relatorios (...)
---
Novidades
Admin (condicional)
Fina IA
```




# Reorganizar menu de navegacao

## Alteracoes no arquivo `src/components/sidebar/SidebarNav.tsx`

### 1. Remover "Limites" do menu Cartoes (linha 50)

### 2. Mover "Bancos" para fora de Cartoes

**Bancos** e um conceito financeiro independente (contas bancarias, saldos). Faz mais sentido como item de primeiro nivel, junto com Dashboard e Categorias, pois representa uma entidade central do sistema financeiro — nao e exclusivo de cartoes.

Adicionar `{ icon: Building2, label: "Bancos", href: "/cartoes/bancos" }` ao array `mainMenuItems`, posicionado apos "Dashboard" e antes de "Categorias".

### 3. Mover "Auditoria" para o menu Relatorios

**Auditoria** e essencialmente um historico de alteracoes — se encaixa naturalmente dentro de "Relatorios", onde o usuario busca informacoes sobre o que aconteceu no sistema.

Adicionar `{ icon: History, label: "Auditoria", href: "/cartoes/auditoria" }` ao array `relatoriosMenu.subItems`.

### 4. Menu Cartoes resultante

```
Cartoes
  - Visao Geral
  - Parcelamentos
  - Responsaveis
```

### 5. Menu principal e Relatorios resultantes

```
Dashboard
Bancos          <-- novo item de primeiro nivel
Categorias
Transacoes (...)
Cartoes (simplificado)
Economia (...)
Relatorios
  - Visao Geral
  - Por Categoria
  - Exportacoes
  - Auditoria    <-- movido para ca
```

### Detalhes tecnicos

- Atualizar `mainMenuItems` adicionando Bancos entre Dashboard e Categorias
- Remover linhas 47 (Bancos), 50 (Limites) e 51 (Auditoria) do `cartoesMenu.subItems`
- Adicionar Auditoria ao `relatoriosMenu.subItems`
- Atualizar a logica de `openMenus` para que rotas `/cartoes/bancos` e `/cartoes/auditoria` abram os menus corretos (Relatorios para auditoria; Bancos nao precisa pois e item de primeiro nivel)


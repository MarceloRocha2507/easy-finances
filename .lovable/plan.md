

# Remover "Visao Geral" do submenu Economia

## Alteracao

### Arquivo: `src/components/sidebar/SidebarNav.tsx`

**Linha 56-59** - Remover a subopção "Visão Geral" do `economiaMenu`, mantendo apenas "Metas":

De:
```typescript
subItems: [
  { icon: PiggyBank, label: "Visão Geral", href: "/economia" },
  { icon: PiggyBank, label: "Metas", href: "/economia/metas" },
],
```

Para:
```typescript
subItems: [
  { icon: PiggyBank, label: "Metas", href: "/economia/metas" },
],
```

Nenhuma outra alteracao necessaria — a rota `/economia` continua existindo no App.tsx, apenas nao sera mais acessivel pelo menu lateral.


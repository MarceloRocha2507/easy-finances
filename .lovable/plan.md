

## Plano: Simplificar Footer do Sidebar (Estilo Inline)

### Design de Referência

A imagem mostra uma barra horizontal simples com:

```text
┌──────────────────────────────────────┐
│  🔵 MR   Marcelo Ro...   🔔   →│    │
└──────────────────────────────────────┘
```

Elementos inline:
1. Avatar com iniciais
2. Nome truncado
3. Ícone de sino (link para notificações)
4. Ícone de sair (logout)

### Mudança de Comportamento

- **Avatar/Nome**: Ao clicar, navega para `/profile` (que abre as configurações)
- **Ícone de sino**: Link direto para `/notificacoes`
- **Ícone de sair**: Executa logout

### Alterações

**Arquivo:** `src/components/Layout.tsx`

| Atual | Novo |
|-------|------|
| DropdownMenu com submenu | Layout inline simples |
| ChevronDown | Removido |
| Submenu de configurações | Removido (perfil abre configs) |
| Badge no trigger | Badge no ícone de sino |

### Estrutura JSX Proposta

```typescript
{/* User section - Inline simples */}
<div className="p-3 border-t border-border/50">
  <div className="flex items-center justify-between px-2">
    {/* Avatar + Nome clicável para /profile */}
    <Link 
      to="/profile" 
      onClick={closeSidebar}
      className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
    >
      <Avatar className="h-8 w-8 ring-2 ring-primary/20">
        <AvatarImage src={profile?.avatar_url} alt={userName} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium truncate max-w-[90px]">
        {userName}
      </span>
    </Link>
    
    {/* Ícones de ação */}
    <div className="flex items-center gap-1">
      {/* Notificações */}
      <Link 
        to="/notificacoes" 
        onClick={closeSidebar}
        className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {alertasCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 ...">
            {alertasCount}
          </span>
        )}
      </Link>
      
      {/* Sair */}
      <button 
        onClick={signOut}
        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <LogOut className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  </div>
</div>
```

### Imports a Remover

```typescript
// Remover do import (não mais utilizados):
- DropdownMenu, DropdownMenuContent, DropdownMenuItem
- DropdownMenuSeparator, DropdownMenuTrigger
- DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
- ChevronDown, User, Sliders
```

### Resultado Visual

```text
┌──────────────────────────────────────┐
│  🔵   Nome...         🔔      →│     │
│  └─ clique abre /profile              │
└──────────────────────────────────────┘
```

### Benefícios

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Cliques para logout | 2 (abrir dropdown + clicar) | 1 |
| Cliques para perfil | 2 | 1 |
| Complexidade visual | Alta (dropdown) | Baixa (inline) |
| Componentes | DropdownMenu + Submenu | Links + Button simples |

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/Layout.tsx` | Substituir DropdownMenu por layout inline |


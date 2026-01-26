

## Plano: Simplificar a Seção de Usuário no Footer do Sidebar

### Objetivo

Tornar a seção de usuário (perfil, notificações, configurações, sair) mais compacta e limpa, mantendo todas as funcionalidades.

### Estrutura Atual (Verbosa)

```text
┌────────────────────────────┐
│ 🔵 Avatar Grande           │
│    Nome Completo           │
│    "Ver perfil"            │
├────────────────────────────┤
│ 🔔 Notificações      [3]   │
├────────────────────────────┤
│ ⚙️ Configurações      ▼    │
│    ├─ Preferências         │
│    ├─ Segurança            │
│    └─ Notificações         │
├────────────────────────────┤
│ 🚪 Sair                    │
└────────────────────────────┘
```

### Nova Estrutura (Compacta)

```text
┌────────────────────────────┐
│ 🔵 Avatar  Nome    [🔔3] ▼ │  ← Linha única com dropdown
└────────────────────────────┘

Dropdown (ao clicar):
┌────────────────────────────┐
│ 👤 Meu Perfil              │
│ 🔔 Notificações      [3]   │
│ ⚙️ Configurações      ▶    │
│ ─────────────────────────  │
│ 🚪 Sair                    │
└────────────────────────────┘
```

### Alterações

**Arquivo:** `src/components/Layout.tsx`

| Elemento Atual | Nova Abordagem |
|----------------|----------------|
| Avatar grande (h-9 w-9) com nome e "Ver perfil" | Avatar compacto (h-8 w-8) + nome truncado + badge de notificação |
| Link separado para Notificações | Movido para dentro do dropdown |
| MenuCollapsible de Configurações | Movido para dentro do dropdown com submenu |
| Botão Sair separado | Movido para final do dropdown com separador |

### Detalhes Técnicos

#### Componente Dropdown

Utilizarei o `DropdownMenu` do Radix UI (já disponível em `@/components/ui/dropdown-menu`) para criar um menu compacto:

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
```

#### Estrutura JSX Proposta

```typescript
{/* User section - Compacta */}
<div className="p-3 border-t border-border/50">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:glass-hover">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate max-w-[100px]">{userName}</span>
        </div>
        <div className="flex items-center gap-2">
          {alertasCount > 0 && (
            <span className="badge">{alertasCount}</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuItem asChild>
        <Link to="/profile">Meu Perfil</Link>
      </DropdownMenuItem>
      
      <DropdownMenuItem asChild>
        <Link to="/notificacoes">
          Notificações
          {alertasCount > 0 && <span>({alertasCount})</span>}
        </Link>
      </DropdownMenuItem>
      
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Configurações</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem asChild>
            <Link to="/profile/preferencias">Preferências</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile/seguranca">Segurança</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/configuracoes/notificacoes">Notificações</Link>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

### Benefícios

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Altura ocupada | ~160px (4 elementos) | ~50px (1 elemento) |
| Interação | Múltiplos cliques | 1 clique + dropdown |
| Espaço visual | Poluído | Limpo e organizado |
| Badge de notificação | Linha separada | Integrado no trigger |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/Layout.tsx` | Substituir seção de usuário por DropdownMenu compacto |

### Resultado Visual Esperado

A seção do footer passará de **4 elementos empilhados** para **1 linha compacta** com dropdown, economizando ~110px de altura no sidebar e tornando a interface mais elegante.


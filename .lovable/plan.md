

# Melhorar visual das notificações do Dashboard

## Alterações no arquivo `src/components/dashboard/AlertasInteligentes.tsx`

### 1. Ícones coloridos em fundo circular
Substituir os ícones inline por versões dentro de um container circular com fundo colorido (laranja para warning, vermelho para danger, azul para info, verde para success). Adicionar `Bell` ao mapa de ícones.

### 2. Borda colorida à esquerda
Cada card terá uma `border-l-[3px]` com cor semântica (laranja para warning, vermelho para danger, etc.) usando `border-l-amber-500`, `border-l-red-500`, etc.

### 3. Fundo branco com sombra
Cards usarão `bg-white dark:bg-card shadow-sm` em vez do fundo colorido translúcido atual, criando contraste com o fundo cinza da página.

### 4. Espaçamento interno maior
Aumentar padding de `p-3` para `p-4` nos cards.

### 5. Hierarquia de texto
- Título: `text-sm font-semibold text-foreground` (mais escuro, semi-bold)
- Mensagem: texto com partes em destaque -- o nome do banco/cartão ficará com `font-medium text-foreground`, o restante em `text-muted-foreground`

### 6. Botão X sutil no hover
O botão de fechar terá `opacity-0 group-hover:opacity-100 transition-opacity` e o card receberá a classe `group`.

### 7. Mapa de cores atualizado

```text
CORES_TIPO:
  danger  -> border-l: red-500,    icon-bg: red-100,    icon: red-600
  warning -> border-l: amber-500,  icon-bg: amber-100,  icon: amber-600
  info    -> border-l: blue-500,   icon-bg: blue-100,   icon: blue-600
  success -> border-l: green-500,  icon-bg: green-100,  icon: green-600
```


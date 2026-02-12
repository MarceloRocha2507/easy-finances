

# Corrigir Layout Descentralizado do Modal DetalhesCartaoDialog

## Problema

O `DialogContent` base usa `display: grid` com `gap-4` (16px). Quando combinado com `p-0` (padding removido para o header colorido), o gap entre o header colorido e o conteudo cria um espacamento inconsistente. Alem disso, o botao de fechar (X) fica posicionado sobre o header colorido com cor escura, dificultando a visibilidade.

## Solucao

### 1. Remover o gap do grid no DialogContent
Adicionar `gap-0` ao className do `DialogContent` no `DetalhesCartaoDialog.tsx` para eliminar o espacamento automatico do grid entre header e conteudo. O espacamento interno ja e controlado pelos proprios blocos.

**Antes:**
```tsx
<DialogContent className="max-w-lg w-[calc(100%-2rem)] p-0 overflow-y-auto overflow-x-hidden">
```

**Depois:**
```tsx
<DialogContent className="max-w-lg w-[calc(100%-2rem)] p-0 gap-0 overflow-y-auto overflow-x-hidden">
```

### 2. Aplicar a mesma correcao nos demais modais de cartao
Todos os modais que usam `p-0` com header colorido tambem precisam de `gap-0`:

- NovaCompraCartaoDialog.tsx
- PagarFaturaDialog.tsx
- EditarCartaoDialog.tsx
- GerarMensagemDialog.tsx
- RegistrarAcertoDialog.tsx
- AdiantarFaturaDialog.tsx
- ExcluirCartaoDialog.tsx
- AjustarFaturaDialog.tsx
- EditarCompraDialog.tsx
- EstornarCompraDialog.tsx
- DetalhesCompraCartaoDialog.tsx
- ExcluirCompraDialog.tsx

### 3. Ajustar o botao de fechar (X) no header colorido
O botao X padrao e escuro e fica sobre o header colorido. No `DetalhesCartaoDialog`, adicionar um botao de fechar customizado em branco dentro do header e esconder o padrao com a classe `[&>button]:hidden` ou posicionar com `[&>button]:text-white`.

**Alteracao no DialogContent:**
```tsx
<DialogContent className="... [&>button]:text-white [&>button]:hover:text-white/80">
```

Isso garante que o X fique visivel sobre qualquer cor de fundo do header.

## Resumo das alteracoes
- Adicionar `gap-0` em todos os 13 modais de cartao que usam `p-0`
- Adicionar `[&>button]:text-white [&>button]:hover:text-white/80` nos modais com header colorido para visibilidade do botao fechar


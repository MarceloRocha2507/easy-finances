

## Problema

O `FiltroPeriodo` renderiza botões de navegação, select de mês, botão "Hoje" e botão de refresh todos em uma linha horizontal. Em telas de celular, isso ultrapassa a largura da tela.

## Solução

Mover o botão de atualizar (refresh) para fora do `FiltroPeriodo`, colocando-o ao lado do nome do usuário ou como um botão independente no header do Dashboard. Assim o `FiltroPeriodo` fica mais compacto.

### Alterações

**Arquivo: `src/pages/Dashboard.tsx` (linhas 135-149)**

Reorganizar o header: mover o `onRefresh` para fora do `FiltroPeriodo` e posicioná-lo como um botão separado no header, ao lado da saudação do usuário:

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  <div className="flex items-center gap-2">
    <p className="text-sm text-muted-foreground">
      Olá, {user?.user_metadata?.full_name || "Usuário"}
    </p>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => refetch()}
      disabled={isFetching}
      className="h-8 w-8"
    >
      <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
    </Button>
  </div>

  <FiltroPeriodo
    mesAtual={mesReferencia}
    onMesChange={setMesReferencia}
  />
</div>
```

- Remover as props `onRefresh` e `isLoading` da chamada do `FiltroPeriodo`
- Importar `RefreshCw` de `lucide-react` no Dashboard (se ainda não importado)
- O `FiltroPeriodo` continua funcionando normalmente, apenas sem renderizar o botão de refresh (ele já tem a condicional `{onRefresh && ...}`)


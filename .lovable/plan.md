

# Melhorar Design do DetalhesCartaoDialog

## Problemas Identificados

1. **Valores cortados em alguns meses**: A descricao longa empurra o valor para fora da area visivel. O `truncate` na descricao nao esta funcionando corretamente porque o container flex nao tem uma largura maxima restrita o suficiente.

2. **Layout confuso**: Muita informacao competindo por espaco - busca, resumo pendente/pago, lista de despesas e acoes ficam apertados.

## Solucao

### 1. Corrigir valores cortados definitivamente

Reestruturar cada linha de despesa para garantir que o valor sempre apareca:
- Definir `max-w-[calc(100%-120px)]` no container da descricao para reservar espaco fixo para o valor + botao de acoes
- Mover o valor para uma posicao com largura minima garantida (`min-w-[80px] text-right`)

### 2. Melhorar hierarquia visual

- Separar visualmente cada despesa com bordas sutis em vez de apenas espacamento
- Adicionar a informacao de parcela inline com a descricao (ex: "Aliexpress 6/12") em vez de linha separada
- Mostrar o responsavel como badge compacto

### 3. Limpar layout do resumo

- Reformatar o resumo Pendente/Pago como chips mais claros com fundo colorido
- Mover o botao "Pagar fatura" para o dropdown de acoes do header em vez de ficar inline no resumo

## Detalhes Tecnicos

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

**Linhas 486-557 - Reestruturar cada linha de despesa:**

Substituir o layout flex atual por uma estrutura com larguras controladas:

```tsx
<div className="flex items-center justify-between py-2.5 px-2 rounded-lg">
  <div className="min-w-0 flex-1 mr-2">
    <p className="text-sm font-medium truncate">
      {p.descricao} - {p.numero_parcela}/{p.total_parcelas}
    </p>
    <p className="text-xs text-muted-foreground truncate">
      {p.responsavel_apelido || p.responsavel_nome || 'Eu'}
    </p>
  </div>
  <div className="flex items-center gap-1 shrink-0">
    <span className="text-sm font-semibold min-w-[75px] text-right">
      {formatCurrency(Math.abs(p.valor))}
    </span>
    <DropdownMenu>...</DropdownMenu>
  </div>
</div>
```

A chave e o `min-w-[75px] text-right` no valor e o `mr-2` no container de descricao para criar separacao garantida.

**Linhas 438-461 - Reformatar resumo Pendente/Pago:**

Usar chips com fundo colorido para melhor leitura visual:

```tsx
<div className="flex items-center gap-3 text-xs">
  <div className="flex items-center gap-1.5 bg-destructive/10 px-2 py-1 rounded-full">
    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
    <span className="font-medium text-destructive">
      Pendente: {formatCurrency(totalMes)}
    </span>
  </div>
  <div className="flex items-center gap-1.5 bg-income/10 px-2 py-1 rounded-full">
    <div className="w-1.5 h-1.5 rounded-full bg-income" />
    <span className="font-medium text-income">
      Pago: {formatCurrency(totalPago)}
    </span>
  </div>
  {podePagarFatura && (
    <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs gap-1"
      onClick={() => setPagarFaturaOpen(true)}>
      <Check className="h-3 w-3" /> Pagar fatura
    </Button>
  )}
</div>
```

**Linhas 486 - Adicionar divisores entre itens:**

Trocar `space-y-1` por `divide-y divide-border/50` para separacao visual mais clara entre despesas.

### Resumo das alteracoes

1. Container de descricao com `mr-2` para separar do valor
2. Valor com `min-w-[75px] text-right` para largura minima garantida
3. Parcela inline na descricao (ex: "Aliexpress - 6/12") para economizar espaco vertical
4. Chips coloridos no resumo Pendente/Pago para melhor leitura
5. Divisores sutis entre linhas de despesas


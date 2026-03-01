

# Clique no texto do mês para voltar ao mês atual

## Alterações

### 1. `src/components/FiltroDataRange.tsx` (usado na página de Transações)

- Adicionar variável `isMesAtual` que compara `mesSelecionado` com o mês/ano corrente
- Transformar o `<span>` do label do mês em elemento clicável que reseta para o mês atual
- Adicionar `cursor-pointer` quando não é o mês atual, e `cursor-default` quando já é
- Envolver com `Tooltip` do Radix com texto "Voltar para o mês atual"
- Ao clicar, chamar `setMesSelecionado`, `onStartDateChange` e `onEndDateChange` com o mês atual

### 2. `src/components/dashboard/FiltroPeriodo.tsx` (usado no Dashboard e outras páginas)

- Transformar o `SelectTrigger` / label do mês no seletor em algo que, ao clicar diretamente no texto, resete para o mês atual
- Como esse componente já tem um botão "Hoje" que aparece quando não está no mês atual, a abordagem será adicionar o mesmo comportamento de reset ao clicar no texto do `SelectValue` -- porém, como ele usa um `Select` dropdown, a melhor abordagem é manter o comportamento atual (já tem o botão "Hoje")

**Foco principal: `FiltroDataRange.tsx`** que é o componente mostrado na screenshot e usado em `/transactions`.

### Detalhes técnicos

```tsx
// Nova variável
const isMesAtual = mesSelecionado.getFullYear() === hoje.getFullYear() 
  && mesSelecionado.getMonth() === hoje.getMonth();

// Função de reset
const handleResetMesAtual = () => {
  if (isMesAtual) return;
  const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  setMesSelecionado(mesAtual);
  onStartDateChange(startOfMonth(mesAtual));
  onEndDateChange(endOfMonth(mesAtual));
};

// Label clicável com Tooltip
<Tooltip>
  <TooltipTrigger asChild>
    <span
      onClick={handleResetMesAtual}
      className={cn(
        "text-xs font-medium capitalize min-w-[110px] text-center select-none",
        isMesAtivo && "text-accent-foreground",
        !isMesAtual && "cursor-pointer hover:text-primary",
        isMesAtual && "cursor-default"
      )}
    >
      {mesLabel}
    </span>
  </TooltipTrigger>
  {!isMesAtual && (
    <TooltipContent>Voltar para o mês atual</TooltipContent>
  )}
</Tooltip>
```

O componente será envolvido com `TooltipProvider` para que o tooltip funcione.

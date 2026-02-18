

# Adicionar Seletor de Mes na Barra de Filtros de Transacoes

## O que sera feito

Adicionar um seletor de mes com navegacao por setas (< >) na barra de filtros do componente `FiltroDataRange`, posicionado ao lado dos botoes de atalho ("Hoje", "Mes", "Semana", "30 dias"). Ao selecionar um mes, o intervalo de datas sera automaticamente atualizado para o primeiro e ultimo dia do mes escolhido.

## Comportamento

- Exibe o mes/ano formatado (ex: "fevereiro 2026") com setas de navegacao
- Ao clicar nas setas, navega para o mes anterior ou proximo e atualiza automaticamente startDate e endDate
- Quando o filtro de mes esta ativo (ou seja, startDate = dia 1 e endDate = ultimo dia do mes), o seletor fica visualmente destacado (fundo com cor de accent)
- Os botoes "Hoje", "Semana", "30 dias" continuam funcionando normalmente e desativam o destaque do seletor de mes quando usados

## Mudancas tecnicas

### Arquivo: `src/components/FiltroDataRange.tsx`

1. Adicionar estado local `mesSelecionado` (Date) inicializado com o mes atual
2. Importar `addMonths`, `subMonths`, `isSameDay` de `date-fns` e `ChevronLeft`, `ChevronRight` de `lucide-react`
3. Criar funcao `handleMesNavigation(direcao)` que:
   - Atualiza `mesSelecionado` com `addMonths` ou `subMonths`
   - Chama `onStartDateChange(startOfMonth(novoMes))` e `onEndDateChange(endOfMonth(novoMes))`
4. Criar funcao de deteccao `isMesAtivo` que verifica se o startDate e endDate atuais correspondem exatamente ao primeiro e ultimo dia de algum mes (para destacar visualmente)
5. Inserir o seletor de mes no layout, entre os date pickers e os botoes de atalho, com:
   - Botao seta esquerda (mes anterior)
   - Label capitalizado do mes/ano
   - Botao seta direita (proximo mes)
6. Quando um atalho ("Hoje", "Semana", "30 dias") for clicado, o `mesSelecionado` se ajusta para refletir o mes correspondente

### Layout do seletor

```text
[01/02/26] ate [28/02/26]  | < fevereiro 2026 > |  Hoje  Mes  Semana  30dias  (refresh)
```

O seletor tera borda arredondada, e quando ativo (mes completo selecionado), tera fundo com `bg-accent` e texto `text-accent-foreground` para destaque visual.

## Arquivos modificados

- `src/components/FiltroDataRange.tsx` - Adicionar seletor de mes com navegacao e destaque visual


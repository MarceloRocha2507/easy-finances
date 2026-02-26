
# Tornar Blocos de "Contas a Pagar" Expansiveis/Recolhiveis

## Resumo

Refatorar o componente `ContasAPagar.tsx` para que os blocos "Faturas de Cartao" e "Contas Pendentes" funcionem como acordeoes independentes, iniciando recolhidos. O rodape totalizador permanece sempre visivel.

## Arquivo modificado

| Arquivo | Acao |
|---------|------|
| `src/components/dashboard/ContasAPagar.tsx` | Refatorar blocos como acordeoes |

## Mudancas detalhadas

### Estado
- Substituir o estado `expanded` por dois estados independentes:
  - `faturasOpen` (default: `false`)
  - `contasOpen` (default: `false`)

### Cabecalho clicavel de cada bloco

Cada bloco tera um cabecalho clicavel que exibe:
- Icone + titulo (mantido)
- Badge com contagem: ex "3 faturas" ou "5 contas"
- Valor total do bloco em vermelho
- Icone `ChevronDown` com rotacao animada (`transition-transform duration-300`, `rotate-180` quando aberto)

Estilo do cabecalho:
- `cursor-pointer`
- `hover:bg-gray-50` (hover cinza claro)
- `rounded-lg` com padding

Exemplo visual recolhido:
```text
💳 Faturas de Cartao  [3 faturas]  -R$ 1.753,42  ▼
```

### Conteudo expansivel

- Usar `Collapsible` do Radix (ja disponivel em `@/components/ui/collapsible`) para animacao suave
- O conteudo (lista de itens) fica dentro de `CollapsibleContent`
- O cabecalho fica como `CollapsibleTrigger`

### Bloco "Contas Pendentes" -- botao "Mostrar mais"

O botao "Mostrar mais" dentro do bloco de contas pendentes continua funcionando como antes (limitando a 5 itens), mas agora controlado por um terceiro estado `contasExpanded` separado do estado de abertura do acordeao.

### Rodape totalizador

Permanece **sempre visivel**, fora dos blocos recolhiveis. Sem alteracao no layout ou dados.

### Separador entre blocos

Mantido entre os dois blocos, visivel independente do estado de abertura.

## Detalhes tecnicos

### Imports adicionados
```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
```

### Estrutura de cada bloco
```tsx
<Collapsible open={faturasOpen} onOpenChange={setFaturasOpen}>
  <CollapsibleTrigger asChild>
    <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2.5 transition-colors">
      <span className="text-sm font-semibold flex items-center gap-2">
        💳 Faturas de Cartao
      </span>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {faturasMes.length} {faturasMes.length === 1 ? 'fatura' : 'faturas'}
        </Badge>
        <span className="text-sm font-semibold text-destructive">
          -{formatCurrency(totalCartoes)}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${faturasOpen ? 'rotate-180' : ''}`} />
      </div>
    </div>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* lista de faturas (codigo existente) */}
  </CollapsibleContent>
</Collapsible>
```

Mesma estrutura para o bloco de Contas Pendentes com `contasOpen`.

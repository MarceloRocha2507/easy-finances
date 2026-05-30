## Por que ainda parece antigo

O `NovaCompraCartaoDialog` não foi incluído na varredura anterior — ele tem cabeçalho 100% manual (não usa `<DialogHeader>`) e ainda força:

- `borderRadius: 16` via `style` inline (sobrescreve os 24 do base)
- `boxShadow: 0 8px 32px rgba(0,0,0,0.12)` (sobrescreve a sombra de 4 camadas)
- Header próprio com `bg-white`, sem gradiente
- Botão `X` próprio (já que `[&>button]:hidden` esconde o do base)

Resultado: cantos menores, sombra mais simples, sem faixa gradiente no topo — exatamente o "design antigo" da screenshot.

## Mudanças (somente em `src/components/cartoes/NovaCompraCartaoDialog.tsx`)

1. **Remover overrides do `DialogContent`**
   - Tirar `rounded-2xl` do `className`
   - Remover `borderRadius: 16` e `boxShadow` dos dois `style` (desktop e mobile), deixando o base aplicar 24px + sombra de 4 camadas
   - Manter `[&>button]:hidden`, dimensões e comportamento mobile (slide bottom, safe-area)

2. **Aplicar faixa gradiente no header sticky** (padrão usado em `TotalAPagarCard` / `TransactionDetailsDialog`)
   - `background: linear-gradient(160deg, #fafafe 0%, #f3f0ff 100%)`
   - `borderBottom: 1px solid rgba(0,0,0,0.06)`
   - Título com `fontFamily: var(--font-display)`, `fontSize: 17`, `fontWeight: 700`, `letterSpacing: -0.025em`, cor `#1a1625` (tokens do `DialogTitle` novo)
   - Ajustar paddings para casar com a faixa (sem `bg-white` por baixo)

3. **Padronizar o botão `X` manual** para o estilo novo
   - 28×28, `borderRadius: 8`, fundo `rgba(0,0,0,0.05)` → hover `rgba(0,0,0,0.09)`, cor `#9590aa`

Nada de lógica/estado/validação é alterado — apenas tokens visuais do shell do modal.

## Observação

Se quiser, depois deste posso fazer uma varredura final por outros modais com `borderRadius`/`boxShadow` inline (ex.: `DetalhesCartaoDialog`, `PagarFaturaDialog`, `EditarCompraDialog`) que possam estar no mesmo padrão antigo. Mas começo só pelo Nova Compra para validar o resultado.
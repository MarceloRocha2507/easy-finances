

## Plano: Alinhar cards A Receber e Total a Pagar

O problema é que o `items-start` (adicionado anteriormente) faz cada card manter sua altura natural, e o "Total a Pagar" tem 2 linhas extras de sub-info que o "A Receber" não tem.

### Solução

**Arquivo: `src/pages/Dashboard.tsx` (linha 265)**
- Remover `items-start` do grid para permitir que ambos os cards estiquem à mesma altura (comportamento padrão do grid: `align-items: stretch`)

**Arquivo: `src/components/dashboard/TotalAPagarCard.tsx` (linha 75-80)**
- Adicionar `h-full` ao card wrapper para garantir que preencha o grid cell completamente
- Adicionar `h-full` ao button interno para distribuir o espaço

Isso resolve o problema original (o modal agora abre separadamente em vez de expandir inline, então não há mais risco do card vizinho esticar quando o conteúdo expande) e mantém os dois cards com a mesma altura visual.


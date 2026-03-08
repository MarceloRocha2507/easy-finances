

## Plano

Substituir o `Collapsible` por um `Dialog` no `TotalAPagarCard`. O card continua exibindo o resumo; ao clicar, abre um modal com os detalhes (contas pendentes + faturas cartao + rodape).

**Arquivo: `src/components/dashboard/TotalAPagarCard.tsx`**

1. Remover imports de `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `ChevronDown`
2. Importar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` e `Eye` (ou similar icon)
3. O card vira um `button` simples que seta `open = true`
4. O conteudo detalhado (linhas 112-184) move para dentro de um `DialogContent`
5. Header do modal: "Total a Pagar" com o valor total
6. Manter todo o layout interno (contas pendentes, faturas, rodape) igual


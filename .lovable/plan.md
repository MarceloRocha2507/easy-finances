
# Fix: Botoes de acao desalinhando o valor nas transacoes

## Problema
Os botoes de acao (ver, duplicar, editar, excluir) que aparecem no hover do desktop estao ocupando espaco inline no layout, empurrando o valor monetario para a esquerda e criando um espaco grande e desorganizado entre o valor e os botoes.

## Solucao em `src/pages/Transactions.tsx`

### Mudanca na estrutura do lado direito (valor + acoes)

Atualmente o valor e os botoes estao em sequencia no flex, sem largura fixa. Quando os botoes aparecem, o layout se desloca.

**Abordagem**: Envolver valor + acoes em um container com posicionamento relativo, e colocar os botoes de hover em posicao absoluta, sobrepostos ao conteudo (com fundo branco para cobrir).

**De (linhas ~1284-1388):**
```tsx
{/* Valor */}
<span className="font-semibold tabular-nums ml-2 sm:ml-4 ...">
  {value}
</span>

{/* Acoes */}
<div className="ml-2 flex gap-1">
  {/* Mobile dropdown */}
  <div className="flex md:hidden">...</div>
  {/* Desktop hover buttons */}
  <div className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100">
    ...5 botoes...
  </div>
</div>
```

**Para:**
```tsx
{/* Valor + Acoes container */}
<div className="flex items-center gap-1 ml-2 sm:ml-4 relative">
  {/* Valor - sempre visivel */}
  <span className="font-semibold tabular-nums text-sm sm:text-base shrink-0 ...">
    {value}
  </span>

  {/* Mobile dropdown - posicao normal */}
  <div className="flex md:hidden">...</div>

  {/* Desktop hover - posicao absoluta, aparece sobre o valor */}
  <div className="hidden md:flex items-center gap-0.5
    absolute right-0 top-1/2 -translate-y-1/2
    opacity-0 group-hover:opacity-100 transition-opacity
    bg-white dark:bg-card rounded-md pl-1 pr-0.5 py-0.5
    shadow-sm border border-border/50">
    ...botoes com h-7 w-7 menores...
  </div>
</div>
```

Mudancas chave:
- Botoes de desktop passam a usar `absolute right-0` para se sobrepor ao valor em vez de empurra-lo
- Fundo branco com borda sutil nos botoes para manter legibilidade
- Botoes ligeiramente menores (`h-7 w-7`) para um visual mais compacto
- O valor fica sempre no mesmo lugar, sem deslocamento
- No mobile nada muda (continua usando o dropdown)

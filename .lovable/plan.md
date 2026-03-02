
## Ajuste de Contraste: muted-foreground

### Problema
A cor `--muted-foreground` no modo claro (`hsl(220, 9%, 46%)`) sobre o fundo (`hsl(0, 0%, 98.4%)`) tem ratio de contraste de aproximadamente **4.2:1**, abaixo do minimo WCAG AA de **4.5:1** para texto normal.

No modo escuro o contraste ja passa (~5.8:1), entao so precisa de ajuste no light mode.

### Solucao
Escurecer levemente o `--muted-foreground` do light mode de **46%** para **42%** de lightness. Isso eleva o ratio para ~**5.0:1**, passando o criterio WCAG AA sem alterar visivelmente o design (a cor fica apenas um tom mais escuro).

### Alteracao

**Arquivo: `src/index.css`**
- Linha 25: alterar `--muted-foreground: 220 9% 46%` para `--muted-foreground: 220 9% 42%`

### Impacto
- Todos os textos que usam `text-muted-foreground` ficam levemente mais escuros no modo claro
- Nenhuma alteracao funcional
- Melhoria no score de acessibilidade do Lighthouse
- Modo escuro nao e afetado

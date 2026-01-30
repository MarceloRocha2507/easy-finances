
# Correção: Botão "Registrar e depositar" Ilegível

## Problema Identificado

O botão "Registrar e depositar" está usando a classe `gradient-income` que foi projetada para cards de fundo, não para botões:

```css
.gradient-income {
  @apply bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30;
}
```

Esse gradiente é muito claro (emerald-50, green-50), o que torna o texto praticamente invisível porque não há contraste suficiente.

## Solução

Substituir a classe `gradient-income` por classes que garantam bom contraste:

**Opção recomendada:** Usar um fundo sólido de cor emerald com texto branco.

```tsx
// ANTES (ilegível)
<Button
  size="sm"
  className="flex-1 gradient-income"
  ...
>

// DEPOIS (legível)
<Button
  size="sm"
  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
  ...
>
```

## Alteração

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/components/dashboard/GerenciarMetaDialog.tsx` | 457 | Substituir `gradient-income` por `bg-emerald-500 hover:bg-emerald-600 text-white` |

## Resultado Visual

```text
ANTES:                          DEPOIS:
┌──────────────────────┐        ┌──────────────────────┐
│ [texto invisível]    │   →    │ Registrar e depositar│
│ (fundo verde claro)  │        │ (fundo verde, branco)│
└──────────────────────┘        └──────────────────────┘
```



# Humanizar a listagem de transacoes agrupada

## Problema atual

Os cabecalhos de grupo tem um visual muito "gerado por IA": bordas coloridas fortes, fundos chamativos, icones por grupo, bordas laterais em cada item. Isso cria um visual sobrecarregado e artificial.

## Abordagem

Simplificar drasticamente para parecer um app de banco real (Nubank, Inter, etc.):

- **Cabecalhos de grupo**: trocar por separadores discretos, apenas texto em cinza + subtotal alinhado a direita, sem fundo colorido nem icones
- **Itens individuais**: remover border-l-2 e fundos coloridos por grupo -- cada item ja tem seu icone/cor proprios
- **Chevron de colapsar**: manter, mas mais sutil
- **Espacamento**: usar um separador leve entre grupos em vez de cards coloridos

## Mudancas em `src/pages/Transactions.tsx`

### 1. Simplificar `GRUPO_CONFIG`

Remover `bgClass`, `borderClass`, `headerBg`. Manter apenas `key`, `label`, `colorClass` (para o subtotal) e `icon` (opcional, mais discreto).

### 2. Redesenhar `GroupHeader`

De:
```text
[bg colorido + borda] [icone colorido] [TEXTO COLORIDO BOLD] (3) .... R$ 500,00 [chevron]
```

Para:
```text
Faturas de Cartao                                    R$ 500,00  v
------- (linha fina) -------
```

Visualmente:
- Texto em `text-muted-foreground` com `text-xs uppercase tracking-wider font-medium`
- Subtotal discreto, `text-sm text-muted-foreground`
- Sem fundo colorido, sem borda de card
- Apenas uma linha divisoria sutil embaixo (`border-b border-border`)
- Chevron pequeno e discreto

### 3. Remover estilos dos itens por grupo

Na renderizacao dos itens dentro de cada grupo, remover o wrapper `<div className={cn("rounded-lg", grupoConfig.borderClass, grupoConfig.bgClass)}>`. Renderizar os itens diretamente sem wrapper de cor.

### 4. Ajustar espacamento entre grupos

Trocar `space-y-0.5` por `space-y-4` entre grupos para dar respiro visual. Dentro do grupo, manter `space-y-0` (itens colados).

## Resultado esperado

Uma listagem que parece um extrato bancario limpo:

```text
FATURAS DE CARTAO                           R$ 867,94  v
-------------------------------------------------
  [icone roxo] Fatura Nubank    Em aberto   -R$ 500,00
  [icone roxo] Fatura Inter     Pendente    -R$ 367,94

DESPESAS FIXAS                              R$ 1.200,00  v
-------------------------------------------------
  [icone] Aluguel              01/02        -R$ 900,00
  [icone] Internet             05/02        -R$ 300,00

DESPESAS                                    R$ 450,00  v
-------------------------------------------------
  [icone] Supermercado         Hoje, 14:30  -R$ 250,00
  [icone] Farmacia             Ontem, 09:15 -R$ 200,00
```

## Arquivo modificado

`src/pages/Transactions.tsx`:
- Simplificar `GRUPO_CONFIG` (remover bgClass, borderClass, headerBg)
- Reescrever `GroupHeader` com estilo minimalista
- Remover wrappers coloridos dos itens na renderizacao agrupada (linhas 1092-1115)
- Ajustar espacamento entre grupos


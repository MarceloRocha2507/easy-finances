## Diagnóstico

O código em `src/pages/Dashboard.tsx` **já contém o novo layout** (2 painéis: "Visão Geral" + "Este Mês"). A captura mostrando os 3 cards antigos (Saldo Disponível / Receitas / Despesas soltos) é a versão **em cache** sendo servida ao navegador.

Causas identificadas:

1. **Service Worker antigo persistente.** O projeto teve PWA habilitado anteriormente. Hoje o `src/main.tsx` tenta desregistrar SWs e limpar `caches`, mas isso só roda **depois** que o navegador já carregou o `index.html` cacheado pelo SW antigo — então na primeira visita após o deploy o usuário ainda vê o shell velho. O cleanup só tem efeito a partir do próximo refresh.
2. **Sem versionamento/cache-busting no `index.html`.** Não há `<meta http-equiv="Cache-Control">`, então proxies/CDN/navegador podem reter o HTML antigo (que aponta para um bundle JS antigo).
3. **`workbox-window` ainda nas dependências**, sem uso — apenas peso morto, mas reforça a narrativa de PWA legado.

## O que vai ser feito

### 1. Forçar limpeza síncrona e recarga única (`src/main.tsx`)
- Detectar se há SW registrado **antes** de renderizar o app.
- Se houver: desregistrar, limpar `caches`, e disparar **um único** `location.reload()` (com flag em `sessionStorage` para não criar loop).
- Sem SW: render normal.

Isso garante que qualquer usuário que abra o app com SW antigo recebe imediatamente o bundle novo, sem precisar de refresh manual.

### 2. Adicionar meta tags de no-cache no `index.html`
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```
O HTML deixa de ser cacheado; bundles JS/CSS continuam com hash do Vite (cacheáveis com segurança).

### 3. Remover `workbox-window` do `package.json`
Dependência não utilizada, removendo qualquer chance de reintrodução acidental de PWA.

### 4. Verificação visual
Após o deploy, navegar até `/dashboard` no preview e confirmar via screenshot que os 2 painéis "Visão Geral" + "Este Mês" são exibidos.

## Detalhes técnicos

**Arquivos alterados:**
- `src/main.tsx` — guarda síncrona + reload único via `sessionStorage` flag (`__sw_cleanup_done`).
- `index.html` — 3 metas de cache-control no `<head>`.
- `package.json` — remover `workbox-window`.

**Não alterado:** `Dashboard.tsx`, `Transactions.tsx`, `UnifiedMetricTile.tsx`, `DetalhesDespesasDialog.tsx` — o layout novo já está correto.

## Observação ao usuário

Se mesmo após o deploy você ainda vir o layout antigo em algum dispositivo específico, faça **um hard refresh** (Ctrl+Shift+R no desktop, ou desinstalar e reinstalar o atalho/PWA no celular) — após esse hard refresh único, todos os acessos seguintes virão sempre atualizados.

## Diagnóstico

Os logs mostram **"Service Worker registrado"** três vezes — porém essa mensagem **não existe em nenhum arquivo do código atual**. Isso prova que o navegador do usuário está executando um **bundle JavaScript antigo cacheado** que ainda contém um `serviceWorker.register()` antigo. O HTML novo é entregue com `no-cache` pelo proxy da Lovable, mas o SW antigo intercepta requests e devolve JS antigo do `CacheStorage`, mantendo o app preso na versão antiga em loop.

As tentativas anteriores (`sw.js` que se desregistra e `script` no `<head>`) não foram suficientes porque:
1. O SW antigo ainda intercepta o fetch do bundle JS antes do `unregister` completar.
2. O navegador pode servir o JS antigo do HTTP cache mesmo após o SW ser removido.
3. Não havia bump de versão verificado no client.

## Plano de correção

### 1. `index.html` — kill-switch reforçado no `<head>`
Substituir o script atual por uma versão que:
- Define `APP_VERSION = "1.1.3_20260506_b"`.
- Desregistra **todos** os Service Workers.
- Limpa **todas** as entradas de `CacheStorage`.
- Se detectou SW antigo OU se a versão guardada em `localStorage` é diferente, faz `window.location.replace()` com query string `?__v={versao}_{timestamp}` — isso força o navegador a buscar o `index.html` e o bundle direto da rede, ignorando o HTTP cache.
- Usa flag `sessionStorage.__force_reload_v3` para garantir que o reload aconteça uma única vez por sessão (sem loop).

### 2. `public/sw.js` e `public/service-worker.js` — kill-switch com interceptação
Reescrever ambos para que, enquanto ainda estiverem ativos no navegador do usuário:
- **`install`**: `skipWaiting()`.
- **`activate`**: `clients.claim()` → deletar todos os caches → `client.navigate()` em todas as abas com cache-buster `?__sw_kill={timestamp}` → só então `unregister()`.
- **`fetch`** (NOVO): interceptar requests de navegação e scripts e refazê-los com `cache: "reload"`. Isso garante que, no curtíssimo intervalo entre `activate` e `unregister`, qualquer request do bundle JS bypasse o HTTP cache do navegador. Sem isso o navegador pode continuar servindo bundle antigo do disk cache mesmo após o SW sumir.

### 3. Indicador visual no `SidebarNav.tsx`
Já existe `v1.1.2_20260506` no rodapé — atualizar para `v1.1.3_20260506_b` para que o usuário consiga confirmar visualmente que está na versão nova.

## Resultado esperado

Na próxima vez que o usuário abrir o app:
1. O HTML fresco chega (proxy serve `no-cache`).
2. O script no `<head>` desregistra o SW antigo, limpa caches e dá um único reload com cache-buster.
3. Após o reload, não há mais SW ativo e o bundle vem fresco da rede.
4. O rodapé do menu mostra `v1.1.3_20260506_b` confirmando a versão.

## Detalhes técnicos

- O cache-buster na query string (`?__v=...`) é o que **garantidamente** invalida o HTTP cache do navegador para o `index.html` e, por consequência, para os bundles JS referenciados (Vite gera nomes com hash, então buscar um `index.html` fresco já traz referências aos bundles novos).
- O flag em `sessionStorage` (`__force_reload_v3`) evita loop infinito caso algo falhe.
- O handler de `fetch` no SW é defensivo: mesmo que o navegador demore a desregistrar o SW, qualquer request feita por ele virá com `cache: "reload"`.
- Nenhum arquivo do app principal (componentes, hooks, rotas) precisa ser tocado — o problema é puramente de cache de bootstrap.

## Arquivos alterados
- `index.html` — script kill-switch ampliado
- `public/sw.js` — adiciona handler `fetch` com `cache: "reload"`
- `public/service-worker.js` — espelho do `sw.js`
- `src/components/sidebar/SidebarNav.tsx` — bump da string de versão exibida

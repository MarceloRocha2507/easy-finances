## Causa raiz identificada

Auditando o projeto, encontrei o problema. **O próprio sistema de "kill-switch" que adicionamos é a causa do flip-flop entre versões.** Existem hoje quatro mecanismos competindo entre si para controlar o cache, e eles entram em conflito a cada carregamento:

1. **`index.html`** — Script no `<head>` com `APP_VERSION = "1.1.3_20260506_b"` que faz `window.location.replace()` com query string `?__v=...`.
2. **`src/main.tsx`** — Função `bootstrap()` com **outra** `APP_VERSION = "1.1.2_20260506"` (versão diferente!) que também faz `window.location.replace()` e `window.location.reload()`.
3. **`public/sw.js`** — Service Worker que se auto-instala, intercepta TODOS os fetches de scripts/navegações com `cache: "reload"`, força `client.navigate()` em todas as abas, e só depois se desregistra.
4. **`public/service-worker.js`** — Espelho do anterior, fazendo a mesma coisa em paralelo.

### Por que isso provoca o flip-flop

- **Toda vez que o navegador acessa `/sw.js`**, ele instala um SW novo (porque os arquivos têm `Date.now()` mudando a cada activate). Isso dispara o ciclo `install → activate → claim → clearCaches → client.navigate(?__sw_kill=...) → unregister`.
- **A navegação forçada pelo SW** dispara um novo carregamento do `index.html`, que executa o kill-switch do `<head>`, que detecta SW e força **outro** `location.replace`.
- **`main.tsx`** roda em paralelo, vê versão diferente do `localStorage`, faz **mais um** `location.replace`.
- O `runtime-error` confirma o problema: `Failed to update a ServiceWorker for scope (...) The script resource is behind a redirect, which is disallowed`. O proxy da Lovable serve `/sw.js` com redirect, então o navegador falha em atualizar o SW antigo, e o SW antigo continua vivo, intercepta requests, serve JS do cache, e o usuário vê versão antiga. Na próxima volta, o ciclo recomeça.
- As duas versões diferentes (`1.1.2` em `main.tsx` vs `1.1.3_b` em `index.html`) garantem que os dois mecanismos sempre discordam, gerando um reload eterno.

A documentação interna do Lovable é explícita: **não usar Service Workers em apps Lovable** — o proxy já serve HTML com `no-cache`, então o navegador já revalida em toda navegação. Toda essa camada de cache-busting que adicionamos é desnecessária e está causando o problema que tenta resolver.

## Plano: remover tudo

### 1. `src/main.tsx` — voltar ao mínimo
Remover toda a lógica de `bootstrap()`, `cleanupStaleServiceWorkers`, `APP_VERSION`, `localStorage`, `sessionStorage`. Voltar para o padrão simples:
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### 2. `index.html` — remover script kill-switch e meta tags de cache
- Remover por completo o `<script>` inline com a IIFE de `APP_VERSION` / `maybeReload`.
- Remover as `<meta http-equiv="Cache-Control">`, `Pragma`, `Expires` e `app-version`. Essas meta tags não funcionam para HTTP caching e atrapalham. O proxy da Lovable já entrega os headers corretos.

### 3. `public/sw.js` — neutralizar (kill-switch estático mínimo)
Como dispositivos do usuário podem ter um SW antigo registrado, **não podemos simplesmente apagar o arquivo** — precisamos manter um kill-switch mínimo no caminho `/sw.js` por um ciclo, mas SEM handler de `fetch` (que é o que está intercept-loopando) e SEM forçar `client.navigate` (que é o que dispara reload).

Conteúdo final mínimo:
```js
self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  await self.clients.claim();
  const names = await caches.keys();
  await Promise.all(names.map((n) => caches.delete(n)));
  await self.registration.unregister();
})()));
```
Sem `fetch` handler, sem navegação forçada. O SW se desinstala silenciosamente na próxima visita e o usuário recarrega manualmente uma vez se precisar — sem loop.

### 4. `public/service-worker.js` — mesma neutralização
Idêntico ao `sw.js` para cobrir ambos os caminhos que algum bundle antigo possa ter registrado.

### 5. Remover `vite-plugin-pwa` do `package-lock.json`
O `package.json` não declara `vite-plugin-pwa`, mas o `package-lock.json` ainda tem entradas dele. Como não está em `dependencies`/`devDependencies`, ele não é instalado nem usado pelo `vite.config.ts` (que não importa o plugin). **Não precisa de ação** — só está no lockfile como resíduo histórico.

### 6. `src/components/sidebar/SidebarNav.tsx` — bump da versão exibida
Atualizar o rodapé para `v1.2.0_clean` para que o usuário consiga confirmar visualmente a entrada na nova versão limpa.

## Resultado esperado

- O navegador carrega o `index.html` (proxy Lovable já entrega `no-cache`).
- `main.tsx` monta o app diretamente — sem reloads, sem `location.replace`.
- Se o usuário ainda tiver um SW antigo, na primeira visita o `/sw.js` mínimo se auto-desinstala silenciosamente. Da próxima vez em diante não há mais SW ativo.
- Sem loop, sem flip-flop, sem cache antigo persistente.

## Arquivos alterados

- `src/main.tsx` — reduzido ao bootstrap mínimo do React
- `index.html` — removido script kill-switch e meta tags de cache
- `public/sw.js` — kill-switch mínimo sem `fetch` handler nem `client.navigate`
- `public/service-worker.js` — idem
- `src/components/sidebar/SidebarNav.tsx` — versão exibida atualizada para `v1.2.0_clean`

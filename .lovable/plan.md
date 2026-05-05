# Corrigir: Alterações somem e deploy demora a propagar

## Diagnóstico

A causa raiz é o **PWA / Service Worker** registrado pelo `vite-plugin-pwa`. Os sintomas batem exatamente:

1. **"Alterações somem depois de um tempo"** → o Service Worker está servindo a versão antiga em cache (`runtimeCaching` com `NetworkFirst` no Supabase + `globPatterns` cacheando JS/CSS/HTML). Quando o cache responde, o usuário vê dados/UI antigos.
2. **"Deploy demora muito a atualizar para usuários"** → o navegador continua usando o SW antigo até ele detectar uma nova versão. O `manifest.webmanifest` é carregado pelo `index.html` em todos os usuários, mantendo o ciclo.
3. **Erro confirmado no runtime**: `Failed to update a ServiceWorker ... The script resource is behind a redirect, which is disallowed` — o SW nem consegue se atualizar, ficando preso na versão antiga indefinidamente.

O `src/main.tsx` já tenta desregistrar o SW no boot, mas isso só funciona **depois** que o usuário consegue carregar o app novo — o que pode nunca acontecer se o SW antigo estiver servindo HTML/JS em cache.

## Mudanças

**1. `vite.config.ts`** — Remover completamente o plugin `VitePWA`:
- Remover o import `import { VitePWA } from "vite-plugin-pwa"`.
- Remover o bloco `VitePWA({ ... })` do array de plugins.
- Manter os outros plugins (`react`, `componentTagger`).

**2. `index.html`** — Remover referências PWA que não são mais necessárias:
- Remover `<link rel="manifest" href="/manifest.webmanifest" />` (o arquivo deixa de existir).
- Manter as meta tags `theme-color`, `apple-mobile-web-app-*` e `apple-touch-icon` (são inofensivas e ajudam em "Adicionar à tela de início").

**3. `src/main.tsx`** — Reforçar a limpeza de SW e caches antigos para usuários que já têm o SW instalado:
- Manter o `unregister()` de todos os service workers.
- Adicionar limpeza do `caches` API (`caches.keys()` → `caches.delete(...)`) para apagar caches do Workbox que ainda existam no navegador do usuário.
- Isso garante que, na primeira vez que um usuário existente abrir o app após o deploy, todos os caches sejam limpos.

## Resultado

- Usuários sempre receberão a versão mais recente assim que o deploy concluir (sem espera de invalidação de SW).
- Alterações feitas no app não vão mais "sumir depois de um tempo" — não haverá cache do SW substituindo respostas frescas do Supabase.
- O erro `Failed to update a ServiceWorker` desaparece.

## Trade-off

A app perde a capacidade de funcionar offline (instalar como PWA continua possível via meta tags, mas sem cache offline). Considerando os problemas que o cache vinha causando, é a troca correta. Se no futuro for desejado reativar PWA, deve ser feito com versionamento explícito e estratégia `NetworkFirst` para HTML.

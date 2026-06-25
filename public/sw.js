// Service worker mínimo do AppFinance.
// Objetivo: tornar o app instalável no celular (PWA) SEM reintroduzir
// problema de versão velha. Estratégia network-first, sem precache de
// assets hasheados (JS/CSS) — só guardamos um fallback de navegação offline.

const CACHE = "appfinance-shell-v1";
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  // Ativa a nova versão imediatamente.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove caches antigos de versões anteriores do SW.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Só tratamos GET; o resto vai direto pra rede.
  if (req.method !== "GET") return;

  // Navegações (abrir páginas): tenta a rede; se offline, cai pro shell.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          // Atualiza o shell em cache pra fallback futuro.
          const cache = await caches.open(CACHE);
          cache.put(OFFLINE_URL, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          const cached = await cache.match(OFFLINE_URL);
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Demais GETs (assets, imagens): network-first, sem persistir hash velho.
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});

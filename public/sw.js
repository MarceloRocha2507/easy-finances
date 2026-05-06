// Kill-switch service worker.
// Para QUALQUER cliente que ainda tenha um SW antigo registrado,
// este SW assume controle, limpa todos os caches, força navegação
// para uma URL com cache-buster, e SÓ DEPOIS se desregistra.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          url.searchParams.set("__sw_kill", Date.now().toString());
          await client.navigate(url.toString());
        } catch (e) {
          try {
            client.postMessage({ type: "SW_KILLED_RELOAD" });
          } catch (e2) {
            // ignora
          }
        }
      }

      await self.registration.unregister();
    })()
  );
});

// Interceptar fetches enquanto o SW ainda está vivo e forçar bypass
// de cache para navegações e scripts. Isso impede que JS antigo
// seja servido do HTTP cache no intervalo entre activate e unregister.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (
    request.mode === "navigate" ||
    request.destination === "script" ||
    request.destination === ""
  ) {
    event.respondWith(
      fetch(request, { cache: "reload", credentials: request.credentials })
        .catch(() => fetch(request))
    );
  }
});

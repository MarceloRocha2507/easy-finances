// Kill-switch mínimo: desinstala silenciosamente qualquer SW antigo.
// Sem fetch handler, sem client.navigate — não causa loops.
self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      await self.clients.claim();
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.registration.unregister();
    })()
  )
);

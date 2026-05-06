self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        try {
          const url = new URL(client.url);
          url.searchParams.set("sw-force-reload", Date.now().toString());
          await client.navigate(url.toString());
        } catch (e) {}
      }
      await self.registration.unregister();
    })()
  );
});

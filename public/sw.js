// Kill-switch: any browser that still has this SW registered will
// unregister it on next visit and stop intercepting requests.
self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } finally {
        await self.registration.unregister();
      }
    })()
  )
);
self.addEventListener("fetch", () => {});

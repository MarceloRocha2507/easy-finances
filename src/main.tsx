import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Aggressively kill any leftover Service Worker + caches from prior PWA setup.
// If a SW was active, the browser already loaded the OLD cached HTML/JS shell —
// so we must reload ONCE after cleanup so the user gets the fresh bundle.
// A sessionStorage flag guarantees we never loop.
async function cleanupStaleServiceWorkers(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) return false;
    await Promise.all(registrations.map((r) => r.unregister()));
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    return true;
  } catch {
    return false;
  }
}

async function bootstrap() {
  const alreadyCleaned = sessionStorage.getItem("__sw_cleanup_done") === "1";
  if (!alreadyCleaned) {
    const hadStaleSW = await cleanupStaleServiceWorkers();
    sessionStorage.setItem("__sw_cleanup_done", "1");
    if (hadStaleSW) {
      // Force a one-time hard reload so the freshly-deployed bundle is loaded
      // instead of the cached shell that the old SW served.
      window.location.reload();
      return;
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();

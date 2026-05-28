import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Cleanup assíncrono de SW/caches ANTES de renderizar o app, para evitar que
// assets antigos (de PWA removido) causem flash do design antigo. O guard de
// sessionStorage evita loop de reload caso o browser disk-cache também tenha
// assets residuais após a limpeza.
async function initApp() {
  // Remove ?_cb=... deixado pelo reload de cleanup anterior
  if (window.location.search.includes("_cb=")) {
    const clean = new URL(window.location.href);
    clean.searchParams.delete("_cb");
    history.replaceState(null, "", clean.pathname + clean.search + clean.hash);
  }

  // Guard: se já fizemos cleanup nesta sessão de tab, renderiza direto
  if (!sessionStorage.getItem("sw-cleanup-done")) {
    let needsReload = false;

    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations().catch(() => [] as ServiceWorkerRegistration[]);
      if (regs.length > 0) {
        await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
        needsReload = true;
      }
    }

    if (typeof caches !== "undefined") {
      const names = await caches.keys().catch(() => [] as string[]);
      if (names.length > 0) {
        await Promise.all(names.map((n) => caches.delete(n)));
        needsReload = true;
      }
    }

    if (needsReload) {
      sessionStorage.setItem("sw-cleanup-done", "1");
      const url = new URL(window.location.href);
      url.searchParams.set("_cb", Date.now().toString());
      // replace() para não poluir o histórico de navegação
      window.location.replace(url.toString());
      return; // não renderiza — o reload carregará assets frescos
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

initApp();

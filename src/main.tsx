import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Cleanup agressivo de SW/caches/storage residuais ANTES de renderizar.
// Cobre 3 cenários:
//  1) SW ainda registrado -> unregister + reload
//  2) SW já removido, mas caches da CacheStorage residuais -> limpa + reload
//  3) Nenhum SW/cache, mas assets antigos no disk cache do browser -> força 1 reload
//     "frio" via flag de sessão na primeira visita pós-deploy.
async function initApp() {
  // Remove ?_cb=... deixado por reload anterior
  if (window.location.search.includes("_cb=")) {
    const clean = new URL(window.location.href);
    clean.searchParams.delete("_cb");
    history.replaceState(null, "", clean.pathname + clean.search + clean.hash);
  }

  if (!sessionStorage.getItem("sw-cleanup-done")) {
    let needsReload = false;

    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker
        .getRegistrations()
        .catch(() => [] as ServiceWorkerRegistration[]);
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

    // Marca cleanup como concluído ANTES do reload para evitar loop
    sessionStorage.setItem("sw-cleanup-done", "1");

    if (needsReload) {
      const url = new URL(window.location.href);
      url.searchParams.set("_cb", Date.now().toString());
      window.location.replace(url.toString());
      return;
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

initApp();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Cleanup agressivo de SW/caches residuais ANTES de renderizar.
// Roda em TODA visita (não usa sessionStorage como gate) para garantir que
// novos deploys nunca fiquem "presos" em uma versão antiga no preview.
// Proteção anti-loop: usa o parâmetro `_cb` na URL — se já estiver presente,
// significa que acabamos de recarregar, então não recarrega de novo.
async function initApp() {
  const hasCbParam = window.location.search.includes("_cb=");

  // Limpa o param `_cb` da URL visível (mas mantemos a info via flag local)
  if (hasCbParam) {
    const clean = new URL(window.location.href);
    clean.searchParams.delete("_cb");
    history.replaceState(null, "", clean.pathname + clean.search + clean.hash);
  }

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

  // Só recarrega se encontrou algo PARA limpar E ainda não recarregamos
  // nesta navegação (evita loop infinito).
  if (needsReload && !hasCbParam) {
    const url = new URL(window.location.href);
    url.searchParams.set("_cb", Date.now().toString());
    window.location.replace(url.toString());
    return;
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

initApp();

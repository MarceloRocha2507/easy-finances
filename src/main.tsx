import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-reload quando um chunk lazy falha ao carregar após novo deploy.
// O arquivo JS antigo referenciado pela aba aberta deixa de existir,
// resultando em "Importing a module script failed" / "Failed to fetch dynamically imported module".
const isChunkLoadError = (msg: string) =>
  /Importing a module script failed|Failed to fetch dynamically imported module|Loading chunk [\d]+ failed|Loading CSS chunk/i.test(
    msg
  );

const tryReloadOnce = () => {
  try {
    const KEY = "__chunk_reload_at";
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last > 10_000) {
      sessionStorage.setItem(KEY, String(Date.now()));
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
};

window.addEventListener("error", (e) => {
  if (e?.message && isChunkLoadError(e.message)) tryReloadOnce();
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e?.reason && (e.reason.message || String(e.reason))) || "";
  if (isChunkLoadError(msg)) tryReloadOnce();
});

createRoot(document.getElementById("root")!).render(<App />);

// Registra o service worker (PWA) para permitir instalação no celular.
// Estratégia network-first definida em /sw.js — não cacheia chunks hasheados.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Falha no registro não deve quebrar o app.
    });
  });
}

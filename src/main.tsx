import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Defensive cleanup: desregistra qualquer service worker residual de versões
// antigas (PWA) e limpa todos os caches do navegador. Sem isso, dispositivos
// que tinham SW antigo continuam servindo bundle antigo (design "antigo" piscando).
// Quando SWs são encontrados, força um reload após o cleanup para garantir que
// os assets frescos sejam carregados — evita o flash de design antigo/novo.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      if (regs.length === 0) {
        // Sem SWs registrados — apenas limpa caches residuais se houver
        if (typeof caches !== "undefined") {
          caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).catch(() => {});
        }
        return;
      }
      // Havia SWs registrados: desregistra todos, limpa caches e força reload
      // para garantir que o novo bundle seja carregado do servidor.
      Promise.all(regs.map((r) => r.unregister().catch(() => {})))
        .then(() => {
          if (typeof caches !== "undefined") {
            return caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))));
          }
        })
        .then(() => window.location.reload())
        .catch(() => {});
    })
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);

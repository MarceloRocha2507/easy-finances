import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Defensive cleanup: desregistra qualquer service worker residual de versões
// antigas (PWA) e limpa todos os caches do navegador. Sem isso, dispositivos
// que tinham SW antigo continuam servindo bundle antigo.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister().catch(() => {})))
    .catch(() => {});
  if (typeof caches !== "undefined") {
    caches
      .keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const renderApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
};

const clearPreviewServiceWorkers = async () => {
  if (typeof window === "undefined") return;

  const isLovableHost =
    window.location.hostname.endsWith(".lovable.app") ||
    window.location.hostname.endsWith(".lovableproject.com");

  if (!isLovableHost || !("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (registration) => {
        try {
          await registration.unregister();
        } catch {
          return false;
        }

        return true;
      }),
    );
  } catch {
    // Ignora falhas silenciosamente para não bloquear a inicialização.
  }

  if (!("caches" in window)) return;

  try {
    const cacheKeys = await window.caches.keys();
    await Promise.all(
      cacheKeys.map(async (cacheKey) => {
        try {
          await window.caches.delete(cacheKey);
        } catch {
          return false;
        }

        return true;
      }),
    );
  } catch {
    // Ignora falhas silenciosamente para não bloquear a inicialização.
  }
};

clearPreviewServiceWorkers().finally(renderApp);

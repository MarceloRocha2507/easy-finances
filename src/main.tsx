import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Cleanup any previously registered service workers and their caches.
// The PWA was causing stale content (changes disappearing) and slow deploy
// propagation. We unregister all SWs and wipe Workbox caches so existing
// users immediately receive fresh builds.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((r) => r.unregister());
    })
    .catch(() => {});
}

if ("caches" in window) {
  caches
    .keys()
    .then((names) => Promise.all(names.map((n) => caches.delete(n))))
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);

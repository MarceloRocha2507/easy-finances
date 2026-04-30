import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister any previously registered service workers (PWA SW caused
// stale module fetches and redirect errors in the Lovable preview iframe).
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);

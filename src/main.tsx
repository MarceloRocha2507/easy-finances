import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Versão atual para forçar atualização em caso de cache agressivo
const APP_VERSION = "1.1.2_20260506";

async function cleanupStaleServiceWorkers(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) return false;
    
    // Desregistrar todos os SWs encontrados
    for (const registration of registrations) {
      await registration.unregister();
    }
    
    // Limpar todos os caches
    if ("caches" in window) {
      const names = await caches.keys();
      for (const name of names) {
        await caches.delete(name);
      }
    }
    return true;
  } catch (err) {
    console.error("Erro ao limpar SW:", err);
    return false;
  }
}

async function bootstrap() {
  const storedVersion = localStorage.getItem("__app_version");
  const alreadyCleanedSession = sessionStorage.getItem("__sw_cleanup_done") === "1";

  // Se a versão mudou, forçamos uma limpeza geral
  if (storedVersion !== APP_VERSION) {
    await cleanupStaleServiceWorkers();
    localStorage.setItem("__app_version", APP_VERSION);
    sessionStorage.setItem("__sw_cleanup_done", "1");
    
    // Adicionamos um parâmetro de bust para garantir que o index.html novo seja baixado
    const url = new URL(window.location.href);
    url.searchParams.set("v", APP_VERSION);
    window.location.replace(url.toString());
    return;
  }

  // Se não limpou nesta sessão (mas a versão bate), fazemos uma verificação rápida
  if (!alreadyCleanedSession) {
    const hadStaleSW = await cleanupStaleServiceWorkers();
    sessionStorage.setItem("__sw_cleanup_done", "1");
    if (hadStaleSW) {
      window.location.reload();
      return;
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();

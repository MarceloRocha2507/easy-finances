import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Registrar Service Worker para PWA
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Nova versão disponível, atualizando automaticamente em 3s...');
    // Auto-update after 3 seconds — no user action needed
    setTimeout(() => {
      updateSW(true);
    }, 3000);
  },
  onOfflineReady() {
    console.log('AppFinance pronto para uso offline');
  },
  onRegistered(registration) {
    console.log('Service Worker registrado:', registration);
    // Check for updates every 60 seconds
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('Erro ao registrar Service Worker:', error);
  },
});

createRoot(document.getElementById("root")!).render(<App />);

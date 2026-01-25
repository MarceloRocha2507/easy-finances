import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Registrar Service Worker para PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão do AppFinance disponível! Deseja atualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('AppFinance pronto para uso offline');
  },
  onRegistered(registration) {
    console.log('Service Worker registrado:', registration);
  },
  onRegisterError(error) {
    console.error('Erro ao registrar Service Worker:', error);
  },
});

createRoot(document.getElementById("root")!).render(<App />);

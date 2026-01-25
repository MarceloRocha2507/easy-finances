

## Plano: Corrigir Instalação do PWA em Celulares

### Problema
O PWA não está oferecendo a opção de instalação porque:
1. O Service Worker não está sendo registrado corretamente
2. O manifest não está linkado no HTML
3. No iOS, a instalação só funciona manualmente (não há botão automático)

### Mudanças Necessárias

#### 1. Adicionar Link do Manifest no index.html
Adicionar a referência ao arquivo manifest que é gerado pelo vite-plugin-pwa:

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

#### 2. Registrar o Service Worker no main.tsx
O vite-plugin-pwa gera um virtual module que precisa ser importado para registrar o SW:

```typescript
import { registerSW } from 'virtual:pwa-register';

// Registrar Service Worker com atualização automática
const updateSW = registerSW({
  onNeedRefresh() {
    // Nova versão disponível
    if (confirm('Nova versão disponível! Deseja atualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App pronto para uso offline');
  },
});
```

#### 3. Adicionar Declaração de Tipo para o Virtual Module
Criar arquivo de tipos para o TypeScript reconhecer o módulo virtual:

```typescript
// src/vite-env.d.ts (adicionar)
declare module 'virtual:pwa-register' {
  export function registerSW(options?: {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }): (reloadPage?: boolean) => Promise<void>;
}
```

#### 4. Melhorar Página de Instalação para iOS
Adicionar detecção mais clara quando o usuário está no iOS/Safari e mostrar instruções mais destacadas, já que nesse caso não há prompt automático.

---

### Seção Técnica

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `index.html` | Adicionar `<link rel="manifest" href="/manifest.webmanifest" />` |
| `src/main.tsx` | Importar e registrar o Service Worker via virtual:pwa-register |
| `src/vite-env.d.ts` | Adicionar declaração de tipo para virtual:pwa-register |
| `src/pages/Instalar.tsx` | Melhorar UX para iOS com instruções mais visíveis |

#### Código do main.tsx atualizado

```typescript
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
```

#### Melhorias na página Instalar.tsx

- Adicionar destaque visual para iOS (banner no topo)
- Adicionar animação/GIF ilustrativo dos passos
- Adicionar verificação se está no Safari (requisito para iOS)
- Mostrar alerta se usuário iOS estiver em outro navegador

---

### Comportamento Esperado Após Correções

| Dispositivo | Comportamento |
|-------------|---------------|
| **Android (Chrome)** | Botão "Instalar AppFinance" aparece automaticamente |
| **Android (outros)** | Instruções manuais são exibidas |
| **iOS (Safari)** | Instruções visuais destacadas para instalação manual |
| **iOS (outros browsers)** | Alerta informando que precisa usar Safari |
| **Desktop (Chrome/Edge)** | Ícone de instalação na barra de endereço |

---

### Como Testar

1. **Publicar o app** (clique em Publish/Atualizar)
2. Acessar **https://sys-finance.lovable.app/instalar** pelo celular
3. **Android**: O botão "Instalar" deve aparecer automaticamente
4. **iOS**: Seguir as instruções manuais usando Safari

**Importante**: A instalação só funciona na versão publicada (HTTPS), não na preview.


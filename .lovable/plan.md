
## Plano: Transformar o Sistema em PWA (Progressive Web App)

### O que é um PWA?
Um PWA (Progressive Web App) permite que seu app financeiro seja **instalado diretamente no celular** a partir do navegador, funcionando como um app nativo. Os usuários podem adicionar à tela inicial, usar offline e receber atualizações automáticas.

### Benefícios para o AppFinance
- Acesso rápido pela tela inicial do celular
- Funciona mesmo sem internet (dados em cache)
- Carregamento mais rápido após a primeira visita
- Experiência similar a um app nativo
- Não precisa de App Store

---

## Mudanças Planejadas

### 1. Instalar e Configurar o Plugin PWA do Vite

Instalar o pacote `vite-plugin-pwa` e configurar no `vite.config.ts` com as opções necessárias para gerar o Service Worker automaticamente.

### 2. Criar o Manifest do PWA

Configurar o manifest com:
- Nome: "AppFinance - Gestão Financeira"
- Nome curto: "AppFinance"
- Cor do tema: azul escuro (#3d4b5c) baseado na cor primária do sistema
- Cor de fundo: branco (#fcfcfc)
- Orientação: portrait
- Display: standalone (parece app nativo)

### 3. Criar Ícones PWA

Criar ícones em múltiplos tamanhos (192x192 e 512x512) para diferentes dispositivos e situações (ícone do app, splash screen, etc).

### 4. Adicionar Meta Tags Mobile no index.html

Adicionar tags essenciais:
- `apple-touch-icon` para iOS
- `theme-color` para a barra de status
- `apple-mobile-web-app-capable` para fullscreen no iOS
- `apple-mobile-web-app-status-bar-style`

### 5. Criar Página de Instalação (/instalar)

Uma página dedicada com:
- Instruções visuais de como instalar
- Botão "Instalar App" que aciona o prompt nativo
- Detecção automática do dispositivo (iOS/Android)
- Instruções específicas por plataforma

### 6. Registrar o Service Worker

Configurar o registro do Service Worker no `main.tsx` para:
- Atualização automática quando há nova versão
- Estratégia de cache para assets estáticos
- Fallback offline

---

## Seção Técnica

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `package.json` | Adicionar dependência `vite-plugin-pwa` |
| `vite.config.ts` | Configurar VitePWA plugin |
| `index.html` | Adicionar meta tags mobile e PWA |
| `public/pwa-192x192.png` | Criar ícone 192x192 |
| `public/pwa-512x512.png` | Criar ícone 512x512 |
| `public/apple-touch-icon.png` | Criar ícone para iOS |
| `src/pages/Instalar.tsx` | Nova página de instalação |
| `src/App.tsx` | Adicionar rota /instalar |

### Configuração do vite.config.ts

```typescript
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
    manifest: {
      name: 'AppFinance - Gestão Financeira',
      short_name: 'AppFinance',
      description: 'Gerencie suas finanças pessoais de forma simples e eficiente.',
      theme_color: '#3d4b5c',
      background_color: '#fcfcfc',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 300 }
          }
        }
      ]
    }
  })
]
```

### Meta Tags no index.html

```html
<meta name="theme-color" content="#3d4b5c" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="AppFinance" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
```

### Página de Instalação (src/pages/Instalar.tsx)

A página incluirá:
- Hook `useEffect` para capturar o evento `beforeinstallprompt`
- Detecção de iOS vs Android
- Botão que chama `prompt()` no evento capturado
- Instruções visuais (com ícones) para instalação manual no iOS
- Verificação se já está instalado (`navigator.standalone` ou `display-mode: standalone`)

### Estrutura da Página de Instalação

```tsx
// Estados
const [deferredPrompt, setDeferredPrompt] = useState(null);
const [isIOS, setIsIOS] = useState(false);
const [isInstalled, setIsInstalled] = useState(false);

// Capturar evento de instalação
useEffect(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setDeferredPrompt(e);
  });
}, []);

// Instalar
const handleInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      toast.success('App instalado com sucesso!');
    }
  }
};
```

---

## Critérios de Aceite

1. O app pode ser instalado no celular (Android e iOS)
2. Ao abrir instalado, abre em tela cheia (sem barra do navegador)
3. Ícone do app aparece corretamente na tela inicial
4. Existe uma página `/instalar` com instruções claras
5. O app funciona offline para páginas já visitadas
6. Atualizações são aplicadas automaticamente

---

## Teste Manual

1. Acessar o app pelo celular
2. Android: Ver banner de instalação ou ir em menu → "Adicionar à tela inicial"
3. iOS: Ir em Compartilhar → "Adicionar à Tela de Início"
4. Abrir o app instalado e verificar que abre em fullscreen
5. Desligar internet e verificar que páginas em cache ainda funcionam

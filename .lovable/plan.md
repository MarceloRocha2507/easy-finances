
# Plano: Sistema de Notificações Push para Todos os Dispositivos

## Visão Geral

O sistema atual possui alertas **internos** (gerados no frontend) mas **não envia notificações push** quando o app está fechado. Vamos implementar Web Push Notifications usando a API Push padrão, que funciona em:

| Plataforma | Suporte |
|------------|---------|
| Android (Chrome, Firefox, Edge) | Completo |
| Desktop (Chrome, Firefox, Edge) | Completo |
| iOS 16.4+ (Safari PWA) | Completo (quando instalado) |

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React PWA)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Solicitar permissão do usuário                                          │
│  2. Obter subscription do PushManager                                       │
│  3. Enviar subscription para o backend                                      │
│  4. Service Worker recebe e exibe notificações                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BANCO DE DADOS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Tabela: push_subscriptions                                                 │
│  - user_id, endpoint, p256dh, auth, device_name, created_at                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDGE FUNCTION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  send-push-notification                                                     │
│  - Recebe user_id + mensagem                                                │
│  - Busca subscriptions do usuário                                           │
│  - Envia via Web Push Protocol (VAPID)                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementação Detalhada

### Fase 1: Configuração VAPID

**O que são VAPID keys?**
São chaves criptográficas necessárias para enviar notificações push de forma segura. Precisaremos:
- Uma chave pública (usada no frontend)
- Uma chave privada (usada no backend)

**Ação necessária do usuário:**
Você precisará gerar as chaves VAPID e configurá-las como segredos no projeto:
- `VAPID_PUBLIC_KEY` - Chave pública
- `VAPID_PRIVATE_KEY` - Chave privada
- `VAPID_SUBJECT` - Email de contato (ex: mailto:seu@email.com)

### Fase 2: Banco de Dados

**Nova tabela: `push_subscriptions`**

```sql
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- RLS para permitir apenas o próprio usuário gerenciar suas subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);

-- Índice para busca rápida por usuário
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);
```

### Fase 3: Service Worker Customizado

**Novo arquivo: `public/sw-push.js`**

O Service Worker será responsável por:
1. Receber eventos `push` do navegador
2. Exibir a notificação com ícone, badge e ações
3. Lidar com cliques para abrir o app

```javascript
// Evento de push recebido
self.addEventListener('push', function(event) {
  const data = event.data?.json() || {
    title: 'AppFinance',
    body: 'Você tem uma nova notificação',
    icon: '/pwa-192x192.png',
    url: '/notificacoes'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Dispensar' }
      ]
    })
  );
});

// Clique na notificação
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
```

### Fase 4: Hook de Push Notifications

**Novo arquivo: `src/hooks/usePushNotifications.ts`**

```typescript
// Funcionalidades do hook:
// - Verificar suporte a Push no navegador
// - Verificar permissão atual
// - Solicitar permissão ao usuário
// - Registrar subscription no backend
// - Remover subscription (desativar)
// - Verificar se está registrado

export function usePushNotifications() {
  // Estado: permission, isRegistered, isLoading
  
  // requestPermission(): Solicita permissão e registra
  // unsubscribe(): Remove subscription do backend
  // isSupported: boolean indicando se o navegador suporta
  
  return { ... };
}
```

### Fase 5: Edge Function para Envio

**Novo arquivo: `supabase/functions/send-push-notification/index.ts`**

```typescript
// Recebe: user_id, title, body, url, tipo
// 1. Busca todas as subscriptions do usuário
// 2. Para cada subscription, envia via Web Push
// 3. Remove subscriptions inválidas (expiradas)
// 4. Retorna status de envio
```

**Dependência necessária:** `web-push` (biblioteca para enviar notificações)

### Fase 6: Integração na UI

**Atualizar: `src/pages/ConfiguracoesNotificacoes.tsx`**

Adicionar seção no topo da página:

```text
┌─────────────────────────────────────────────────────────────┐
│  🔔 Notificações Push                                       │
│                                                             │
│  Receba alertas mesmo quando o app estiver fechado         │
│                                                             │
│  Dispositivo atual: [iPhone de João]                        │
│  Status: ✅ Ativado                    [Desativar]          │
│                                                             │
│  Outros dispositivos registrados: 2                         │
└─────────────────────────────────────────────────────────────┘
```

**Atualizar: `vite.config.ts`**

Configurar o PWA para incluir o service worker de push:

```typescript
VitePWA({
  // ... configurações existentes
  workbox: {
    // Importar script de push
    importScripts: ['/sw-push.js'],
  },
})
```

### Fase 7: Gatilhos para Envio

**Cenários de envio de notificações:**

| Evento | Gatilho | Prioridade |
|--------|---------|------------|
| Fatura vence hoje | Cron job diário às 9h | Alta |
| Conta vence hoje | Cron job diário às 9h | Alta |
| Limite crítico (≥90%) | Após compra no cartão | Alta |
| Meta atingida | Após transação | Média |
| Orçamento estourado | Após transação | Média |

**Nova Edge Function: `check-and-notify`**

- Executada via cron job
- Verifica condições para cada usuário
- Envia notificações baseadas nas preferências

**Database Trigger (opcional futuro):**

- Trigger após INSERT em `compras_cartao`
- Chama edge function se limite atingir 90%

## Resumo dos Arquivos

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| Migração SQL | Novo | Tabela `push_subscriptions` |
| `public/sw-push.js` | Novo | Service Worker para receber push |
| `src/hooks/usePushNotifications.ts` | Novo | Hook para gerenciar subscriptions |
| `supabase/functions/send-push-notification/index.ts` | Novo | Edge function para enviar |
| `supabase/functions/check-and-notify/index.ts` | Novo | Verificação e envio automático |
| `src/pages/ConfiguracoesNotificacoes.tsx` | Atualizar | UI para ativar/desativar push |
| `vite.config.ts` | Atualizar | Importar sw-push.js |
| `src/main.tsx` | Atualizar | Registrar service worker de push |

## Requisitos do Usuário

Antes de implementar, será necessário configurar os segredos VAPID:

1. **VAPID_PUBLIC_KEY** - Chave pública para o frontend
2. **VAPID_PRIVATE_KEY** - Chave privada para o backend
3. **VAPID_SUBJECT** - Email de contato (formato: mailto:email@exemplo.com)

Posso gerar essas chaves automaticamente durante a implementação.

## Limitações Conhecidas

| Plataforma | Limitação |
|------------|-----------|
| iOS Safari (não PWA) | Não suporta push |
| iOS PWA < 16.4 | Não suporta push |
| Firefox Android | Suporte limitado |

## Tempo Estimado

Implementação completa: **40-50 minutos**

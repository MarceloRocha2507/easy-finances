

# Sistema de Multiplos Dispositivos

## Resumo

Implementar controle de dispositivos conectados por usuario, com limite baseado em um campo "addon" no perfil. Cada login registra o dispositivo; ao atingir o limite, a sessao mais antiga e desconectada automaticamente. O usuario pode gerenciar seus dispositivos na pagina de Seguranca.

---

## 1. Banco de Dados

### 1.1. Nova coluna na tabela `profiles`

Adicionar campo `dispositivos_extras` (integer, default 0) para controlar quantos dispositivos extras o usuario adquiriu. O limite total sera: **1 (base) + dispositivos_extras**.

### 1.2. Nova tabela `device_sessions`

```text
device_sessions
  id              uuid (PK, default gen_random_uuid())
  user_id         uuid (NOT NULL)
  device_name     text (NOT NULL) -- ex: "Chrome - Windows"
  device_type     text (NOT NULL) -- "desktop" ou "mobile"
  ip_address      text
  last_active_at  timestamptz (default now())
  created_at      timestamptz (default now())
  session_token   text (NOT NULL) -- hash do refresh token para identificar sessao
  is_active       boolean (default true)
```

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

---

## 2. Logica de Controle de Dispositivos

### 2.1. Hook `useDeviceSessions`

**Arquivo:** `src/hooks/useDeviceSessions.ts`

Responsabilidades:
- **Registrar dispositivo no login:** Detectar tipo (mobile/desktop via `navigator.userAgent`), gerar nome amigavel, salvar na tabela
- **Verificar limite:** Consultar `profiles.dispositivos_extras`, calcular limite total, contar sessoes ativas
- **Desconectar excedentes:** Se acima do limite, desativar (`is_active = false`) a sessao com `last_active_at` mais antigo
- **Listar dispositivos:** Query de todos os dispositivos do usuario
- **Desconectar manualmente:** Marcar sessao como `is_active = false`
- **Heartbeat:** Atualizar `last_active_at` periodicamente (a cada 5 min) para saber qual dispositivo esta ativo

### 2.2. Integracao no `useAuth`

**Arquivo:** `src/hooks/useAuth.tsx`

- Apos login bem-sucedido (no `onAuthStateChange` com evento `SIGNED_IN`), chamar funcao de registro de dispositivo via `setTimeout(0)` (seguindo o padrao de nao fazer chamadas async dentro do callback)
- Ao fazer `signOut`, marcar a sessao do dispositivo atual como inativa

### 2.3. Deteccao de Dispositivo

Funcao utilitaria que extrai:
- **device_type:** "mobile" se `userAgent` contiver mobile/tablet, senao "desktop"
- **device_name:** Combinacao de navegador + SO (ex: "Chrome - Windows", "Safari - iPhone")

---

## 3. Interface - Gestao de Dispositivos

### 3.1. Secao na pagina de Seguranca

**Arquivo:** `src/pages/profile/Seguranca.tsx`

Adicionar nova secao "Dispositivos Conectados" entre "Sessao Ativa" e "Zona de Perigo":

- **Cabecalho:** Icone de monitor + "Dispositivos Conectados" + badge "X/Y ativos"
- **Lista de dispositivos:** Card para cada dispositivo com:
  - Icone (Monitor para desktop, Smartphone para mobile)
  - Nome do dispositivo (ex: "Chrome - Windows")
  - Data do ultimo acesso (tempo relativo, ex: "ha 2 minutos")
  - Badge de status: verde "Ativo" / cinza "Inativo"
  - Badge "Este dispositivo" para o dispositivo atual
  - Botao "Desconectar" (exceto para o dispositivo atual)
- **Indicador visual:** Barra de progresso mostrando "Dispositivos: 1/2"

### 3.2. Notificacoes

Quando um dispositivo for desconectado automaticamente (por exceder o limite):
- Criar notificacao toast informando "Dispositivo [nome] foi desconectado por limite atingido"
- Sugerir verificar seguranca da conta

---

## 4. Sincronizacao em Tempo Real

### 4.1. Realtime na tabela `device_sessions`

Habilitar realtime para `device_sessions` para que, quando uma sessao for desativada em outro dispositivo, o dispositivo afetado receba a notificacao em tempo real.

No hook `useDeviceSessions`, escutar mudancas via `supabase.channel()` com `postgres_changes` para:
- Detectar quando a sessao atual foi desativada -> exibir alerta e redirecionar para login
- Atualizar a lista de dispositivos em tempo real

### 4.2. Dados ja sincronizados

Os dados financeiros ja sao buscados via react-query e RLS, entao alteracoes feitas em um dispositivo ja aparecem ao recarregar no outro. Para sincronizacao instantanea, pode-se adicionar realtime nas tabelas principais futuramente (fora do escopo inicial).

---

## 5. Plano de Limites Atualizado

### `usePlanLimits.ts`

Adicionar `dispositivos` ao `PlanLimits`:

```text
teste:      1 dispositivo (base)
mensal:     1 dispositivo (base) + dispositivos_extras
anual:      2 dispositivos (base) + dispositivos_extras
ilimitado:  ilimitado
```

O campo `dispositivos_extras` no perfil funciona como addon, somando ao limite base do plano.

---

## 6. Admin

### `src/components/admin/EditarUsuarioDialog.tsx`

Adicionar campo para o admin ajustar `dispositivos_extras` do usuario (input numerico, 0-5).

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migracao SQL | **Criar** - Tabela `device_sessions`, coluna `dispositivos_extras` em profiles, realtime |
| `src/hooks/useDeviceSessions.ts` | **Criar** - Hook completo de gestao de dispositivos |
| `src/lib/deviceUtils.ts` | **Criar** - Funcoes de deteccao de dispositivo |
| `src/hooks/useAuth.tsx` | **Modificar** - Integrar registro de dispositivo no login/logout |
| `src/pages/profile/Seguranca.tsx` | **Modificar** - Adicionar secao de gestao de dispositivos |
| `src/hooks/usePlanLimits.ts` | **Modificar** - Adicionar limite de dispositivos |
| `src/components/admin/EditarUsuarioDialog.tsx` | **Modificar** - Campo dispositivos extras |

---

## Fluxo Resumido

```text
Login -> Detectar dispositivo -> Registrar sessao -> Verificar limite
  |                                                       |
  |                                     Acima do limite? ---> Desativar sessao mais antiga
  |                                                       |       |
  |                                                       |   Notificar via realtime
  |                                                       |
  v                                     Dentro do limite ---> Prosseguir normalmente
Dashboard
  |
  +--- Heartbeat a cada 5min (atualiza last_active_at)
  |
  +--- Listener realtime: se minha sessao foi desativada -> alert + redirect /auth
```


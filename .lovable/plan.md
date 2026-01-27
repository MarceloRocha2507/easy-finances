
# Plano: Remover Versão Demonstração do Sistema

## Escopo da Remoção

A funcionalidade de conta demonstrativa está distribuída em:

| Local | Descrição |
|-------|-----------|
| `src/pages/Auth.tsx` | Seção de demo na página de login + botão "Entrar na conta demo" |
| `src/components/DemoBanner.tsx` | Banner que aparece quando o usuário demo está logado |
| `src/components/Layout.tsx` | Detecção de usuário demo e renderização do banner |
| `supabase/functions/seed-demo-account/` | Edge Function que popula dados fictícios |
| `supabase/config.toml` | Configuração da Edge Function |
| `cron.job` (banco de dados) | Job agendado que reseta a conta a cada 6 horas |

## Mudanças Necessárias

### 1. Página de Login (`src/pages/Auth.tsx`)

**Remover completamente:**
- Constantes `DEMO_EMAIL` e `DEMO_PASSWORD` (linhas 11-12)
- Função `handleDemoLogin` (linhas 45-62)
- Função `copyToClipboard` (linhas 64-68)
- Estado `copiedField` (linha 21)
- Imports `Eye`, `Copy`, `Check` do lucide-react
- Card "Demo Account Section" completo (linhas 138-201)

**Resultado**: Página de login limpa, apenas com formulário de email/senha.

### 2. Layout (`src/components/Layout.tsx`)

**Remover:**
- Import do `DemoBanner` (linha 9)
- Constante `DEMO_EMAIL` (linha 35)
- Variável `isDemoUser` (linha 114)
- Renderização condicional do `DemoBanner` (linha 350)

### 3. Componente DemoBanner

**Deletar arquivo completo:**
- `src/components/DemoBanner.tsx`

### 4. Edge Function

**Deletar pasta completa:**
- `supabase/functions/seed-demo-account/`

### 5. Configuração Supabase (`supabase/config.toml`)

**Remover seção:**
```toml
[functions.seed-demo-account]
verify_jwt = false
```

### 6. Job Agendado (pg_cron)

**Criar migração SQL para remover:**
```sql
-- Remover job agendado de reset da conta demo
SELECT cron.unschedule('reset-demo-account');
```

## Resumo das Mudanças

| Arquivo | Ação |
|---------|------|
| `src/pages/Auth.tsx` | Simplificar (remover seção demo) |
| `src/components/Layout.tsx` | Remover lógica de demo |
| `src/components/DemoBanner.tsx` | **DELETAR** |
| `supabase/functions/seed-demo-account/index.ts` | **DELETAR** |
| `supabase/config.toml` | Remover configuração da function |
| Nova migração SQL | Remover cron job |

## Resultado Final

A página de login terá apenas:
```
┌─────────────────────────────┐
│           Fina              │
│   Gestão financeira pessoal │
├─────────────────────────────┤
│ E-mail                      │
│ [____________________]      │
│                             │
│ Senha                       │
│ [____________________]      │
│                             │
│ [        Entrar         ]   │
└─────────────────────────────┘
  Ao continuar, você concorda...
```

Sem seção de demo, sem banner, sem job agendado.

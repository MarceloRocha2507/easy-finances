

# Versionamento incremental automatico

## Abordagem

Gerar um numero de build automatico e incremental a cada deploy, sem precisar alterar nada manualmente. O numero sera derivado do tempo decorrido desde o lancamento do app, garantindo que sempre aumente.

## Como funciona

O sistema calcula quantos minutos se passaram desde a data de lancamento (24/02/2026). Cada build gera um numero unico e crescente.

Exemplos na sidebar:
- Primeiro deploy: `Build #1`
- Deploy 2 horas depois: `Build #120`
- Deploy no dia seguinte: `Build #1500`

## Detalhes tecnicos

### 1. `src/lib/version.ts`

Substituir o sufixo de data pelo calculo de build incremental:

```typescript
declare const __BUILD_DATE__: string;

export const APP_VERSION = "1.0.0";
export const APP_BUILD_DATE = __BUILD_DATE__;

// Numero de build = minutos desde o lancamento
const LAUNCH_DATE = new Date("2026-02-24T00:00:00Z");
const buildDate = new Date(APP_BUILD_DATE);
export const APP_BUILD_NUMBER = Math.floor(
  (buildDate.getTime() - LAUNCH_DATE.getTime()) / 60000
);

export const APP_VERSION_DISPLAY = `Build #${APP_BUILD_NUMBER}`;
```

### 2. `src/components/sidebar/SidebarUserSection.tsx`

Ajustar a exibicao no rodape (remover o prefixo "v" ja que agora mostra "Build #N"):

```typescript
// De:
v{APP_VERSION_DISPLAY}
// Para:
{APP_VERSION_DISPLAY}
```

### 3. `vite.config.ts`

Sem alteracao. O `__BUILD_DATE__` ja esta sendo injetado corretamente.

### 4. `src/pages/Changelog.tsx` e `src/components/WhatsNewDialog.tsx`

Sem alteracao. Continuam usando `APP_VERSION` para controle de changelog.

## Resultado

- Cada deploy gera automaticamente um numero de build unico e crescente
- Nenhuma acao manual necessaria
- O changelog continua controlado pela versao semantica (1.0.0)
- Visual limpo no rodape: "Build #1234"


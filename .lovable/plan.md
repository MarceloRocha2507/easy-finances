

# Versao automatica no build

## Problema

A versao do sistema (`APP_VERSION = "1.0.0"`) e um valor estatico em `src/lib/version.ts`. Quando voce publica uma atualizacao (Update), o valor nao muda porque ninguem o incrementa manualmente.

## Solucao

Usar o Vite para injetar automaticamente a data/hora do build como identificador de versao. Assim, cada vez que o app for publicado, a versao reflete o momento do deploy.

A versao ficara no formato: `1.0.0+YYMMDD.HHmm` (ex: `1.0.0+260224.1430`), mantendo a versao semantica base mas adicionando um sufixo de build unico.

## Alteracoes

### 1. `vite.config.ts`

Adicionar um `define` que injeta a data/hora do build como variavel global:

```typescript
define: {
  __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
}
```

### 2. `src/lib/version.ts`

- Declarar `__BUILD_DATE__` como variavel global
- Criar `APP_BUILD_DATE` a partir dela
- Gerar `APP_VERSION_DISPLAY` que combina a versao base com o sufixo de build (ex: `1.0.0+260224.1430`)
- Manter `APP_VERSION` como versao semantica base para o changelog e comparacao no `WhatsNewDialog`

```typescript
declare const __BUILD_DATE__: string;

export const APP_VERSION = "1.0.0"; // versao semantica (manual)
export const APP_BUILD_DATE = __BUILD_DATE__;

// Gera sufixo: YYMMDD.HHmm
const bd = new Date(APP_BUILD_DATE);
const suffix = [
  String(bd.getFullYear()).slice(2),
  String(bd.getMonth() + 1).padStart(2, "0"),
  String(bd.getDate()).padStart(2, "0"),
  ".",
  String(bd.getHours()).padStart(2, "0"),
  String(bd.getMinutes()).padStart(2, "0"),
].join("");

export const APP_VERSION_DISPLAY = `${APP_VERSION}+${suffix}`;
```

### 3. `src/components/sidebar/SidebarUserSection.tsx`

Trocar `APP_VERSION` por `APP_VERSION_DISPLAY` para exibir a versao com sufixo de build no rodape da sidebar.

### 4. `src/pages/Changelog.tsx` e `src/components/WhatsNewDialog.tsx`

Sem alteracao. Continuam usando `APP_VERSION` (versao semantica) para controle de changelog e notificacao.

## Resultado

- Cada deploy gera uma versao unica visivel na sidebar (ex: `v1.0.0+260224.1430`)
- O changelog continua controlado manualmente pela versao semantica
- O `WhatsNewDialog` so aparece quando a versao semantica base muda (novo release real)


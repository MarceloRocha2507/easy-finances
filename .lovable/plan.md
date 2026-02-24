
# Sistema de Versionamento do Aplicativo

## Visao geral

Implementar um sistema completo de versionamento com: arquivo centralizado de versao/changelog, indicador visual na sidebar, modal "O que ha de novo" com controle via localStorage, e pagina de historico de versoes.

## Arquivos a criar

### 1. `src/lib/version.ts` - Arquivo centralizado de versao e changelog

Contem a constante `APP_VERSION` e o array `CHANGELOG` com o historico de todas as versoes. Cada entrada tem:
- `version`: string no formato semver (ex: "1.0.0")
- `date`: string com data de lancamento (ex: "2026-02-24")
- `title`: titulo curto da versao
- `changes`: array de objetos com `type` ("feature" | "fix" | "improvement") e `description`

Versao inicial `1.0.0` com changelog descrevendo o lancamento do sistema financeiro.

### 2. `src/components/WhatsNewDialog.tsx` - Modal "O que ha de novo"

- Dialog/modal que exibe as mudancas da versao mais recente
- Ao montar, verifica `localStorage.getItem("app_last_seen_version")`
- Se a versao salva for diferente da `APP_VERSION`, abre automaticamente
- Ao fechar, grava `localStorage.setItem("app_last_seen_version", APP_VERSION)`
- Exibe titulo da versao, data e lista de mudancas com badges coloridos por tipo (feature=verde, fix=vermelho, improvement=azul)
- Design consistente com os dialogs existentes usando `Dialog` do shadcn

### 3. `src/pages/Changelog.tsx` - Pagina de historico de versoes

- Pagina acessivel via rota `/changelog`
- Usa o `Layout` padrao do sistema
- Lista todas as entradas do `CHANGELOG` em ordem cronologica reversa
- Cada versao exibida em um Card com: badge da versao, data, titulo e lista de mudancas
- Timeline visual conectando as versoes

## Arquivos a modificar

### 4. `src/components/sidebar/SidebarUserSection.tsx` - Indicador de versao

- Adicionar texto `v1.0.0` discreto abaixo da secao de usuario, como link para `/changelog`
- Usar `APP_VERSION` importado de `src/lib/version.ts`
- Estilo: `text-xs text-muted-foreground` centralizado

### 5. `src/components/Layout.tsx` - Montar o modal WhatsNew

- Importar e renderizar `<WhatsNewDialog />` dentro do Layout para que apareca em qualquer pagina autenticada

### 6. `src/App.tsx` - Adicionar rota /changelog

- Adicionar rota `/changelog` protegida com lazy loading, apontando para `src/pages/Changelog.tsx`

### 7. `src/components/sidebar/SidebarNav.tsx` - Link no menu

- Adicionar item "Novidades" (icone `Sparkles`) abaixo do separador, antes do Admin, como link para `/changelog`

## Detalhes tecnicos

### Estrutura do version.ts
```text
APP_VERSION = "1.0.0"
APP_VERSION_DATE = "2026-02-24"

CHANGELOG = [
  {
    version: "1.0.0",
    date: "2026-02-24",
    title: "Lancamento oficial",
    changes: [
      { type: "feature", description: "Dashboard completo com visao geral financeira" },
      { type: "feature", description: "Gestao de transacoes com importacao" },
      { type: "feature", description: "Controle de cartoes de credito e faturas" },
      { type: "feature", description: "Metas de economia e investimentos" },
      { type: "feature", description: "Relatorios e exportacoes" },
      { type: "feature", description: "Assistente financeiro com IA" },
      { type: "feature", description: "Notificacoes e alertas inteligentes" },
      { type: "feature", description: "Suporte a PWA para uso offline" },
    ]
  }
]
```

### localStorage key
- `app_last_seen_version`: armazena a ultima versao visualizada pelo usuario

### Fluxo do modal
1. Usuario abre qualquer pagina com Layout
2. WhatsNewDialog verifica localStorage
3. Se versao diferente da atual, abre modal automaticamente
4. Usuario le e fecha o modal
5. localStorage atualizado, modal nao aparece mais ate proxima atualizacao

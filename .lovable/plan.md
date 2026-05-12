# Plano para corrigir a exibição recorrente da versão antiga

## Diagnóstico
Encontrei sinais claros de que o problema não está no HTML publicado em si, e sim em resíduos de instalação/cache no navegador:

- O snapshot do navegador do usuário ainda mostra `Service Worker registrado: {}` duas vezes.
- O código atual já não contém registro ativo de service worker no app principal.
- Isso indica que alguns dispositivos/abas continuam presos a um bundle antigo previamente instalado em modo PWA ou controlado por um service worker antigo.
- O kill-switch atual em `/sw.js` e `/service-worker.js` é incompleto para esse cenário: ele limpa cache e se desregistra, mas não força as janelas controladas a navegar novamente antes do unregister.
- O projeto ainda mantém superfície de PWA/instalação (`/instalar`, textos de uso offline, tipos e assets relacionados), o que mantém o fluxo vivo e favorece reinstalações com comportamento antigo.

## O que vou implementar

### 1) Reforçar a remoção definitiva de service workers antigos
- Substituir os workers de limpeza por uma versão robusta que:
  - assume controle imediato,
  - apaga todos os caches,
  - reenfileira navegação de todas as janelas abertas com um parâmetro de limpeza,
  - só depois se desregistra.
- Adicionar limpeza defensiva no bootstrap do app para desregistrar qualquer service worker residual e limpar caches do navegador quando o app abrir.
- Garantir que isso funcione tanto em preview quanto na versão publicada.

### 2) Remover completamente o legado de PWA do produto
Como você escolheu remover PWA, vou eliminar os pontos que mantêm esse comportamento vivo:

- remover a página/fluxo de instalação do app,
- remover textos e promessas de uso offline,
- limpar declarações/tipos legados ligados a `virtual:pwa-register`,
- revisar `index.html` e assets públicos para retirar o que induz instalação/PWA desnecessária,
- manter apenas os ícones e metadados que fizerem sentido para a web normal.

### 3) Unificar a identificação de versão
Hoje há sinais de versão em mais de um lugar e de formas diferentes.
Vou padronizar isso para evitar falsa percepção de “versões misturadas”:

- remover versão hardcoded no menu lateral,
- usar uma única fonte de verdade para versão/build,
- atualizar o controle do “o que há de novo” para refletir a versão real atual.

### 4) Validação final
Vou validar com foco no sintoma real:

- confirmar que não há mais registro de service worker no app carregado,
- confirmar que `/sw.js` e `/service-worker.js` atuam só como limpeza e não mantêm cache ativo,
- verificar que preview e publicado carregam o bundle atual,
- checar que a interface exibe a mesma versão de forma consistente.

## Detalhes técnicos
- Não haverá mudança de banco de dados.
- O objetivo é transformar o app em web app normal, sem modo offline/installável.
- O problema principal é cliente legado controlado por service worker antigo, não cache do HTML do deploy atual.
- A correção será focada em limpeza compatível com dispositivos que já ficaram “contaminados” por versões anteriores.

Se você aprovar, eu implemento essa limpeza completa agora.
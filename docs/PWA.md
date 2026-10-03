# Enturma PWA

O Enturma Web também é um Progressive Web App instalável no Windows, Android e navegadores compatíveis.

## Instalação

A rota `/download` prioriza a instalação pelo navegador. Em Edge/Chrome o botão usa `beforeinstallprompt` quando o navegador disponibiliza o prompt nativo. Safari/iOS recebe instruções para **Adicionar à Tela de Início**.

A instalação PWA não baixa EXE ou APK. O navegador cria o atalho/aplicativo usando a origem HTTPS oficial. Os instaladores Electron/NSIS e APK continuam disponíveis apenas como alternativas avançadas.

## Manifesto

`src/app/manifest.ts` publica `/manifest.webmanifest` com:

- `start_url=/home?source=pwa`;
- `display=standalone`;
- escopo raiz;
- ícones gerados pelo Next.js;
- atalhos para Início, Salas, Comunidade e Cadernos.

## Service Worker

`public/sw.js` é registrado pelo `PwaProvider`.

Por segurança e consistência:

- páginas autenticadas usam rede primeiro e não ficam congeladas em cache;
- `/api`, autenticação e salas nunca são interceptadas pelo cache;
- apenas assets estáticos com hash, manifesto e ícones usam cache-first;
- sem rede, navegações exibem `/offline`.

Isso preserva atualizações Web imediatas e evita servir dados privados antigos a partir de cache.

## Detecção

`isInstalledApp()` considera Electron, Android nativo e o modo PWA standalone. Quando a PWA está instalada, o menu **Instalar aplicativo** é ocultado automaticamente.

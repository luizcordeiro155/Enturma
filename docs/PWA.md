# Enturma PWA

O Enturma Web também é um Progressive Web App instalável no Windows, Android e navegadores compatíveis.

## Instalação

A rota `/download` prioriza os aplicativos dedicados: **EXE no Windows** e **APK no Android**. A instalação pelo navegador fica como segunda alternativa para quem preferir não baixar o instalador do sistema.

Na alternativa PWA, Edge/Chrome usam `beforeinstallprompt` quando o navegador disponibiliza o prompt nativo. Safari/iOS recebe instruções para **Adicionar à Tela de Início**.

A instalação PWA não baixa EXE ou APK. O navegador cria o atalho/aplicativo usando a origem HTTPS oficial. Os instaladores Electron/NSIS e APK são apresentados primeiro por oferecerem integração nativa e a experiência recomendada do Enturma.

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


## Ajustes após instalação

- O item **Instalar aplicativo** some imediatamente quando o navegador confirma a instalação e permanece oculto nas próximas aberturas desse navegador.
- O ícone de instalação e os ícones do manifesto usam exatamente o mesmo `apps/mobile/assets/icon.png` da versão mobile do Enturma.
- A página de instalação não oferece mais EXE/APK como alternativas visíveis; o fluxo principal passa a ser somente PWA.
- As notificações internas continuam funcionando na PWA enquanto ela está aberta. Push do sistema com a PWA fechada ainda depende de Web Push; o FCM atual registra somente o aplicativo Android nativo.


## Ícone oficial da instalação

Os arquivos de metadata gerados em `src/app/icon.tsx` e `src/app/apple-icon.tsx` foram removidos porque tinham prioridade sobre a metadata do layout e faziam Windows/Chrome instalar a PWA com o ícone provisório “e.”. A instalação agora usa somente o mesmo PNG oficial de `apps/mobile/assets/icon.png`, publicado como `/enturma-app-icon-v2.png`. O nome versionado também evita reutilização do ícone antigo em cache.

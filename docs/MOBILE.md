# Mobile 0.3.0

Expo SDK 55 / React Native 0.83 / React 19.2. Expo Router com abas Início, Salas, Comunidade, Cadernos, Perfil e Mais. Mais inclui amigos, caronas, notificações, matérias, desafios e configurações.

`MobileThemeProvider` aplica claro/escuro/sistema, contraste e escala, sincronizados com a conta. Safe areas, teclado e scroll preservam acesso aos campos. `NativeCallProvider` mantém LiveKit entre rotas. Câmera/microfone/imagens exigem permissão. Screen share Android usa captura nativa; iOS não anuncia transmissão sem broadcast extension.

Chat das salas usa REST e snapshots autenticados; imagens têm prévia/cancelamento. Caronas incluem publicação, interesse, aceite, texto, chamada, ponto de encontro e encerramento/exclusão. Amizades nativas incluem convite/aceite/remoção/perfil; mensagens privadas E2EE continuam no Web, sem introduzir plaintext no nativo.

## Builds

Definir `EXPO_PUBLIC_API_URL=https://ORIGEM-REAL/api/v1` nos ambientes EAS preview/production. `app.config.js` rejeita build EAS sem essa configuração. Não há subdomínio presumido nem segredo backend em EXPO_PUBLIC.

```sh
cd apps/mobile
npx expo prebuild --platform android --no-install
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

Preview gera APK; production AAB. Usar credenciais de assinatura reais do projeto. Diretórios nativos gerados são ignorados (CNG). Ícones, scheme enturma, identificador br.com.enturma.app, versionCode/buildNumber 3 e permissões estão em app.json.

iOS: gerar em macOS/Linux, compilar no Xcode/macOS ou EAS e usar signing válido. Preview usa simulador; production exige assinatura. Nenhum certificado provisionado nesta estação.

Validação local: TypeScript, testes SecureStore, export Android/Hermes e prebuild Android. CLI recusa prebuild iOS no Windows. Homologação de áudio, permissões, segundo plano, teclado e screen share em aparelhos físicos continua necessária. Configuração/build JS não significa publicação em loja.

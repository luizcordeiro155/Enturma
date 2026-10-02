# Mobile 0.3.8

A versão Android usa a aplicação Web responsiva oficial dentro de um shell Android seguro. Com isso, Web, Desktop e Android passam a compartilhar as mesmas páginas e a mesma implementação de salas, chamadas, fórum, perfil, cadernos, caronas, configurações e recursos futuros.

## Ajustes mobile 0.3.8

O Android agora usa edge-to-edge sem adicionar padding nativo vazio. A área da barra de status é preenchida pela própria interface do Enturma, enquanto o inset real do aparelho é aplicado dentro do topbar. Isso remove a faixa branca no topo sem esconder relógio, sinal, bateria ou notificações. A proteção da safe area agora é persistente durante a navegação SPA entre páginas. O shell também acompanha `data-theme` e troca automaticamente os ícones da barra de status entre claros e escuros, mantendo contraste correto nos modos claro e escuro.

O Android 0.3.8 adiciona atualização integrada: o aplicativo verifica periodicamente o manifesto oficial, mostra uma notificação nativa quando uma nova versão é publicada, destaca **Configurações** e o ícone de atualização e permite iniciar o download e a instalação pelo próprio Enturma. Por segurança do Android, a confirmação final da instalação continua sendo feita pelo sistema. O launcher mobile passa a usar diretamente a arte final do ícone do Enturma, sem a camada adaptativa que alterava sua aparência.

A navegação interna da sala continua com prioridade no celular: **Conversa, Chamada, Materiais e Enturma AI** permanecem clicáveis sem conflito com a barra global do aplicativo.

## Paridade entre plataformas

O APK abre a origem oficial do Enturma em um WebView Android e adiciona `EnturmaMobile/0.3.8` ao User-Agent. A aplicação Web detecta esse marcador para ocultar a opção **Baixar aplicativo** quando o usuário já está no app.

Não existe mais uma segunda interface Android separada que precise ser mantida página por página. Ao publicar uma página ou ajuste responsivo no Web, o Android recebe a mesma experiência automaticamente.

## Conta e dados

O aplicativo utiliza a mesma camada Web/BFF e os mesmos cookies HttpOnly do navegador. A conta, salas, mensagens, fórum, perfil, cadernos, notificações, caronas e demais dados são os mesmos em todas as plataformas.

## Chamadas

O Android utiliza o mesmo `CallSessionProvider` e o mesmo `VoiceSession` da Web/Desktop. O grant LiveKit continua vindo do mesmo endpoint backend, então uma pessoa no Android entra exatamente na mesma sala LiveKit de participantes no navegador ou no Desktop.

O shell Android concede câmera e microfone ao WebView somente após a permissão do sistema. O app continua na chamada ao navegar pelas páginas porque a sessão é mantida no layout raiz Web.

Compartilhamento de tela só é habilitado quando o WebView Android disponibiliza `getDisplayMedia`. Em aparelhos onde esse recurso não existe, o botão fica indisponível em vez de derrubar a aplicação.

## Shell Android

Após o `expo prebuild`, o builder executa `deploy/android-download/install-web-shell.cjs`, que substitui a Activity de entrada por um shell WebView restrito à origem oficial do Enturma.

Links externos são enviados para o aplicativo apropriado do sistema. O botão Voltar do Android percorre o histórico da aplicação antes de fechar. Uploads usam o seletor nativo de arquivos.

## Distribuição

O pacote continua sendo `br.com.enturma.app` e mantém a mesma chave de assinatura, então a nova versão pode ser instalada sobre as anteriores.

O servidor de downloads publica um APK versionado e o `latest-android.json` aponta diretamente para esse artefato. O alias estável não é usado como URL final do manifesto, evitando que o navegador entregue uma versão antiga por cache.

## Segurança

O WebView aceita navegação interna somente na origem HTTPS oficial. Links externos não são renderizados dentro do contexto autenticado do Enturma. Nenhuma credencial backend é incluída no APK.


## Atualizador 0.3.10

- O toque na notificação inicia o download diretamente.
- Uma mesma versão gera apenas um aviso nativo.
- Toques repetidos não criam downloads duplicados.
- O instalador do Android abre automaticamente ao concluir o download quando permitido.
- O WebView é fisicamente redimensionado acima do teclado para manter o texto do chat visível.
- O editor de perfil ocupa a tela inteira no mobile e não deixa os botões finais atrás da navegação.


## Atualizador 0.3.11

- Corrige o recebimento de `ACTION_DOWNLOAD_COMPLETE` no Android 13+ para que o Enturma reaja ao término do download.
- O instalador do Android é aberto automaticamente quando o Enturma está em primeiro plano.
- Se o download terminar em segundo plano, o Enturma mostra uma ação direta para abrir o instalador sem procurar o APK em Downloads.
- Ao reabrir o aplicativo, um APK já concluído é detectado automaticamente.
- A confirmação final continua sendo a tela oficial do instalador do Android, onde o usuário toca em **Instalar**.


## Notificações 0.3.12

- O Android registra cada instalação com um token FCM e recebe notificações mesmo com o Enturma minimizado ou fechado.
- Mensagens de salas, mensagens privadas, menções, respostas/interações do fórum e demais eventos já emitidos pelo `NotificationService` podem chegar como push.
- Ao tocar em uma notificação, o app abre diretamente a rota correspondente da conversa, sala ou fórum.
- Configurações → Notificações separa **No aplicativo**, **No celular (push)** e **E-mail** por categoria.
- **Menções** possuem categoria própria, independente de mensagens comuns.
- O logout desvincula a instalação da conta atual.
- O atualizador usa um único ID de notificação; ao concluir o download, a mesma notificação passa a oferecer **Instalar**.
- Quando o Enturma está aberto, o aviso nativo de nova versão é suprimido para não duplicar o diálogo interno do atualizador.

### Variáveis Firebase do APK

O build Android habilita FCM somente quando as quatro variáveis abaixo estiverem definidas no serviço que gera o APK:

```dotenv
FIREBASE_ANDROID_PROJECT_ID=...
FIREBASE_ANDROID_APP_ID=...
FIREBASE_ANDROID_API_KEY=...
FIREBASE_ANDROID_SENDER_ID=...
```

A API precisa de `FCM_SERVICE_ACCOUNT_BASE64`, contendo em Base64 o JSON da service account autorizada a enviar mensagens pelo Firebase Cloud Messaging HTTP v1. A chave privada fica apenas na API e nunca é incluída no APK.

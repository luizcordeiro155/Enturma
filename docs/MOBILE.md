# Mobile 0.3.4

A versão Android usa a aplicação Web responsiva oficial dentro de um shell Android seguro. Com isso, Web, Desktop e Android passam a compartilhar as mesmas páginas e a mesma implementação de salas, chamadas, fórum, perfil, cadernos, caronas, configurações e recursos futuros.

## Paridade entre plataformas

O APK abre a origem oficial do Enturma em um WebView Android e adiciona `EnturmaMobile/0.3.4` ao User-Agent. A aplicação Web detecta esse marcador para ocultar a opção **Baixar aplicativo** quando o usuário já está no app.

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

# Chat, chamadas e tempo real

## Chat Web: efêmero e E2EE

O chat Web de cada sala funciona em `/ws`. O cliente primeiro gera um par ECDH P-256 com Web Crypto e autentica o socket enviando o access token de curta duração, o `roomId` e somente a chave pública. A chave privada nunca é enviada ao backend.

A primeira pessoa conectada gera uma chave AES-GCM 256-bit da sala. Quando outra pessoa entra, a chave da sala é entregue entre os clientes usando uma chave de wrapping derivada por ECDH. O servidor atua apenas como relay autenticado de chaves públicas, IVs e ciphertexts.

Texto, imagens, respostas, exclusões e reações são cifrados no navegador antes do envio. O backend não recebe a chave AES da sala e não persiste o conteúdo. A migration V9 remove as tabelas legadas de mensagens e reações. Ao atualizar a página ou quando todos os participantes saem, o histórico em memória é perdido por design.

Imagens aceitas no chat Web: JPG, PNG, WEBP e GIF, com limite de 650 KB. Elas viajam dentro do envelope cifrado e não são enviadas ao Object Storage.

O servidor valida associação à sala antes de aceitar o socket, limita payloads e injeta o `senderId` autenticado no envelope externo. O cliente rejeita eventos cujo remetente interno não corresponda ao remetente autenticado.

> Limite importante: numa aplicação Web, quem controla o código entregue pelo site poderia publicar uma versão futura maliciosa do cliente. Portanto, a implementação protege o conteúdo contra banco, logs, admins e infraestrutura que apenas observe o tráfego, mas não deve ser anunciada como garantia absoluta de que um mantenedor jamais poderia alterar o cliente. Consulte [CHAT_PRIVACY](CHAT_PRIVACY.md).

## Chamadas Web

Chamadas usam LiveKit/WebRTC. O backend emite grants curtos somente para participantes ativos da sala. O cliente Web suporta:

- microfone e mute;
- câmera;
- participantes remotos;
- indicador de quem está falando;
- compartilhamento de tela;
- áudio de screen share quando suportado pelo navegador;
- reconexão do LiveKit;
- encerramento quando a sala termina.

O token permite as fontes `microphone`, `camera`, `screen_share` e `screen_share_audio`. O navegador sempre pede consentimento do usuário para microfone, câmera e tela.

O reconciliador da API remove identidades que não pertencem mais à sala e apaga a sala LiveKit quando a sessão do Enturma termina.

WebRTC fornece criptografia de transporte. Não documentar a mídia como E2EE de conteúdo até que a camada E2EE de mídia do LiveKit seja habilitada e testada explicitamente.

## Escala

O relay atual é em memória por instância. Antes de executar várias réplicas da API, introduzir um barramento/pub-sub compatível com envelopes cifrados sem descriptografá-los. O conteúdo deve continuar opaco ao broker.

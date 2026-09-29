# Chat, chamadas e tempo real

## Chat Web persistente

Mensagens são enviadas via REST autenticado. O WebSocket envia snapshots autorizados para sincronizar participantes; reconexão recupera o histórico no banco. Texto, respostas, imagens e reações não usam E2EE neste fluxo. Ver [privacidade do chat](CHAT_PRIVACY.md).

Encerrar a sala bloqueia envios e preserva as mensagens para participantes. O conteúdo não é apagado quando a IA está indisponível.

## Chamadas Web

Chamadas usam LiveKit/WebRTC. O backend emite grants curtos somente para participantes ativos da sala. O cliente Web suporta:

- microfone e mute;
- câmera;
- participantes remotos;
- indicador visual de quem está falando em tempo real;
- lista completa de participantes da chamada;
- compartilhamento de tela com destaque do transmissor e lista de participantes que estão recebendo a transmissão;
- áudio de screen share quando suportado pelo navegador;
- reconexão do LiveKit;
- encerramento quando a sala termina.

O token permite as fontes `microphone`, `camera`, `screen_share` e `screen_share_audio`. O navegador sempre pede consentimento do usuário para microfone, câmera e tela.

O reconciliador da API remove identidades que não pertencem mais à sala e apaga a sala LiveKit quando a sessão do Enturma termina.

WebRTC fornece criptografia de transporte. Não documentar a mídia como E2EE de conteúdo até que a camada E2EE de mídia do LiveKit seja habilitada e testada explicitamente.

## Escala

O relay atual é em memória por instância. Antes de executar várias réplicas da API, introduzir um barramento/pub-sub compatível com envelopes cifrados sem descriptografá-los. O conteúdo deve continuar opaco ao broker.

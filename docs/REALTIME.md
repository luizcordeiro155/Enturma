# Chat, chamadas e tempo real

## Chat Web

O chat Web de cada sala funciona em `/ws`. O cliente autentica o socket com access token e `roomId`. O backend valida associação ativa antes de aceitar eventos em tempo real.

Eventos suportados:

- `chat_message`;
- `chat_delete`;
- `chat_reaction`;
- `typing`.

Mensagens também possuem API REST de fallback em `/api/v1/study-rooms/{room}/messages`.

## Persistência

A versão v4 substitui o chat efêmero anterior por histórico privado persistente. Texto, metadados de imagem, respostas, exclusões e reações são armazenados em tabelas dedicadas da sala.

Isso é necessário para:

- permitir que alguém que entre depois leia o que já aconteceu;
- permitir recuperação de contexto pela Enturma AI;
- permitir revisão da sessão depois do encerramento;
- gerar o estudo final da sessão.

A migration responsável é `V10__persistent_room_history_and_study_summary.sql`.

Imagens do chat aceitam JPG, PNG, WEBP e GIF com até 8 MB. Nesta versão elas são serializadas como data URL e persistidas junto da mensagem. Para escala maior, o próximo passo recomendado é upload direto para object storage com URL assinada, mantendo autorização por sala.

## Chamadas Web

Chamadas usam LiveKit/WebRTC. O backend emite grants curtos somente para participantes ativos. O cliente suporta:

- microfone e mute;
- câmera;
- lista de participantes;
- destaque visual de quem está falando;
- compartilhamento de tela;
- identificação de quem está transmitindo;
- reconexão e encerramento da sessão.

WebRTC fornece criptografia de transporte. A documentação não descreve a mídia como E2EE de conteúdo até a camada específica de E2EE do LiveKit ser configurada e validada.

## Escala

O WebSocket atual é por instância. Antes de múltiplas réplicas da API, adicionar pub/sub para eventos de sala e presença. O histórico persistente já fica no PostgreSQL e não depende da memória da instância.

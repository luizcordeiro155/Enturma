# Chat privado das salas

O chat de sala é efêmero e usa criptografia ponta a ponta no navegador. O servidor autentica quem pode entrar na sala e retransmite envelopes cifrados, mas não recebe a chave simétrica da conversa e não persiste mensagens, imagens, respostas ou reações.

## Modelo criptográfico

Cada conexão Web gera um par ECDH P-256 usando Web Crypto. A chave privada permanece apenas em memória no cliente. A sala usa uma chave AES-GCM 256-bit aleatória. Um participante que já possui a chave da sala a entrega a novos participantes cifrando-a com uma chave de wrapping derivada por ECDH. O backend vê apenas chaves públicas, IVs e ciphertexts.

Mensagens e imagens são serializadas localmente e cifradas com AES-GCM antes de serem transmitidas. Imagens são limitadas pelo cliente a formatos de imagem permitidos e tamanho pequeno para evitar abuso de memória. O backend aplica também um limite máximo ao envelope WebSocket.

## Sem histórico no servidor

A migration V9 remove as tabelas legadas de mensagens e reações. O endpoint REST de mensagens permanece somente como compatibilidade e retorna lista vazia; escritas REST são rejeitadas. Se todos saírem da sala ou atualizarem o navegador, o conteúdo que existia apenas em memória é perdido por design.

## Limites da promessa de privacidade

Este modelo protege o conteúdo contra banco, logs, administradores e infraestrutura que apenas observe o tráfego. Em uma aplicação Web, quem controla o código servido pelo site poderia publicar uma versão futura maliciosa do JavaScript. Por isso o produto não deve anunciar a alegação absoluta de que “nem o desenvolvedor jamais poderia acessar” sem medidas adicionais de distribuição verificável do cliente, auditorias independentes e controles operacionais.

Chamadas de voz/vídeo usam LiveKit/WebRTC. Elas possuem criptografia de transporte WebRTC, mas não devem ser descritas como E2EE do conteúdo até a camada E2EE de mídia do LiveKit ser configurada explicitamente.

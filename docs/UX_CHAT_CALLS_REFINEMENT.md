# Refinamento UX, chat, chamadas e intro — outubro de 2026

## Comportamento implementado

- O campo de mensagem da sala pertence ao fluxo do chat no celular, eliminando a regra antiga que o fixava sobre o aviso de novas mensagens. O resize nativo do Android permanece intacto.
- Sala e conversa privada respeitam a leitura do histórico mesmo com o campo focado. A abertura e o próprio envio acompanham a mensagem mais recente. Respostas/notificações movem o contêiner da conversa, sem deslocar a página externa.
- A lista de amigos apresenta presença, data, não lidas e prévia quando a mensagem já foi descriptografada localmente. Não foi introduzido texto de mensagem privada no servidor.
- Chamadas privadas usam a amizade aceita, bloqueios, presença autenticada, convite e aceite no servidor. O convite chega em qualquer página autenticada. Apenas os dispositivos que iniciaram/aceitaram obtêm credenciais de mídia. Áudio de toque respeita as restrições de autoplay do navegador.
- O LiveKit publica câmera nos cartões dos participantes. Microfones e câmeras permanecem independentes da tela; a tela remota só é assinada após **Ver transmissão**. Encerrar/ocultar a transmissão não remove os demais participantes.
- O Monitor anuncia entrada, saída e compartilhamento nas salas, com deduplicação/limite por participante. Presença expirada é reconciliada para não deixar participantes fantasmas.
- Os tokens de tema também cobrem formulários fora do shell, avisos, chamadas e cartões de rota do motorista. O modo Sistema acompanha mudanças do dispositivo sem recarregar.
- GSAP compartilha um ciclo de efeitos por rota, excluindo histórico, mapas e mídia das animações de entrada. Preferências de movimento reduzido cancelam efeitos ativos.
- A intro usa Remotion Player; arquitetura e exportação compartilhada em [INTRO_EXPERIENCE.md](INTRO_EXPERIENCE.md).

## API e persistência

### Complemento de navegação e mídia

Chamadas privadas usam a rota própria `/calls/[id]`, com transição ao atender, câmera local pequena e controles adaptados ao celular. Voltar minimiza uma chamada ainda ativa. Desligar remove a sessão e o controlador imediatamente; registros terminais retornados pela API são ignorados, inclusive após recarregar ou reabrir o app.

A URL `/friends?chat=id` é a fonte única de navegação do chat, sem entradas sintéticas que reabram a conversa. Imagens privadas e da sala usam miniaturas limitadas a 320 × 240 px (260 × 220 no celular), com visualizador modal que mantém a conversa, fecha por botão/Esc/Voltar e devolve o foco. A imagem privada permanece cifrada no servidor.

O botão da Home tem fundo verde escuro e texto branco sobre o cartão lima também no tema escuro. Esse complemento altera apenas a web: não exige migração, novo JAR ou APK. Regressões Playwright incluem encerramento/reabertura, chamada em página própria mobile/desktop, nove cenas verticais, miniatura/replay, anexos cifrados e histórico de navegação.

Migrações aditivas V41/V42: chamadas privadas, leases de presença e estado de mídia nas salas. Nenhuma mensagem privada é descriptografada ou migrada.

`GET /api/v1/friends/{id}/presence`, `GET/POST /api/v1/calls/private`, `POST /api/v1/calls/private/{id}/{ring|accept|decline|cancel|end}`, `POST .../{id}/voice`, `POST .../{id}/heartbeat`. Convite, aceite e emissão de token usam `deviceId` por aba. A API autentica ambos os participantes e valida a amizade novamente antes de emitir tokens.

O convite expira em 35 segundos; a conexão aceita tem 45 segundos; a chamada conectada admite até duas horas, com heartbeat de 15 segundos e tolerância de 90 segundos. As credenciais LiveKit duram 60 segundos. Ao encerrar, o servidor remove a sala e repete a limpeza até expirar a janela dos tokens já emitidos. Chamadas cruzadas são serializadas pelo bloqueio dos dois usuários em ordem estável.

## Validação e limites

`e2e/ux-refinement.spec.ts` usa PostgreSQL de teste e LiveKit local real: intro responsiva, pausa/pular/replay, movimento reduzido, conversa com histórico longo, entrada móvel, popover, chamadas entre dois contextos autenticados, câmera, assinatura seletiva de tela e liberação de mídia. A fonte de captura de tela e os dispositivos de áudio/vídeo são controlados pelo teste; o seletor nativo de tela não é automatizado.

O teste de temas navega pelas principais rotas, valida ausência de overflow horizontal e mede contraste mínimo de 4,5:1 no cartão de rota do motorista em Dark/Light/System.

Os testes de API verificam amigos offline/bloqueados, acesso de terceiros, aceite, isolamento de dispositivo, expiração, chamadas cruzadas e retirada da amizade durante uma chamada. Testes unitários cobrem qualidade/dimensões da intro e limites de rolagem.

Resultado local: 77 testes de API, 30 testes unitários web e sete cenários Playwright relevantes aprovados. A regressão inclui recorte/cor do perfil, criptografia ponta a ponta, recuperação do histórico em um terceiro navegador, chamada de sala, sete tamanhos de viewport e os quatro cenários UX novos. TypeScript, ESLint (sem erros; 29 avisos preexistentes), build web e empacotamento da API concluídos.

A redução do viewport no Chromium valida o layout, mas não substitui uma prova física de IME em Android/iPhone. Não foi conectado um aparelho Android nem exercitado o shell Electron neste ciclo. Nenhum código nativo foi alterado e nenhum APK foi gerado.

## Publicação

`main` continua como fonte de verdade. Vercel publica o frontend; a integração nativa da SquareCloud recompila a API e aplica as migrações. Publicar a API compatível antes de verificar as novas chamadas. Não é necessário GitHub Actions, rebuild do Android ou rebuild do instalador desktop para esta mudança web/API.

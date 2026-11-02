# API v1

Base `/api/v1`. Rotas protegidas exigem `Authorization: Bearer <access>`. As exceções explícitas de `SecurityConfig` incluem autenticação/recuperação/confirmação, health, handshake `/ws` e GET de catálogo, conteúdo público, avatar e banner. O handshake público não autoriza inscrições: o WebSocket autentica a primeira mensagem e valida o escopo. Rotas administrativas exigem ADMIN/SUPER_ADMIN; cada serviço continua responsável pela propriedade/membership do recurso. Erros: `timestamp`, `status`, `code`, `message`, `path`, `requestId`. Esta tabela é uma referência de rotas, não um inventário exaustivo de permissões.

## Catálogo V2 e aprendizagem

| Método/rota                                                                               | Função                                                  |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| GET /catalog/institutions, campuses, courses, curricula, periods, subjects, topics        | parentId, search, page; `{items,page,pageSize,hasMore}` |
| GET /catalog/onboarding/options                                                           | kind, parentId, search, page; `{items,page,pageSize}`   |
| GET /catalog/subjects/{id}                                                                | Fonte, contexto de grade, tópicos e pré-requisitos      |
| GET /catalog/coverage/summary                                                             | Cobertura por ofertas conhecidas                        |
| POST /catalog/requests                                                                    | `{courseOfferingId}`; usuário autenticado               |
| GET /admin/catalog/summary, providers, sources, events, audit, requests, migration-report | Gestão e inspeção; ADMIN/SUPER_ADMIN                    |
| GET/POST /admin/catalog/imports                                                           | Jobs paginados / documento `{provider,entries}`         |
| POST /admin/catalog/imports/csv                                                           | CSV, query provider                                     |
| GET /admin/catalog/imports/{id}                                                           | Contadores e página de itens                            |
| POST /admin/catalog/imports/{id}/pause,resume,cancel,retry                                | Controle persistido                                     |
| GET /admin/catalog/review; POST /admin/catalog/review/{id}                                | Comparação e `{action,correction}`                      |
| POST /admin/catalog/providers/{code}/imports                                              | Reimportar snapshot                                     |
| POST /admin/catalog/documents/inspect; /documents/pdf                                     | URL / multipart para extração pendente                  |
| POST /admin/catalog/sources/{id}/check                                                    | Conferir hash sem sobrescrever matriz                   |
| GET /learning/access                                                                      | `{eligible}` baseado na matrícula                       |
| GET /learning/progress                                                                    | Progresso do usuário elegível                           |
| POST /learning/attempts                                                                   | `{game:robot                                            | binary | trace,level:1..4,answer}`; validação no servidor |

Detalhes e schemas em [ACADEMIC_IMPORTS](ACADEMIC_IMPORTS.md). `/academics` e `/admin/academics/import` permanecem como compatibilidade legada; use V2 para novos providers.

| Método/rota                                        | Função                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| POST /auth/register, /auth/login                   | Cadastro/login; tokens + expiresIn + userId                                |
| POST /auth/refresh                                 | `{token}`; rotação de refresh                                              |
| POST /auth/logout                                  | Revogar sessão atual                                                       |
| GET /auth/sessions; DELETE /auth/sessions/{id}     | Dispositivos e revogação                                                   |
| POST /auth/forgot-password                         | `{email}`; sempre 204 se entrada válida                                    |
| POST /auth/reset-password                          | `{token,password}`                                                         |
| POST /auth/verify-email                            | `{token}`                                                                  |
| GET /academics                                     | kind, parentId, search, page; 30 itens                                     |
| GET /users/me                                      | Perfil, matrícula e matérias                                               |
| PUT /users/me/enrollment                           | periodId, subjectIds, shift, preferences                                   |
| GET /study-rooms                                   | subjectId opcional, page                                                   |
| POST /study-rooms                                  | subjectId, topicId, title, minutes, maxParticipants; retorna sala e reused |
| GET /study-rooms/{id}                              | Detalhes autorizados                                                       |
| POST /study-rooms/{id}/join, /leave, /end          | Participação/encerramento                                                  |
| DELETE /study-rooms/{id}/participants/{userId}     | Remover participante                                                       |
| GET/POST /study-rooms/{id}/messages                | Listar/enviar; body e replyTo                                              |
| PUT/DELETE /study-rooms/{id}/messages/{messageId}  | Editar/remover                                                             |
| POST /study-rooms/{id}/voice                       | Grant LiveKit de áudio                                                     |
| GET/POST /study-rooms/{id}/materials               | Listar/upload multipart `file`                                             |
| GET /study-rooms/{id}/materials/{materialId}       | Download autorizado                                                        |
| POST /study-rooms/{id}/ai                          | question, mode; resposta e trechos recuperados                             |
| GET /capabilities                                  | Flags efetivas de voz, materiais e IA                                      |
| GET/POST /rides; GET /rides/mine                   | Descoberta, publicação e minhas caronas                                    |
| POST /rides/{id}/interest, /complete, /cancel      | Interesse e ciclo de vida                                                  |
| GET /matches; POST /matches/{id}/accept            | Pedidos e aceite                                                           |
| GET/POST /matches/{id}/messages                    | Chat privado após aceite                                                   |
| PUT /matches/{id}/meeting-point                    | `{point}` somente para o par aceito                                        |
| POST /matches/{id}/review                          | `{rating:1..5}` após conclusão                                             |
| GET /blocks; POST/DELETE /blocks/{id}              | Bloqueios                                                                  |
| POST /reports                                      | targetId, reason                                                           |
| GET /notifications; POST /notifications/{id}/read  | Notificações internas                                                      |
| GET /admin/academics; POST /admin/academics/import | Catálogo administrativo                                                    |
| PUT /admin/users/{id}/status                       | ACTIVE, SUSPENDED ou BANNED; auditado                                      |

Swagger/OpenAPI usa springdoc, desabilitado por padrão (`OPENAPI_ENABLED=false`). Para desenvolvimento habilite a variável; os endpoints de documentação também exigem autenticação. O pacote TypeScript mantém os contratos usados pelos clientes; geração automática OpenAPI ainda não faz parte do pipeline.

## Importação

Body `{ "entries": [...] }`, até 500 entradas por transação, com pais primeiro. Cada entrada: `id` (UUID), `kind` (INSTITUTION, CAMPUS, COURSE, CURRICULUM, PERIOD, SUBJECT, TOPIC), `parentId`, `name`, `code` opcional, `curriculumVersion` obrigatória para CURRICULUM, `periodNumber` para PERIOD, `sourceUrl` HTTPS, `sourceName`, `verifiedAt`, `validFrom`, `validUntil` opcional, `status` (VERIFIED, PENDING_VERIFICATION, OUTDATED, ARCHIVED). VERIFIED exige data de verificação não futura. Verificação humana da autenticidade da fonte continua necessária.

Os exemplos de testes não representam nenhuma universidade real. Não use as fixtures como catálogo inicial.

## Comunidade 0.3.0

| Método e rota                                          | Contrato                                                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| GET /users/me/showcase; /users/{id}/showcase           | Aparência, widgets, stats e badges filtrados por privacidade/bloqueio                                                          |
| PUT /users/me/showcase                                 | secondaryColor, theme, effect, layout, goal, technologies, projects, privacy, widgets[{kind,visible,favorite}], badges[código] |
| GET /achievements                                      | Definições, progresso e datas do usuário                                                                                       |
| GET/PUT /notifications/preferences                     | Lista / {category,inApp,email,push}; categorias independentes                                                                  |
| POST /notifications/push-device; DELETE /notifications/push-device/{installationId} | Registrar/remover instalação Android para push                                                                  |
| POST /study-rooms                                      | Durações rápidas existentes ou days 1..5                                                                                       |
| POST /study-rooms/{id}/heartbeat                       | Presença do participante                                                                                                       |
| PUT /study-rooms/{id}/settings                         | title, topic, locked; host                                                                                                     |
| GET /learning/academic; /learning/academic/progress    | Atividades elegíveis / missões do dia                                                                                          |
| POST /learning/academic/start                          | {subjectId,game,daily,slot}                                                                                                    |
| POST /learning/academic/{id}/answer                    | {answer}; correção/XP no servidor                                                                                              |
| GET /moderation/mine                                   | Medidas e recursos do usuário                                                                                                  |
| POST /moderation/{id}/appeal                           | {reason}                                                                                                                       |
| GET /admin/moderation; /admin/moderation/{id}/evidence | Casos e evidência; admin                                                                                                       |
| POST /admin/moderation/actions                         | userId, roomId opcional, kind, minutes, rule, evidence, requestId                                                              |
| POST /admin/moderation/{id}/review                     | {revoke,note}; revisão humana                                                                                                  |
| POST /admin/moderation/blocked-hosts                   | {host,reason}                                                                                                                  |


### Mobilidade universitária

- `GET /rides/{id}/suggestions`: sugestões automáticas de matching.
- `POST /rides/{source}/suggestions/{candidate}/connect`: cria pedido de combinação.
- `POST /rides/{id}/status`: atualiza o ciclo da viagem.
- `GET|PUT /rides/vehicle`: perfil opcional do veículo.
- `GET /rides/users/{id}/reputation`: reputação agregada.
- `GET|POST /rides/recurrences` e `DELETE /rides/recurrences/{id}`: rotina recorrente.
- `GET /rides/campuses/{campus}/pickup-zones`: pontos oficiais do campus.
- `POST /admin/rides/campuses/{campus}/pickup-zones`: cadastro administrativo de ponto.
- `POST /matches/{id}/confirm`: confirmação do participante.
- `GET /matches/{id}/boarding-code` e `POST /matches/{id}/board`: PIN de embarque.
- `GET|PUT|DELETE /matches/{id}/location`: localização temporária entre o par.
- `POST /matches/{id}/safety-share`: cria link temporário de acompanhamento.
- `GET /public/rides/safety/{token}`: acompanhamento do link compartilhado.
- `POST /matches/{id}/no-show`: registra não comparecimento após tolerância.
- `POST /rides/{id}/stops`: ordena paradas dos passageiros aceitos.
- `PUT /matches/{id}/meeting-zone`: seleciona ponto oficial do campus.

---

## Rotas recentes verificadas no backend Java

| Categoria | Exemplos de rotas |
|---|---|
| Conta | `GET /auth/session-view`; `GET /auth/sessions`; `DELETE /auth/sessions/{id}` |
| Identidade acadêmica | `GET /auth/academic/status`; `GET /auth/academic/institutions`; `POST /auth/academic/email`, `/confirm`, `/document`, `/support` |
| Privacidade | `GET /account/privacy/deletion`; `POST /account/privacy/deletion/schedule`, `/cancel`; `DELETE /account/privacy/deletion/now` |
| Cadernos | `GET/POST /notebooks`; `GET/PUT/DELETE /notebooks/{id}`; `POST /notebooks/{id}/sources`, `/files`, `/generations` |
| Mídias | `GET /chat-media/capabilities`, `GET/POST /chat-media`, `PATCH/DELETE /chat-media/{id}` |
| Chamadas privadas | `GET/POST /calls/private`; `POST /calls/private/{id}/accept|decline|cancel|end|ring`; `POST /calls/private/{id}/voice`, `/heartbeat` |
| Caronas | `/rides/map/search`, `/rides/map/address-search`, `/rides/map/reverse`, `/rides/map/route`, `/rides/dispatch/search`, `/rides/driver/availability`, `/matches/{id}/...` |
| Notificações | `/notifications/preferences`, `/notifications/inbox`, `/notifications/web-push/public-key`, `/notifications/desktop-push` |

Todas as rotas seguem o prefixo `/api/v1` e autorizam conforme a identidade e o recurso. A rota `GET /api/klipy-config` é exclusiva do frontend Next.js; a pesquisa KLIPY ocorre diretamente no navegador, não no Java.

## Comunidade para visitantes — lote 02/11/2026

Os endpoints abaixo permitem somente leitura anônima. `/visitante` é uma rota da interface Web, não uma identidade com permissão para usar endpoints privados. Fórum expõe conteúdo publicado, identificador/nome/username do autor e contadores agregados; não inclui e-mail, preferências ou personalização privada do autor. Publicações removidas e autores com status diferente de `ACTIVE` são excluídos. A política pública não depende do cache de um usuário autenticado.

| Método/rota | Contrato |
| --- | --- |
| `GET /public/explore/forum` | `q` até 160 caracteres, `category`, `sort=new|top|relevance`, `page` a partir de 0; `{items,hasMore}`, até 30 itens. Categorias: `GENERAL`, `PROGRAMMING`, `ACADEMIC`, `CAREER`, `CAMPUS`. |
| `GET /public/explore/forum/{id}` | Publicação raiz visível; não permite buscar uma mensagem privada pelo identificador. |
| `GET /public/explore/forum/{id}/comments` | Comentários visíveis da raiz, `page`; `{items,hasMore}`, até 30 itens. |
| `GET /public/explore/forum/{id}/related` | Até cinco outras publicações visíveis da mesma categoria. |
| `GET /public/explore/forum/{id}/target/{target}` | Raiz ou comentário pertencente à raiz informada; valida visibilidade de ambos. |
| `GET /public/explore/rooms` | `page`, `subjectId` opcional; lista de até 30 salas `OPEN`/`ACTIVE`, não travadas e não expiradas. Metadados de descoberta e contagem de participantes; sem host, lista de membros, código de convite, conversa ou materiais. |
| `GET /public/explore/rooms/{id}/avatar` ou `/banner` | Imagem de uma sala que atende aos mesmos critérios públicos. `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`. |

Essas rotas compartilham limite de 120 requisições por minuto por identidade de cliente. O cliente anônimo usa a identificação assinada pelo BFF quando válida, ou endereço da conexão como fallback. Caronas visitante consulta `GET /catalog/campuses`; não consulta estado da viagem, coordenadas, pedidos ou disponibilidade de motoristas. `/academics` permanece autenticado. Participação, votos, reações, denúncias, perfil, amigos e portfólio continuam usando endpoints protegidos.

## Mensagens de voz e recibos — lote 02/11/2026

| Método/rota | Contrato |
| --- | --- |
| `POST /study-rooms/{id}/messages/attachments` | Multipart `file`; além das imagens existentes, aceita `audio/webm`, `audio/ogg`, `audio/mp4`, até 1.433.600 bytes e com assinatura de contêiner válida. Exige membership. |
| `GET /study-rooms/{id}/messages/attachments/{attachmentId}` | Download autorizado do anexo; não se torna público por ser áudio. |
| `POST /study-rooms/{id}/messages` | `body`, `replyTo`, `attachmentId`, `mediaKind` opcionais; `clientId` UUID opcional torna o envio idempotente por remetente. Reutilizar o ID em outra sala é rejeitado. `mediaKind=STICKER|GIF` é somente para imagens; áudio é identificado pelo MIME do anexo. |
| `POST /friends/{id}/messages` | Envelope cifrado existente com `clientId`, `ciphertext`, `iv` e campos opcionais `attachmentCiphertext`, `attachmentIv`, `attachmentMime`, `attachmentName`, `attachmentSize`. Áudio utiliza os mesmos MIME e limite de tamanho; metadados fazem parte da autenticação AES-GCM no cliente. Exige amizade aceita e ausência de bloqueio. |
| `GET /messages/pending-delivery` | Até 20 pendências `{id,contextKey}` para o destinatário autenticado. Contexto `friend:{uuid}` ou `room:{uuid}`. Não confirma recebimento nem devolve o conteúdo. Exclui mensagens removidas/ocultas, bloqueios e vínculos sem acesso. |
| `GET /friends/{id}/messages/target/{messageId}` ou `GET /study-rooms/{id}/messages/target/{messageId}` | Busca autorizada do envelope/mensagem antes de confirmar entrega; retorno em lista. No privado, mantém o conteúdo cifrado. |
| `POST /friends/{id}/messages/receipts` ou `POST /study-rooms/{id}/messages/receipts` | `{messageIds: UUID[], read: boolean}`, de 1 a 100 IDs. Atualiza somente os recibos do próprio destinatário, naquele vínculo/sala e com acesso válido. Repetir a confirmação não altera timestamps já registrados. |

Listagens e buscas de mensagens acrescentam `receiptTotal`, `deliveredCount` e `readCount`. O conjunto de destinatários é registrado quando a mensagem é enviada. `read=true` confirma também a entrega; o cliente só o envia para conteúdo visível com documento visível e focado. Entrega é confirmada após buscar a mensagem real, inclusive pelo receptor em segundo plano enquanto o aplicativo estiver executando. Não depende apenas de presença ou notificação. Uma marca significa aceita pelo servidor; duas cinzas, todos os destinatários receberam; duas azuis, todos leram. Registros antigos sem recibos não recebem entrega/leitura retroativa.

Escritas de recibos têm bucket de 120 requisições/minuto por usuário; uploads de anexos de sala, oito/minuto. O gravador da interface limita a captura a 120 segundos; a API limita tamanho/formato, não afirma ter medido a duração de qualquer arquivo arbitrário. A API recebe o anexo privado cifrado e não inspeciona sua assinatura em texto claro. A proteção por custódia de conta é descrita em [CHAT_PRIVACY](CHAT_PRIVACY.md); não implica E2EE inacessível ao serviço. Persistência e idempotência de sala são acrescentadas por V66.

## Convites e personalização — lote 02/11/2026

| Método/rota | Contrato |
| --- | --- |
| `POST /study-rooms/{id}/share-code` | Exige membership; retorna `{code,url}` atual da sala. |
| `GET /study-rooms/{id}/qr` | QR do convite; exige membership. |
| `GET /study-rooms/join-code/{code}` | Exige conta autorizada a usar recursos estudantis. Código de oito letras/números; retorna `id,title,status,endsAt,subjectName,hasAvatar,hasBanner,mediaVersion,available,participantCount`. Não inscreve o leitor nem retorna conversas/membros. |
| `POST /study-rooms/join-code/{code}/join` | Entrada por convite, inclusive em sala cheia ou já iniciada; continua rejeitando sala encerrada, usuário removido e bloqueios aplicáveis. |
| `DELETE /users/me/avatar` ou `/users/me/banner` | Remove somente a mídia do usuário autenticado. Interface exibe a ação apenas se a imagem existe. |
| `GET/PUT /users/me/experience` | `theme` aceita `LIGHT`, `DARK`, `SYSTEM`, `ENTURMA`; demais campos de acessibilidade permanecem. V68 amplia a restrição sem modificar preferências anteriores. |

Envio direto de convite reutiliza `POST /friends/{id}/messages` com envelope cifrado, sem endpoint que envie mensagens automaticamente. O diálogo confirma amizade e membership antes de preparar o envio. A interface reconhece links de convite da própria origem, limita a três cards por mensagem e busca metadados somente ao aproximar o card da área visível. Apps ocultam “Copiar link”; Web preserva link/QR e também oferece convite direto.

# API v1

Base `/api/v1`. Todos os endpoints, exceto autenticação inicial, health e leitura GET `/catalog/**`, exigem `Authorization: Bearer <access>`. Erros: `timestamp`, `status`, `code`, `message`, `path`, `requestId`.

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
| POST/DELETE /notifications/push-device                 | Registrar/remover instalação Android para push                                                                                 |
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

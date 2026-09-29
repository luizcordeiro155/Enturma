# API v1

Base `/api/v1`. Todos os endpoints, exceto autenticação inicial e health, exigem `Authorization: Bearer <access>`. Erros: `timestamp`, `status`, `code`, `message`, `path`, `requestId`.

| Método/rota | Função |
|---|---|
| POST /auth/register, /auth/login | Cadastro/login; tokens + expiresIn + userId |
| POST /auth/refresh | `{token}`; rotação de refresh |
| POST /auth/logout | Revogar sessão atual |
| GET /auth/sessions; DELETE /auth/sessions/{id} | Dispositivos e revogação |
| POST /auth/forgot-password | `{email}`; sempre 204 se entrada válida |
| POST /auth/reset-password | `{token,password}` |
| POST /auth/verify-email | `{token}` |
| GET /academics | kind, parentId, search, page; 30 itens |
| GET /users/me | Perfil, matrícula e matérias |
| PUT /users/me/enrollment | periodId, subjectIds, shift, preferences |
| GET /study-rooms | subjectId opcional, page |
| POST /study-rooms | subjectId, topicId, title, minutes, maxParticipants; retorna sala e reused |
| GET /study-rooms/{id} | Detalhes autorizados |
| POST /study-rooms/{id}/join, /leave, /end | Participação/encerramento |
| DELETE /study-rooms/{id}/participants/{userId} | Remover participante |
| GET/POST /study-rooms/{id}/messages | Listar/enviar; body e replyTo |
| PUT/DELETE /study-rooms/{id}/messages/{messageId} | Editar/remover |
| POST /study-rooms/{id}/voice | Grant LiveKit de áudio |
| GET/POST /study-rooms/{id}/materials | Listar/upload multipart `file` |
| GET /study-rooms/{id}/materials/{materialId} | Download autorizado |
| POST /study-rooms/{id}/ai | question, mode; resposta e trechos recuperados |
| GET /capabilities | Flags efetivas de voz, materiais e IA |
| GET/POST /rides; GET /rides/mine | Descoberta, publicação e minhas caronas |
| POST /rides/{id}/interest, /complete, /cancel | Interesse e ciclo de vida |
| GET /matches; POST /matches/{id}/accept | Pedidos e aceite |
| GET/POST /matches/{id}/messages | Chat privado após aceite |
| PUT /matches/{id}/meeting-point | `{point}` somente para o par aceito |
| POST /matches/{id}/review | `{rating:1..5}` após conclusão |
| GET /blocks; POST/DELETE /blocks/{id} | Bloqueios |
| POST /reports | targetId, reason |
| GET /notifications; POST /notifications/{id}/read | Notificações internas |
| GET /admin/academics; POST /admin/academics/import | Catálogo administrativo |
| PUT /admin/users/{id}/status | ACTIVE, SUSPENDED ou BANNED; auditado |

Swagger/OpenAPI usa springdoc, desabilitado por padrão (`OPENAPI_ENABLED=false`). Para desenvolvimento habilite a variável; os endpoints de documentação também exigem autenticação. O pacote TypeScript mantém os contratos usados pelos clientes; geração automática OpenAPI ainda não faz parte do pipeline.

## Importação

Body `{ "entries": [...] }`, até 500 entradas por transação, com pais primeiro. Cada entrada: `id` (UUID), `kind` (INSTITUTION, CAMPUS, COURSE, CURRICULUM, PERIOD, SUBJECT, TOPIC), `parentId`, `name`, `code` opcional, `curriculumVersion` obrigatória para CURRICULUM, `periodNumber` para PERIOD, `sourceUrl` HTTPS, `sourceName`, `verifiedAt`, `validFrom`, `validUntil` opcional, `status` (VERIFIED, PENDING_VERIFICATION, OUTDATED, ARCHIVED). VERIFIED exige data de verificação não futura. Verificação humana da autenticidade da fonte continua necessária.

Os exemplos de testes não representam nenhuma universidade real. Não use as fixtures como catálogo inicial.

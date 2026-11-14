# Matriz de paridade — inventário inicial

> Registro histórico do primeiro incremento. O estado atual está em [Prontidão de publicação](SOCIAL_3_RELEASE_READINESS.md) e [contrato Studio](SOCIAL_STUDIO_RELEASE.md). A PR consolidada inclui V72/V73; as observações abaixo sobre ausência de migrations/arquivo de release descrevem apenas a base original.
Base: feat/social-3-part1, e1c2d39. Alterações locais de Feed preservadas em codex/social-instagram-parity. Não houve deploy. SOCIAL_STUDIO_RELEASE.md não existe nesta revisão. Implementação não equivale a habilitação ou homologação em produção.

| Recurso | Referência | Enturma atual / Desktop e Mobile | Backend / evidência | Prioridade / testes / status |
|---|---|---|---|---|
| Feed | Coluna contínua, Stories no topo | Implementado; ajuste local de área de scroll | SocialPosts, GET /feed; social-stream.tsx | P0: cursor, pull, preservação; 10 testes stream/pager aprovados |
| Publicações | Prévia e opções de publicação | Editor compartilhado implementado; equivalência visual não verificada | PUT /drafts, POST /posts/{id}/publish, DELETE /posts/{id} | P1: upload interrompido, autorização, revisão; auditoria pendente |
| Stories | Avatares e visualização sequencial | Implementado com overlays e destaques | SocialPosts; V69/V70; /highlight, /viewers | P1: expiração/privacidade; regressão pendente |
| Clips | Vídeo vertical e ações laterais | Implementado; mudanças recentes na branch | SocialTranscoder, SocialMedia, social-clips.tsx | P1: vídeo único, 90s, pausa; runtime não verificado |
| Perfis | Grade e relações | Abas, contadores, seguir e privados implementados | SocialPeople; /people/{id}, /connections, /follow | P1: bloqueio e solicitações; revalidação pendente |
| Explorar | Descoberta e pesquisa | Busca existente; grade dedicada/histórico não comprovados | /feed?q, /people | P2: privacidade e resultados vazios; planejado |
| Mensagens | Compartilhar e conversar | Chat existente reutilizado entre amigos; grupos sociais não comprovados | preparePrivateShare; chat cifrado | P1: entrega/leitura e prévia autorizada; pendente |
| Notificações | Interações e seguidores | Fanout e preferências implementados | SocialMaintenance, NotificationService | P1: destino e deduplicação; pendente |
| Complementares | Lives, coleções, audiência | Bloqueio/moderação existentes; Lives sociais e coleções nomeadas não comprovadas | SocialAccess, SocialReview | P2: arquitetura e consentimento antes de expor; planejado |

Fonte de composição: social-instagram-reference.md. Fonte dos contratos: SocialApiController.java e SOCIAL_2_IMPLEMENTATION.md. Controles completos devem ser auditados por objeto, inclusive mídia e notificações. Nenhuma nova migration neste incremento. R2/FFmpeg e flags de produção não foram verificados nesta fase.

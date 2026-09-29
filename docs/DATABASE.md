# Banco

Flyway aplica migrations versionadas no startup; Hibernate usa somente `validate`.

| Migration | Conteúdo |
|---|---|
| V1 | Usuários, sessões, tokens consumidos, ações por e-mail, outbox, auditoria e rate limit |
| V2 | Catálogo com fonte/vigência e matrícula acadêmica |
| V3 | Salas, participantes, chat, bloqueios, denúncias, notificações |
| V4 | Caronas, matches, chat privado e avaliações |
| V5 | Materiais, chunks, busca textual, histórico de IA e limpeza de voz |

UUIDs, FKs, constraints e índices protegem integridade. Datas operacionais são `timestamptz`; regras usam `now()` no banco ou `Instant` em Java. Vigência curricular usa `date`.

Criação/reutilização de sala serializa pelo registro da disciplina. Entrada bloqueia a sala antes de contar vagas. Aceite de carona bloqueia a carona antes de contar matches. Todas as mutações relacionadas ficam na mesma transação.

Importação é atômica: pai deve existir, tipo deve corresponder e um registro existente não muda de tipo nem pai. Alterações relevantes guardam valor anterior/novo no audit_log. Dados não verificados não são aceitos no onboarding. Não existe seed acadêmico de produção. Fixtures de testes têm rótulo TESTE e fonte `example.test`.

Antes de modificar uma migration já aplicada, criar uma nova versão. Testar restauração e migração a partir de backup de staging. A manutenção/expurgo de tokens, logs, outbox e históricos precisa de política de retenção aprovada antes da operação pública.

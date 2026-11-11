# Banco

Flyway aplica migrations versionadas no startup; Hibernate usa somente `validate`.

| Migration | Conteúdo                                                                               |
| --------- | -------------------------------------------------------------------------------------- |
| V1        | Usuários, sessões, tokens consumidos, ações por e-mail, outbox, auditoria e rate limit |
| V2        | Catálogo com fonte/vigência e matrícula acadêmica                                      |
| V3        | Salas, participantes, chat, bloqueios, denúncias, notificações                         |
| V4        | Caronas, matches, chat privado e avaliações                                            |
| V5        | Materiais, chunks, busca textual, histórico de IA e limpeza de voz                     |

UUIDs, FKs, constraints e índices protegem integridade. Datas operacionais são `timestamptz`; regras usam `now()` no banco ou `Instant` em Java. Vigência curricular usa `date`.

Criação/reutilização de sala serializa pelo registro da disciplina. Entrada bloqueia a sala antes de contar vagas. Aceite de carona bloqueia a carona antes de contar matches. Todas as mutações relacionadas ficam na mesma transação.

Importação é atômica: pai deve existir, tipo deve corresponder e um registro existente não muda de tipo nem pai. Alterações relevantes guardam valor anterior/novo no audit_log. Dados não verificados não são aceitos no onboarding. Os providers carregam snapshots oficiais revisados em produção. Fixtures de testes têm rótulo TESTE e fonte `example.test`.

Antes de modificar uma migration já aplicada, criar uma nova versão. Testar restauração e migração a partir de backup de staging. A manutenção/expurgo de tokens, logs, outbox e históricos precisa de política de retenção aprovada antes da operação pública.

## Extensões 0.3.0

V23 acrescenta ciclo de salas/presença/eventos, preferências de notificação/outbox, definições/progresso/concessões de conquistas, perfil/widgets/privacidade, casos/ações/evidências de moderação e registry/assignments/progresso acadêmico. Constraints e ledger garantem idempotência. V24 cria fila exclusiva de revisão de room_message, sem tocar mensagens privadas cifradas. V25 representa pools oficiais de optativas sem semestre, com organization ELECTIVES e número nulo; demais períodos continuam numerados.

Os snapshots oficiais UNA/PUC/UFMG são importados por jobs em lotes, com validação, revisão/auditoria e retomada. Não são fixtures fictícias. Migrations V1–V22 foram preservadas. Validar migração em banco vazio e atualização do banco existente antes da publicação.

---

## Inventário das migrations — revisado em 03/11/2026

A árvore atual contém **67 arquivos SQL de migration: V1–V66 e V68**, sem V67. O Flyway aceita saltos no versionamento; a presença no repositório não prova aplicação no banco de produção. Conferir `flyway_schema_history` antes de divulgar o schema efetivo.

| Versões | Principais mudanças |
|---|---|
| V1–V5 | Contas, catálogo legado, salas, chat, caronas, documentos e IA |
| V6–V22 | Catálogo normalizado, aprendizagem, vínculos, segurança e persistência |
| V23–V29 | Comunidade, moderação, optativas, push Android/Web/Desktop e realtime |
| V30–V34 | Campus, privacidade, modo professor e tutor adaptativo |
| V35–V39 | Dispatch e mobilidade universitária, GPS e embarque |
| V40–V44 | Imagens e chamadas privadas, presença, reações e penalidades |
| V45–V49 | Identidade acadêmica e suporte, perfil, fontes e rotinas |
| V50–V54 | Mural, mídia de perfil, convites, Monitor e cofre da conta |
| V55–V59 | Digitação privada, atividade, segurança de caronas, portfólio e Cadernos IA |
| V60 | Biblioteca pessoal de GIFs/figurinhas |
| V61 | Invalidação de convites previamente divulgados |
| V62 | RLS default-deny para papéis comuns, sem restringir superusuário/BYPASSRLS |
| V63 | `media_kind` opcional para mensagens com anexo |
| V64 | Custódia cifrada da chave de sincronização da conta |
| V65 | Índices de proprietário e referência de anexos de salas |

| V66 | Idempotência de mensagens por `client_id` e tabelas de recibos de entrega/leitura em chats privados e de salas |
| V68 | Tema opcional `ENTURMA` na preferência de experiência, sem modificar valores anteriormente gravados |

**Não existe V67 no repositório.** O lote dos convites reutiliza tabelas e contratos existentes. Mensagens antigas não recebem confirmação de leitura/entrega inferida.

Não modificar migrations históricas. Antes de qualquer atualização, fazer backup, simular restauração, validar foreign keys e testes com banco isolado. Publicar o backend compatível antes dos clientes que usem novas colunas.

A consulta **histórica** de 28/10 confirmou Flyway V65 naquela data. O código atual inclui V66 e V68; a aplicação real em produção exige consulta a `flyway_schema_history`. A credencial examinada ignorava RLS; a role efetiva da API em execução ainda deve ser comprovada. [Separação de permissões e restore](OPERATIONS_READINESS.md).

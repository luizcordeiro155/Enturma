# Operação, recuperação e liberação

**Decisão do responsável — 30/10/2026:** publicação em produção autorizada sem exigir homologação em aparelhos físicos, assinatura Windows ou validações operacionais como gates. A dispensa anterior de backup externo permanece. Esses itens não são apresentados como testes concluídos. A publicação continua condicionada aos checks de código desta revisão; evidências e limites no [ciclo de experiência](RELEASE_EXPERIENCE_STABILIZATION.md). As avaliações históricas abaixo conservam seu escopo original.

Complemento do [relatório de readiness](PRODUCTION_READINESS.md). Este runbook não declara tarefas externas executadas.

## Banco: migração separada de runtime

`spring.flyway` aceita `FLYWAY_DATABASE_URL`, `FLYWAY_DATABASE_USERNAME` e `FLYWAY_DATABASE_PASSWORD`; sem essas variáveis preserva a conexão atual. As URLs Flyway devem estar no formato JDBC. As credenciais de runtime continuam em `DATABASE_*`. Nunca preencher valores em arquivos versionados.

Preparação de staging: executar [postgres-runtime-role.sql](../deploy/postgres-runtime-role.sql) como proprietário das migrations. Ele cria um papel NOLOGIN sem superusuário, criação de roles/bancos ou BYPASSRLS, concede DML e uma política **de confiança no backend**, não isolamento por estudante. Usar um login separado, criado pelo operador com segredo protegido, que assuma/herde esse papel. Nenhum login runtime deve ser proprietário das tabelas ou membro de um papel privilegiado. Confirmar ausência de CREATE via PUBLIC no schema. A role não recebe TRUNCATE nem alteração de `flyway_schema_history`.

Após novas tabelas, reaplicar os grants/políticas revisados; omissões de RLS falham fechadas. Testar cadastro, sessão, chat, notificações, IA, jobs e exclusão/exportação com a role efetiva antes de alterar SquareCloud. A CI verifica atributos, leitura e escrita transacional no banco restaurado sintético, mas não simula todas as rotas com a nova role.

**Não aplicar esta preparação automaticamente em produção.** A API atualmente aplica autorização por dono/membro; o script não transforma essa arquitetura em isolamento multi-tenant por políticas PostgreSQL.

## Backup e restauração

**Decisão do responsável em 28/10/2026:** não existem backups externos e sua configuração foi dispensada nesta entrega. As orientações abaixo permanecem como referência para adoção futura, não como condição de publicação. Recuperação real continua não comprovada; nenhum backup foi criado ou removido por esta decisão.

- Definir RPO, RTO e retenção com o responsável pela operação. Valores ainda não aprovados.
- Backup precisa cobrir PostgreSQL, objetos privados e chave `CHAT_ACCOUNT_MASTER_KEY`, com controles separados. Um dump sem a chave pode preservar ciphertext sem permitir recuperação.
- Armazenar cópias cifradas fora do volume principal; restringir acesso, registrar execução e testar restauração numa rede isolada sem envios de e-mail/push/IA.
- Conferir Flyway, FKs, contagens, propriedade de objetos, abertura de chat sintético, exportação/exclusão e login com credenciais de teste. Medir duração e perda efetiva; não publicar conteúdo dos backups.
- A CI executa `scripts/verify-isolated-restore.sh`, limitada a localhost/enturma_test, e compara contagens por tabela após `pg_dump`/`pg_restore`. O relatório diferencia explicitamente esse ensaio de backup real de produção.
- Um teste real deve usar ambiente protegido e autorização de tratamento de dados; não copiar dados pessoais para previews públicos.

## Release e rollback

1. Guardar SHA, checks e artefatos da PR; gates da readiness satisfeitos antes do merge.
2. Registrar a dispensa de backup externo e confirmar a configuração de chaves sem expor seus valores; não gerar nova chave mestre durante deploy. Não afirmar que existe recuperação validada.
3. Implantar API compatível; verificar health sem expor detalhes e fluxos sintéticos autorizados. Esta revisão não introduz schema novo.
4. Promover Web; validar login existente, usuário pendente, start público e navegação. Observar falhas/latência antes de distribuição nativa.
5. Publicar cliente nativo apenas após instalação/upgrade/rollback físicos, preservando assinatura e dados.
6. Em regressão, promover o deployment Web anterior e o JAR anterior compatível. **Não executar down-migration nem restaurar backup sobre produção como rollback automático.** Mensagens novas e chaves devem ser preservadas. Interromper promoção e investigar antes de alterar dados.

## Métricas e escala

Medir p50/p95/p99 por operação, taxa de erro, duração de autenticação/refresh, espera do pool, consultas por snapshot, WS abertos por tipo, atraso de outbox e falhas do provedor. Usar requestId e contadores sem corpos, tokens, documentos ou localização. `/actuator/health` público é resumido; não expor métricas administrativas sem autenticação/rede protegida.

`Realtime` mantém conexões/digitação em memória e reconcilia snapshots periodicamente. Limite configurado de conexões não é capacidade comprovada. Antes de multi-réplica, medir fanout/ordenação/reconexão e definir coordenação compartilhada. Não adicionar Redis apenas por presença no Compose; seu custo e consumidor precisam de justificativa medida.

O teste BFF de Cadernos registra 12 leituras sequenciais com um usuário sintético. Ele não mede chat sob carga, não compara antes/depois e não valida milhares de usuários. Benchmark de staging progressivo e distribuído continua pendente.

## Privacidade e incidentes

Revisar retenção, bases legais, controladores/operadores, transferências e atendimento de titulares com responsável jurídico. O código de exportação/exclusão e sua regressão são evidência técnica limitada. Restauração pode reintroduzir dados excluídos: manter procedimento de reaplicação das solicitações após restore. Não prometer apagamento instantâneo de backups.

Referências oficiais para o processo: [guia de segurança ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte) e [comunicação de incidentes](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis). Não há certificação jurídica nesta revisão.

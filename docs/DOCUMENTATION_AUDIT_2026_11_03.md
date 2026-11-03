# Auditoria de documentação Enturma — 03/11/2026

## Base e escopo

Repositório [`luizcordeiro155/Enturma`](https://github.com/luizcordeiro155/Enturma), `main` no commit [`9270a5f`](https://github.com/luizcordeiro155/Enturma/commit/9270a5fe08afd51e1b38926c11431587bfc5ad26), PR [#135](https://github.com/luizcordeiro155/Enturma/pull/135). **57 Markdown**, **8 ativos não Markdown em `docs/`** e `LICENSE` inventariados. Comparação estática entre documentos, árvore de arquivos, migrations, versões, componentes Web, PRs, CI e evidências Railway. **Não** houve teste de dispositivo físico, pentest, restore de produção ou medição de capacidade nesta auditoria.

## Estado comprovado

- PRs #133, #134 e #135 integradas. PR #132 ainda aberta; não confundir seu código com mudanças mescladas.
- CI pós-merge [41478805937](https://github.com/luizcordeiro155/Enturma/actions/runs/41478805937) e secret scanning passaram. A PR #135 registra 137 testes Java, 175 Web e 52 E2E.
- Web publicada; Railway Windows `Enturma Desktop Download v5` deployment `ce120d56-57f0-4692-b9f2-7e6382606eef` `SUCCESS`; Android `Enturma Android Download v3` deployment `b24c25e1-fb48-4598-92fd-efb0d60d4f17` `SUCCESS`. Ambos construíram **0.4.424** do mesmo commit, com healthcheck aprovado.
- Versões de workspace: Web **0.3.0**, Expo Android **0.3.30** (versionCode 33), Electron **0.3.15**. O builder calcula a versão distribuída; não reescrever package.json para “corrigir” a versão pública.
- Banco: **67 arquivos SQL**, V1–V66 e V68, **sem V67**. V66 implementa idempotência/recibos; V68 permite tema `ENTURMA`. Conferir `flyway_schema_history` para comprovar aplicação no banco real.

## Divergências e correções

| Prioridade | Arquivos | Divergência | Correção |
| --- | --- | --- | --- |
| Alta | `docs/DATABASE.md` | Inventário encerrava em V65 | Atualizado para V66/V68, ausência de V67 e distinção arquivo/schema implantado |
| Alta | `README.md`, `docs/STATUS.md` | Falta do encerramento PR #135 e mistura de versões declaradas/distribuídas | Baseline 0.4.424, SHA, CI e riscos residuais |
| Alta | `apps/desktop/README.md`, `docs/DESKTOP.md` | NSIS da Railway descrito como futuro; EXE/ZIP não diferenciados | Documentada distribuição NSIS 0.4.424 e links de EXE/ZIP/manifest |
| Alta | `database/imports/README.md` | Negava importação CSV, apontava rota antiga e dizia que não havia catálogo de produção | Atualizados endpoints JSON/CSV e snapshots revisados |
| Alta | `docs/PWA.md` | Dizia que /download não oferece EXE/APK, apesar do código da página; ignorava Web Push registrado | EXE/APK como principais, PWA alternativa e Web Push VAPID separado do FCM |
| Média | `docs/ACADEMIC_CATALOG.md` | Citava apenas três minigames | Termo Dev incluído como quarto jogo atual |
| Média | `docs/RELEASE_EXPERIENCE_STABILIZATION.md` | Não registrava final da distribuição #135 | Adicionados deployments, versão e limites da homologação |
| Média | `docs/PRODUCTION_READINESS.md` | RC histórica de 28/10 podia ser interpretada como release atual | Nota histórica sem reescrever fatos da RC |
| Média | `docs/OPERATIONS_READINESS.md`, `docs/DEPLOYMENT.md` | Sem baseline 0.4.424 e limites de backup destacados | Complementos operacionais e distinção decisão de dispensa vs teste executado |
| Média | `docs/ARCHITECTURE.md`, `docs/DEPENDENCY_AUDIT.md` | Referência antiga de schema; alertas npm poderiam ser confundidos com scan de hoje | Atualização V66/V68 e escopo temporal de 45 alertas da PR #133 |
| Média | `docs/DOCUMENTATION_INDEX.md` | Inventário 28/10 e referências anteriores | Índice reconstruído com todos os Markdown e ativos |
| Investigação | `README.md` | Modo professor anunciado com completude não demonstrada na auditoria | Qualificado: exigir validação funcional ponta a ponta |

## Limites e pendências reais

1. Confirmar manifests públicos, arquivos baixados e correspondência SHA-256/version/sourceCommit; a auditoria usou logs Railway e healthchecks, não uma instalação física.
2. Homologar instalação/upgrade/rollback, IME, microfone, câmera, GPS, notificações e mídia real em Windows/Android. Authenticode Windows não está configurado; iOS não tem distribuição oficial confirmada.
3. Consultar `flyway_schema_history` e role efetiva da API. RLS habilitado não comprova isolamento por estudante se runtime privilegiado o ignora.
4. Reavaliar backup/restore e custódia de `CHAT_ACCOUNT_MASTER_KEY`. Backup externo foi dispensado pelo responsável, mas recuperação real não foi demonstrada.
5. Reexecutar `npm audit`; as **45 entradas** (6 altas, 38 moderadas, 1 baixa) pertencem ao inventário da PR #133 e não a uma nova varredura de 03/11.
6. Verificar módulo Turmas/Professor ponta a ponta; migrations/tabelas não demonstram, sozinhas, jornada completa.
7. Testar carga, escalabilidade multi-réplica do WebSocket, banco, filas e provedores externos em staging. Não inventar capacidade de usuários simultâneos.
8. Revisar textos de privacidade/termos, retenção e contratos LGPD com responsável habilitado. `LICENSE` proprietária não foi alterada.

## Inventário individual

| Arquivo | Tratamento |
| --- | --- |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Revisado; sem mudança comprovada |
| [`README.md`](../README.md) | Corrigido nesta PR |
| [`SECURITY.md`](../SECURITY.md) | Revisado; sem mudança comprovada |
| [`apps/desktop/README.md`](../apps/desktop/README.md) | Corrigido nesta PR |
| [`apps/web/AGENTS.md`](../apps/web/AGENTS.md) | Revisado; sem mudança comprovada |
| [`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md) | Revisado; sem mudança comprovada |
| [`database/imports/README.md`](../database/imports/README.md) | Corrigido nesta PR |
| [`database/seeds/README.md`](../database/seeds/README.md) | Revisado; sem mudança comprovada |
| [`deploy/squarecloud/LEIA-ME.md`](../deploy/squarecloud/LEIA-ME.md) | Revisado; sem mudança comprovada |
| [`docs/ACADEMIC_CATALOG.md`](ACADEMIC_CATALOG.md) | Corrigido nesta PR |
| [`docs/ACADEMIC_CATALOG_IMPLEMENTATION_PLAN.md`](ACADEMIC_CATALOG_IMPLEMENTATION_PLAN.md) | Histórico preservado |
| [`docs/ACADEMIC_DATA_MODEL.md`](ACADEMIC_DATA_MODEL.md) | Revisado; sem mudança comprovada |
| [`docs/ACADEMIC_IDENTITY_ROLLOUT.md`](ACADEMIC_IDENTITY_ROLLOUT.md) | Histórico preservado |
| [`docs/ACADEMIC_IMPORTS.md`](ACADEMIC_IMPORTS.md) | Revisado; sem mudança comprovada |
| [`docs/ACADEMIC_PROVIDERS.md`](ACADEMIC_PROVIDERS.md) | Revisado; sem mudança comprovada |
| [`docs/ACADEMIC_VERIFICATION.md`](ACADEMIC_VERIFICATION.md) | Revisado; sem mudança comprovada |
| [`docs/AI.md`](AI.md) | Revisado; sem mudança comprovada |
| [`docs/API.md`](API.md) | Revisado; sem mudança comprovada |
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | Corrigido nesta PR |
| [`docs/AUTHENTICATION.md`](AUTHENTICATION.md) | Revisado; sem mudança comprovada |
| [`docs/CARPOOL.md`](CARPOOL.md) | Revisado; sem mudança comprovada |
| [`docs/CHAT_INTERACTIONS.md`](CHAT_INTERACTIONS.md) | Revisado; sem mudança comprovada |
| [`docs/CHAT_PRIVACY.md`](CHAT_PRIVACY.md) | Revisado; sem mudança comprovada |
| [`docs/COMMUNITY_AND_RIDE_UPDATES.md`](COMMUNITY_AND_RIDE_UPDATES.md) | Revisado; sem mudança comprovada |
| [`docs/COMMUNITY_V03.md`](COMMUNITY_V03.md) | Histórico preservado |
| [`docs/DATABASE.md`](DATABASE.md) | Corrigido nesta PR |
| [`docs/DEPENDENCY_AUDIT.md`](DEPENDENCY_AUDIT.md) | Corrigido nesta PR |
| [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) | Corrigido nesta PR |
| [`docs/DESKTOP.md`](DESKTOP.md) | Corrigido nesta PR |
| [`docs/DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md) | Corrigido nesta PR |
| [`docs/IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) | Histórico preservado |
| [`docs/INTRO_EXPERIENCE.md`](INTRO_EXPERIENCE.md) | Revisado; sem mudança comprovada |
| [`docs/LEARNING.md`](LEARNING.md) | Revisado; sem mudança comprovada |
| [`docs/MOBILE.md`](MOBILE.md) | Corrigido nesta PR |
| [`docs/NOTIFICATIONS_AND_LIVE_FORUM.md`](NOTIFICATIONS_AND_LIVE_FORUM.md) | Revisado; sem mudança comprovada |
| [`docs/OPERATIONS_READINESS.md`](OPERATIONS_READINESS.md) | Corrigido nesta PR |
| [`docs/PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) | Corrigido nesta PR |
| [`docs/PWA.md`](PWA.md) | Corrigido nesta PR |
| [`docs/REALTIME.md`](REALTIME.md) | Revisado; sem mudança comprovada |
| [`docs/RELEASE_CHAT_SECURITY.md`](RELEASE_CHAT_SECURITY.md) | Histórico preservado |
| [`docs/RELEASE_EXPERIENCE_STABILIZATION.md`](RELEASE_EXPERIENCE_STABILIZATION.md) | Corrigido nesta PR |
| [`docs/RELEASE_NATIVE_INSTALLER.md`](RELEASE_NATIVE_INSTALLER.md) | Histórico preservado |
| [`docs/RELEASE_PUBLIC_START_SECURITY.md`](RELEASE_PUBLIC_START_SECURITY.md) | Histórico preservado |
| [`docs/SECURITY.md`](SECURITY.md) | Revisado; sem mudança comprovada |
| [`docs/SQUARECLOUD_GIT.md`](SQUARECLOUD_GIT.md) | Revisado; sem mudança comprovada |
| [`docs/STATUS.md`](STATUS.md) | Corrigido nesta PR |
| [`docs/STUDY_JOURNEY.md`](STUDY_JOURNEY.md) | Revisado; sem mudança comprovada |
| [`docs/STUDY_NOTEBOOKS.md`](STUDY_NOTEBOOKS.md) | Revisado; sem mudança comprovada |
| [`docs/STUDY_ROOMS.md`](STUDY_ROOMS.md) | Revisado; sem mudança comprovada |
| [`docs/UX_CHAT_CALLS_REFINEMENT.md`](UX_CHAT_CALLS_REFINEMENT.md) | Revisado; sem mudança comprovada |
| [`docs/V0_3_IMPLEMENTATION.md`](V0_3_IMPLEMENTATION.md) | Histórico preservado |
| [`docs/connected-student-experience.md`](connected-student-experience.md) | Revisado; sem mudança comprovada |
| [`docs/design/START_PRESENTATION.md`](design/START_PRESENTATION.md) | Revisado; sem mudança comprovada |
| [`docs/design/SYSTEM.md`](design/SYSTEM.md) | Revisado; sem mudança comprovada |
| [`docs/design/VERIFICATION.md`](design/VERIFICATION.md) | Revisado; sem mudança comprovada |
| [`docs/history/STATUS_2026_10_25.md`](history/STATUS_2026_10_25.md) | Histórico preservado |
| [`docs/mobile-study-polish.md`](mobile-study-polish.md) | Revisado; sem mudança comprovada |

## Escopo da mudança

Somente arquivos Markdown. Nenhum código, migration SQL, segredo, pacote, instalador ou licença foi alterado. Os documentos de releases anteriores mantêm datas/resultados originais. O checker de links locais e a CI devem ser validados antes de mesclar a PR.

# Estado atual — 30/10/2026

O Enturma está em estabilização. A [Release Candidate](PRODUCTION_READINESS.md) registra as correções, evidências e gates ainda pendentes. **NO-GO para anunciar homologação integral ou escala comprovada.**

O [ciclo atual de experiência](RELEASE_EXPERIENCE_STABILIZATION.md), na [PR #133](https://github.com/luizcordeiro155/Enturma/pull/133), acrescenta visitante exclusivo da Web, login/cadastro com identidade oficial, correções de áudio e digitação, escolha de qualidade de transmissão e melhorias do instalador/atualizador Windows. Resultados e artefatos devem ser associados ao SHA verificado; não equivalem a publicação em produção.

| Área | Estado verificado |
| --- | --- |
| Web | Next.js/React; start público, visitante com catálogo real, autenticação e experiência acadêmica compartilhada; visitante não libera ações privadas |
| Android distribuído | Shell WebView gerado por deploy/android-download/install-web-shell.cjs; pacote Expo é também insumo do builder, seu export não homologa o APK |
| Desktop | Electron, instalador e atualizador próprios; versão declarada e versão distribuída podem diferir |
| API | Java 21 / Spring Boot 3.5.16; dependências e alertas em [auditoria](DEPENDENCY_AUDIT.md) |
| PostgreSQL | Migrations até V65; autorização por objeto no Java; papel efetivo de produção precisa de validação |
| Chat privado | Cifragem no cliente e custódia cifrada por conta, recuperável pela API; não E2EE inacessível ao serviço |
| iOS | Export técnico na CI; sem homologação/publicação oficial confirmada |
| Escala e backup | Carga limitada a leituras em serviços efêmeros na CI, com relatório no ciclo atual; capacidade de produção não homologada. Backup externo inexistente e dispensado pelo responsável em 28/10/2026; recuperação real não comprovada |

Pacotes: Web 0.3.0, Expo Android 0.3.30/code 33 e Desktop 0.3.15. O builder calcula a versão distribuída; consultar os manifests oficiais antes de anunciar um release. SHA-256 verifica integridade, **não é assinatura digital Authenticode**.

Documentos de implementação antigos são históricos. Consulte o [inventário](DOCUMENTATION_INDEX.md), [operação e rollback](OPERATIONS_READINESS.md) e o [estado anterior preservado](history/STATUS_2026_10_25.md).

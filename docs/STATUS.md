# Estado atual — 11/11/2026

## Enturma Social 2.0 — PR #144

A [PR #144](https://github.com/luizcordeiro155/Enturma/pull/144) adiciona Feed, Clips, Stories, seguidores, editor de vídeo e compartilhamento mobile de salas. O Fórum permanece independente. A navegação Social tem barra própria, saída para o início e abertura Remotion exclusiva; a navegação principal mobile inclui Social Entu e move Cadernos IA para Mais, com Programação limitada à elegibilidade acadêmica.

A integração na `main` foi autorizada em 11/11/2026 e depende da aprovação dos checks desta revisão. `SOCIAL_ENABLED` e `SOCIAL_MEDIA_ENABLED` permanecem desligadas por padrão. O bucket R2 privado foi testado; credenciais e runtime de processamento na API de produção ainda precisam ser configurados. [Implementação, contratos, testes e limites](SOCIAL_2_IMPLEMENTATION.md).

Os manifests públicos Windows/Android consultados em 11/11/2026 ainda informam **0.4.424**, commit `9270a5f`. Essa verificação não equivale à publicação dos novos binários da PR #144.

## Última release confirmada — PR #135

Na publicação de 02/11/2026, a revisão distribuída foi [`9270a5f`](https://github.com/luizcordeiro155/Enturma/commit/9270a5fe08afd51e1b38926c11431587bfc5ad26), da [PR #135](https://github.com/luizcordeiro155/Enturma/pull/135). A Web foi publicada e os serviços Railway de download concluíram a distribuição nativa **0.4.424**: Windows deployment `ce120d56-57f0-4692-b9f2-7e6382606eef` e Android `b24c25e1-fb48-4598-92fd-efb0d60d4f17`, ambos `SUCCESS`, com versão/commit validados nos logs e healthcheck aprovado. Não se afirma instalação física testada.

A [CI pós-merge 41478805937](https://github.com/luizcordeiro155/Enturma/actions/runs/41478805937) passou, bem como o secret scanning. A PR #135 registra **137 testes Java, 175 Web e 52 E2E**. PRs #133 e #134 também estão integradas; a [PR #132](https://github.com/luizcordeiro155/Enturma/pull/132) permanece aberta e não deve ser tratada como merge concluído.

A publicação **não** equivale a homologação física Android/Windows, assinatura Authenticode, restore de produção, RLS por estudante ou escala comprovada. Consulte [auditoria documental de 03/11](DOCUMENTATION_AUDIT_2026_11_03.md).


**Decisão do responsável — 30/10/2026:** publicação em produção autorizada sem exigir homologação em aparelhos físicos, assinatura Windows ou validações operacionais como gates. A dispensa anterior de backup externo permanece. Esses itens não são apresentados como testes concluídos. A publicação continua condicionada aos checks de código desta revisão; evidências e limites no [ciclo de experiência](RELEASE_EXPERIENCE_STABILIZATION.md). As avaliações históricas abaixo conservam seu escopo original.

O Enturma está em estabilização. A [Release Candidate](PRODUCTION_READINESS.md) registra as correções, evidências e gates ainda pendentes. **NO-GO para anunciar homologação integral ou escala comprovada.**

O [ciclo anterior de experiência](RELEASE_EXPERIENCE_STABILIZATION.md), na [PR #133](https://github.com/luizcordeiro155/Enturma/pull/133), acrescentou visitante exclusivo da Web, login/cadastro com identidade oficial, correções de áudio e digitação, escolha de qualidade de transmissão e melhorias do instalador/atualizador Windows.

O lote de **02/11/2026** acrescenta mensagens de voz, recibos de entrega/leitura, convites diretos com cards, tema Enturma, remoção de foto/banner e visitante usando as telas reais com leitura pública limitada. O código `6d9ae4b` passou na [CI 41419189860](https://github.com/luizcordeiro155/Enturma/actions/runs/41419189860): **134 testes Java, 166 Web e 46 E2E**, além dos testes Mobile/Desktop, lint, TypeScript, build Web, exports Android/iOS, empacotamento da API e teste Windows de desinstalação. O lote é publicado pela integração da [PR #133](https://github.com/luizcordeiro155/Enturma/pull/133) na `main`; a PR registra a conferência posterior dos serviços e versões distribuídas. Alterações documentais posteriores não modificam o código validado.

| Área | Estado verificado |
| --- | --- |
| Web | Next.js/React; start público e visitante com Início, Fórum/comentários, salas abertas, Caronas e Configurações reais sob restrições; ações privadas exigem login |
| Android distribuído | Shell WebView gerado por deploy/android-download/install-web-shell.cjs; pacote Expo é também insumo do builder, seu export não homologa o APK |
| Desktop | Electron, instalador e atualizador próprios; versão declarada e versão distribuída podem diferir |
| API | Java 21 / Spring Boot 3.5.16; dependências e alertas em [auditoria](DEPENDENCY_AUDIT.md) |
| PostgreSQL | V66 (recibos/idempotência de mídia) e V68 (tema), sem V67; aplicadas por Flyway no início da API. Migrações e integração passaram em banco isolado. Autorização por objeto no Java; papel efetivo de produção precisa de validação |
| Chat privado | Cifragem no cliente de texto/áudio e custódia cifrada por conta, recuperável pela API; não E2EE inacessível ao serviço. Recibos dependem de confirmação real do cliente |
| iOS | Export técnico na CI; sem homologação/publicação oficial confirmada |
| Escala e backup | Carga limitada a leituras em serviços efêmeros na CI, com relatório no ciclo atual; capacidade de produção não homologada. Backup externo inexistente e dispensado pelo responsável em 28/10/2026; recuperação real não comprovada |

Versões **declaradas:** Web 0.3.0, Expo Android 0.3.30/code 33 e Desktop 0.3.15. Versões **distribuídas:** Windows e Android 0.4.424 (02/11, logs Railway). Conferir novamente os manifests oficiais em novos releases; SHA-256 verifica integridade, **não é assinatura digital Authenticode**.

Documentos de implementação antigos são históricos. Consulte o [inventário](DOCUMENTATION_INDEX.md), [operação e rollback](OPERATIONS_READINESS.md) e o [estado anterior preservado](history/STATUS_2026_10_25.md).

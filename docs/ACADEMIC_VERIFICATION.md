# Verificação e operação

Seleção estudantil exige registro VERIFIED e toda sua ascendência verificada. Fontes e datas ficam visíveis. OUTDATED/ARCHIVED/REJECTED/PENDING_VERIFICATION não são oferecidos para nova matrícula, mas vínculos históricos são preservados.

## Verificações automatizadas

- Maven verify com PostgreSQL real: backfill V6 sobre base existente, integridade dos vínculos legados, imports oficiais sem falhas, reimportação sem duplicação, controle de acesso, elegibilidade e persistência dos jogos, além de salas/chat/caronas preexistentes.
- CatalogRulesTest: fontes seguras, robots, CSV com vírgulas, rejeição de falso PDF e respostas dos jogos.
- Vitest: simulação JavaScript, colisões, todos os mapas solucionáveis, valores binários, autenticação web/mobile.
- Playwright: registro → UNA → Aimorés → ADS presencial → Fundamental → Exploração digital + Matemática computacional → perfil → três jogos → progresso após reload → viewport móvel e movimento reduzido. Fluxo anterior de salas/chat/caronas continua na suíte.
- `npm run typecheck`, `npm run lint`, `npm run build`; testes de empacotamento SquareCloud.

Os comandos precisam de PostgreSQL local dedicado: TEST_DATABASE_URL e TEST_DATABASE_PASSWORD; E2E usa banco cujo nome contém `e2e`. Nunca executar testes de escrita contra produção. Matrizes verificadas são dados reais; usuários sintéticos só existem nos bancos de teste.

Execução local em 29/09/2026: 34 testes Java, 13 web, 4 mobile, 2 de empacotamento e os 2 testes Playwright passaram. Lint, TypeScript, build Next e exportações Expo Android/iOS também passaram. Imagens de conferência estão em `docs/design/una-onboarding.png`, `learning-desktop.png` e `learning-mobile.png`. O ZIP privado foi testado com perfil SquareCloud e banco isolado, sem aplicar migrations no Railway de produção.

## Implantação

1. Criar backup/snapshot do PostgreSQL.
2. Substituir `app.jar` no pacote privado SquareCloud; preservar `.env` e certificados do usuário. O ZIP público de CI contém apenas exemplo de configuração.
3. Iniciar backend. Flyway aplica V6/V7; bootstrap cria jobs dos snapshots. Conferir `/actuator/health` e `/admin/catalog/imports` até concluírem, inclusive falhas por item.
4. Publicar frontend Vercel com API_URL e segredo BFF já configurados. Novo frontend requer backend desta atualização para APIs `/catalog` e `/learning`.
5. Validar cadastro e matrícula UNA, jogos, perfil antigo e salas. Jobs, fontes e auditoria permitem inspecionar o resultado.

Durante a implantação separada, onboarding tenta V2 e usa a leitura legada se a API antiga ainda não tiver a rota (404/500). Falhas de autorização não acionam esse fallback. Novos jogos e painel exigem o JAR atualizado; a Vercel não publica o backend da SquareCloud.

Catálogo não equivale a confirmação de matrícula institucional. Não armazenar screenshots privados ou credenciais nos snapshots. Não renomear captura pública como grade de ingresso 2026 sem documento que comprove essa vigência.

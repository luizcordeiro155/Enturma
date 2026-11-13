# Enturma Social 3.0 — retomada operacional

Atualizado em 13/11/2026. Leia primeiro `docs/SOCIAL_3_CONTINUATION.md` e confira o Git. Não reinicie o projeto.

## Tarefa imediata

Concluir a prova visual/responsiva do incremento de rolagem do Feed na branch `codex/social-instagram-parity` (base `e1c2d39`). A suíte social já passou sete cenários após corrigir seu scroll target. Não repetir o erro de testar scroll em `.social-stream`: o proprietário é `.social-feed-scroll[data-social-scroller]`.

## Arquivos a abrir

1. `apps/web/AGENTS.md` e documentação instalada Next pertinente.
2. `apps/web/e2e/enturma-social.spec.ts`, `student-fixture.ts` e configuração Playwright.
3. `apps/web/src/components/social/social.tsx`, `social-stream.tsx`, `social-stream.test.tsx`, `social-3.css`.
4. `docs/social-instagram-reference.md`, `social-instagram-parity.md`, `social-instagram-roadmap.md`.
5. Scripts dos package.json antes de executar verificações.

## Comportamento a comprovar

- Feed preserva scroll real não zero e DOM ao alternar Clips/Feed; cada aba tem posição independente.
- Observer pagina em relação ao contêiner efetivamente rolável; não dispara carregamentos duplicados indevidos.
- Pull-to-refresh só inicia no topo com um toque; cancelamento limpa estado.
- Nenhum overflow, corte, controles ocultos ou contraste insuficiente nos temas Claro, Escuro, Enturma e Sistema.
- Validar 320, 360, 390, 430, 768, 1024, 1280, 1440 e 1920 px, com screenshots e erros de console. Usar contas/mídias sintéticas locais; não capturar dados reais para repositório.

## Serviços e testes

Confirmar Web localhost:3000, API localhost:8080, PostgreSQL 127.0.0.1:55432 com banco `enturma_social3_e2e`, SMTP1025. O usuário iniciou o Web manualmente após bloqueio da revisão automática; não contornar o bloqueio nem assumir que o servidor recarrega código (pode servir build de produção).

Executar testes focados stream/pager, TypeScript, lint e build apropriados ao diff; então suíte social Playwright `npm run test:e2e --workspace=@enturma/web -- --project=chromium-social enturma-social.spec.ts` com `E2E_DATABASE_URL` local. Configurar credenciais somente no ambiente, sem imprimi-las. Os resultados anteriores estão na seção 8 do checkpoint. Build/unitários completos anteriores não cobrem necessariamente a última edição.

Se alterar API, rodar Maven/Java21 e integração com `enturma_social3_test` isolado. FFmpeg/ffprobe locais em `C:\ffmpeg\bin`. No Windows pode ser necessário `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\Temp\enturma-java`.

## Após a validação atual

1. Corrigir falhas reais no responsável pelo comportamento, sem duplicar mecanismos de scroll/cache.
2. Atualizar matriz e checkpoints com resultados e limitações; revisar `premium-audit.json` antes de incluí-lo.
3. `git diff --check`, revisar diff e criar commit organizado somente do incremento completo; manter alterações incompletas documentadas.
4. Consultar PRs/CI e configuração real dos serviços. Produção autorizada apenas para mudanças seguras não destrutivas que passem gates. Confirmar rollback/recuperação e commit servido; não publicar recursos dependentes de mídia/live sem infraestrutura pronta.
5. Continuar faltantes de Social por módulos completos, priorizando gaps comprovados. Lives, coleções nomeadas, mensagens em grupo e recursos complementares não têm conclusão comprovada neste checkpoint.

## Dependências e permissões

Nenhuma nova credencial deve ser solicitada sem verificar configuração existente de modo sigiloso. Configuração R2/FFmpeg/LiveKit/flags em produção ainda precisa de confirmação. Não ativar cobrança nova, trocar credenciais nem executar migração destrutiva. Não usar REA. Não afirmar que Android/Windows foram instalados/testados fisicamente com base somente em export/build.

Antes de encerrar ou transferir contexto, atualizar estes documentos com próximo comando exato, Git, testes, bloqueios e estado real da publicação.

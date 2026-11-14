# Enturma Social 3.0 — retomada operacional

## Release atual — 13/11/2026 (prevalece sobre o histórico)

PRs #150/#151 integradas na main `30a434b299645b38ed96ce78b56aa79b3c5a7036`. CIs finais da PR `43535098339`/`43535103011` aprovadas: 76 E2E, 309 Web e 191 Java (um ignorado). Web publicada no deployment production `dpl_7XJmiMENyhdpSAtpn7Qq1Cydd2iq`; domínio oficial confirmado no SHA integrado. API atualizou automaticamente; V72/V73 e probe ready=true verificados. AutoAssignCustomDomains restaurado. Windows 0.4.519 publicado; ZIP/EXE baixados e hashes conferidos. Android build `2003de78-64c1-4dc2-812f-c576e7da8b60` ainda em acompanhamento. Não afirmar instalação física ou smoke autenticado de produção.

Próximo comando exato: consultar o deployment Android acima e, após SUCCESS, executar `node .local/social3-verify-native.cjs 30a434b299645b38ed96ce78b56aa79b3c5a7036 android`; confirmar também CI da main `43540279660`. Atualizar o resultado no documento `SOCIAL_3_RELEASE_READINESS.md`, que contém URLs, evidências, rollback e limitações. Nenhum dado de teste foi gravado em produção; premium-audit.json preservado.

## Próximo passo atual — 13/11/2026

Prevalece sobre o histórico: HEAD `ab5ce73`, PR #151 aberta/pronta, #150 já incorporada. Acompanhar CI `43504798163` (PR) e `43504791475` (push). Última falha real era gutter externo de 15px; corrigida apenas no Social, com prova Chromium de preservação das outras telas. Testes anteriores 74/75 E2E; não declarar a nova suíte aprovada antes do término.

Após aprovação: inspecionar artefatos visuais finais; merge com expected head; aguardar API `/api/v1/public/social-release` HTTP200/ready (V72/V73); promover deployment production Vercel do SHA integrado; restaurar autoAssignCustomDomains; builds Railway oficiais main para Android/Windows e verificar artefatos com `.local/social3-verify-native.cjs <SHA_MAIN>`. Produção anterior preservada até o gate. Não usar preview como produção nem afirmar homologação física.


## Checkpoint — ajuste de Feed e entrada em Clips, 13/11/2026

Continuação da PR #151 a partir de `5d5b1d9`. Corrigidos o limite de largura do scroll owner (barra na borda da janela), enquadramento completo dos vídeos com altura limitada no Feed, rodapé lateral e entrada pelo vídeo selecionado. O link canônico `/social?post=ID` revalida a publicação antes de abrir Clips; o item entra primeiro, sem duplicação, mantendo o cursor e o retorno ao mesmo Feed. O player de Clips mantém o enquadramento `contain` existente.

Teste de regressão do link falhou antes da correção e passou depois. Suíte Web anterior deste incremento: 305 testes aprovados; três testes adicionais de entrada, acesso negado e retorno também passaram. TypeScript/lint/build executados; repetir o typecheck após adicionar o teste de entrada. E2E ampliado para 390/1366/1920px, altura do vídeo, barra na borda, seleção fora da primeira posição do ranking e Voltar. Corrigidas expectativas antigas da CI: Mensagens migrou para o dock, rail desktop é compacto, avatar desktop é 140px e apenas a grade visível deve ser medida.

Validação visual local bloqueada: Browser sem contexto conectado; navegador remoto não alcança localhost; Chromium local falha em socket e a política rejeita permissões elevadas. Usar a CI e seus screenshots, sem declarar inspeção visual local. Vercel ainda não conectada nesta sessão; integração sugerida. Não integrar/promover até CI final e controle do gate API V72/V73. Nenhum deploy novo confirmado.

Próxima ação: enviar o incremento na branch existente, acompanhar a CI do novo SHA, inspecionar screenshots, corrigir eventuais falhas; então executar API → Web → distribuidores conforme `SOCIAL_3_RELEASE_READINESS.md`.

## Checkpoint vigente — histórico de painéis, 13/11/2026

CI `43369840229` do SHA `416fbcd`: Java, auditoria, lint, TypeScript, unitários, builds, Android e Windows aprovados; 73/74 E2E aprovados. As 160 capturas da matriz concluíram, inclusive largura desktop >1100px. A falha remanescente revelou bug real no histórico compartilhado: substituir Opções por Coleções fechava também Explorar/visualizador. Corrigido em `useOverlayHistory`: somente o painel superior atende Voltar; travessia causada por fechamento não fecha ancestrais. Três testes reproduziram a falha antes e passaram depois; 12 testes focados de histórico/chat aprovados, TypeScript e lint aprovados. Nenhum teste removido ou limite de API relaxado.

Próximo passo: acompanhar CI do próximo commit, concluir E2E de criação/renomeação/exclusão de coleção, inspecionar capturas, integrar #151 preservando #150 e publicar. Produção ainda permanece na base anterior; V72/V73 não aplicadas. `premium-audit.json` permanece intocado.

## Próxima ação exata (substitui histórico abaixo)

Enviar correções de CI, exportação e RLS após `8af2e3c`; acompanhar checks do novo SHA na PR #151. A CI antiga `43366672237` teve 72/74 E2E aprovados; causas comprovadas: HTTP429 na matriz e captura durante animação no teste de Clips. Inspecionar capturas finais, validar coleções pela UI, revisar PRs/gates, merge e publicação oficial. SquareCloud acompanha main (confirmado pelo usuário); verificar migrações V72/V73, commit Web e versões nativas. Não declarar produção antes dos smokes.

## Próxima tarefa vigente — 13/11/2026

PR #150 já incorporada à branch `codex/social-instagram-parity`, PR #151 aberta. Consultar a CI `43366672237` (`ecb2215`), baixar screenshots e diagnósticos, corrigir E2E. Coleções privadas V72 estão no working tree: 14 testes Java aprovados, E2E novo ainda não executado. Finalizar testes, commit/push, checks do SHA final, revisar/integrar e publicar API → Web → distribuição nativa conforme pipelines, verificando versão/health/downloads. Não encerrar após código. Os detalhes históricos seguintes não substituem os documentos atuais `SOCIAL_3_IMPLEMENTATION_PROGRESS.md`, `SOCIAL_3_TEST_RESULTS.md`, `SOCIAL_3_RELEASE_READINESS.md`.

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

## Checkpoint prioritário — retomada e correção de altura, 13/11/2026

CI 43373088044 (c25c2a2) aprovada. Recuperados por fast-forward todos os commits posteriores até 9c81906, preservando premium-audit.json. PR #150 segue incorporada na #151; nenhum merge em main nesta etapa. CI 43472337435 de 9c81906: 73/75 E2E aprovados, duas falhas de altura de vídeo. Reproduzida localmente em Chromium isolado: frame de 565px e vídeo de 888,875px. Causa: min-height:auto intrínseco do vídeo como item de grid. Corrigido no responsável com min-height:0; E2E existente de CSS real passou nas oito resoluções/zoom, sem relaxar asserções. Chromium isolado funciona nesta sessão; não houve Computer Use nem reinicialização da API bloqueada.

Próxima tarefa: acompanhar CI do commit desta correção, inspecionar evidências visuais, integrar apenas após checks finais; aguardar probe público API/V72/V73 antes de promover Web e atualizar distribuidores oficiais. Produção ainda não atualizada nesta retomada.


### Correção da medição de retorno — 13/11/2026

CI ab5ce73: 75/76 E2E aprovados; geometria e matriz visual passaram. Única falha: teste registrava 180px antes de click(), que rolava automaticamente o link parcialmente visível para 387px. Trace comprova 387px antes da navegação e os mesmos 387px após Voltar. Portanto, o produto preservou a posição. Teste agora chama scrollIntoViewIfNeeded antes de guardar a posição e mantém igualdade exata e posição maior que zero. Prova Chromium isolada reproduziu a discrepância antes e igualdade depois; TypeScript aprovado. Próxima ação: acompanhar a CI do novo commit antes de integrar. Produção ainda preservada.

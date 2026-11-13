# Enturma Social 3.0 — checkpoint de continuidade

## Checkpoint vigente — correções da CI em 13/11/2026

Branch `codex/social-instagram-parity`; coleções privadas commitadas em `8af2e3c`. PRs #150/#151 confirmadas abertas Draft, sem merge; #150 preservada no histórico da #151. CI `43366672237` terminou com 72 E2E aprovados e 2 falhas: matriz atingiu HTTP 429 após reabrir telas por tema; teste de Clips capturou posição durante a transição de breakpoint. Correções: capturar quatro temas por montagem, aguardar animação antes da medida. Capturas também revelaram max-width herdado de 600px em Explorar/Perfil; corrigido e coberto por asserção desktop >1100px.

Exportação agora consulta catálogo de seções da API (fallback 404 para API anterior). V73 aplica RLS default-deny às tabelas novas conforme padrão V62/V69. Integração Java: 17 aprovados; prova RLS reforçada com registro existente na mesma transação passou isoladamente. TypeScript e lint focado passaram. Próximo passo: enviar incremento, aguardar CI do SHA final, inspecionar 160 capturas e fluxo de coleções, revisar gates e integrar. API SquareCloud atualiza automaticamente pela main, confirmado pelo usuário. Nenhuma publicação nova comprovada. Não descartar `premium-audit.json`.

## Atualização prioritária — 13/11/2026, execução em andamento

O registro abaixo desta atualização é histórico. Estado atual: branch `codex/social-instagram-parity`, PR consolidada #151; último push `ecb2215`, com PR #150 incorporada no merge `1bb0ff0` e alterações anteriores preservadas em `4f096e5`. Coleções privadas V72 estão implementadas no working tree e passaram 14 testes Java de integração; ainda precisam do E2E/commit. Não descartar `premium-audit.json`, arquivo preexistente não rastreado.

Leia `SOCIAL_3_IMPLEMENTATION_PROGRESS.md`, `SOCIAL_3_TEST_RESULTS.md` e `SOCIAL_3_RELEASE_READINESS.md` para o estado vigente. CI `43366672237` executa E2E de `ecb2215`; baixar e inspecionar evidências antes de declarar fidelidade. A matriz agora inclui 1366×768. O startup local da API/SMTP foi rejeitado por revisão automática; não contornar. Integração PostgreSQL isolada funciona. Nenhum deploy desta execução foi confirmado ainda.

Próxima ação exata: consultar jobs da CI acima, corrigir falhas, inspecionar screenshots, validar e enviar coleções, aguardar todos os checks do novo SHA; somente então integrar e publicar pela infraestrutura existente. O objetivo continua produção verificada, não apenas código.

Atualizado em 13/11/2026. Este registro distingue evidência local de publicação. Não contém credenciais. Caminhos abaixo são relativos à raiz do repositório Enturma.

## 1. Objetivo principal

Finalizar o Enturma Social como rede universitária persistente, segura e responsiva, inspirada na organização e nos comportamentos demonstrados nas capturas do Instagram, preservando marca, tokens e ativos Enturma. Implementar e validar Feed, publicações, Stories, Clips de até 90 segundos, editor de mídia, Explorar, busca, perfis, seguidores, curtidas, comentários, compartilhamentos, mensagens, notificações, lives, recomendações, privacidade e moderação. Refinar responsividade, animações, performance e segurança e publicar somente incrementos comprovadamente seguros.

Preservar Fórum independente, salas, autenticação, perfis, caronas, IA, portfólio, gamificação e chat. Não alterar as animações prontas de abertura do Enturma e de Caronas. Não usar REA: a instrução posterior do usuário removeu essa dependência.

## 2. Estado atual do projeto

Branch de trabalho: `codex/social-instagram-parity`; HEAD observado: `e1c2d39`. Há implementação social extensa e trabalho local ainda não commitado. Não anunciar paridade integral nem Social 3.0 integralmente concluído.

O incremento atual corrige a propriedade da rolagem do Feed, restauração por aba, paginação por interseção e atualização por gesto. A suíte E2E social passou com sete cenários; a revisão visual sistemática nas nove larguras ainda precisa ser concluída. Nenhum deploy deste incremento foi confirmado.

## 3. Arquitetura e contratos importantes

- Web compartilhada Next.js/React/TypeScript em `apps/web`; API Java/Spring Boot/PostgreSQL/Flyway em `services/api`.
- Tokens de tema em `apps/web/src/app/globals.css`; conferir localização pelo Git se houver mudança. Reutilizar cores, tipografia, componentes e autenticação existentes.
- Componentes atuais: `apps/web/src/components/social/social.tsx`, `social-stream.tsx`, `social-3.css`, `social-clips.tsx`, `social-test-kit.tsx` e seus testes.
- Scroll efetivo do Feed: `.social-feed-scroll[data-social-scroller]`. Cada aba preserva sua posição; o observer e o gesto de atualização devem usar esse mesmo elemento.
- Backend permanece fonte da verdade para autorização por objeto, bloqueios, contas privadas, expiração de Stories em 24 horas e duração final dos Clips (máximo 90 segundos).
- Armazenamento privado R2 e pipeline FFmpeg existentes devem ser reutilizados; não publicar mídia privada nem credenciais. Confirmar configuração e capacidade reais antes de habilitar recursos.
- Reutilizar chat e notificações. Recuperação de chaves de chat pela conta não deve ser descrita como criptografia inacessível ao servidor se houver custódia recuperável.
- Android possui shell/WebView e workspace Expo; export Expo não comprova instalação APK. Electron compartilha a Web, com adaptações de plataforma.

## 4. Decisões tomadas

- Usar capturas fornecidas como referência de composição, não copiar código ou ativos Instagram. Capturas demonstram Feed central, Stories horizontais, sugestões laterais, Clips verticais, criação com mídia/controles, grade de perfil e painéis móveis de comentários/compartilhamento. Elas não comprovam comportamento interno do Instagram.
- Manter Claro, Escuro, Enturma e Sistema; acessibilidade e redução de movimento. Validar larguras 320, 360, 390, 430, 768, 1024, 1280, 1440 e 1920 px.
- Navegação social própria com saída para início; navegação principal mobile solicitada: Início, Salas, Social Entu, Comunidade, Amigos e acesso a Mais. Cadernos fica em Mais abaixo de Programação; elegibilidade de Programação deve ser igual no mobile/desktop.
- A autorização mais recente permite commits, PR, integração e produção de mudanças não destrutivas que passem nas verificações. Não autoriza apagar dados reais, trocar credenciais, contratar serviços, elevar custos ou desativar proteções.
- Não depender de REA. Não pedir novamente permissões já concedidas. Se ferramenta bloquear uma ação, registrar motivo e usar alternativa permitida sem contornar o bloqueio.

## 5. Implementações concluídas

Commits locais anteriores comprovados pelo log (publicação não inferida):

- `9138415`: pager por gesto entre Clips, Feed e Criar.
- `98776bb`: navegação responsiva em três faixas de largura.
- `3247445`: card de Feed centrado na mídia, carrossel e duplo toque para curtir.
- `6601410`: Clips em tela cheia com ações laterais e abas.
- `e1c2d39`: retorno de Criar para Feed por gesto e faixas de abas roláveis.

O E2E local valida publicação/comentário/seguir, privacidade/bloqueios, importação e edição de vídeo, câmera, reprodução de Clips e exclusão de Story. Isso não significa que todos os módulos solicitados estejam completos ou publicados.

## 6. Trabalho parcialmente concluído

Alterações locais no checkpoint inicial:

| Arquivo | Estado e finalidade |
|---|---|
| `apps/web/src/components/social/social.tsx` | Contêiner de rolagem real e restauração por aba com `useLayoutEffect`; revisão visual pendente. |
| `apps/web/src/components/social/social-stream.tsx` | Observer encontra o ancestral rolável; pull-to-refresh somente no topo e com um toque; limpa gesto no cancelamento. |
| `apps/web/src/components/social/social-3.css` | Dimensões/rolagem do Feed, espaçamento mobile e transparência das ações/legendas; validar todos os temas e larguras. |
| `apps/web/src/components/social/social-test-kit.tsx` | Mock de IntersectionObserver expõe root para verificar o contrato. |
| `apps/web/src/components/social/social-stream.test.tsx` | Novo teste de scroll owner, fallback, gesto e limpeza. |
| `apps/web/e2e/enturma-social.spec.ts` | Teste usa `.social-feed-scroll:visible`, exige rolagem não zero e preservação do mesmo DOM ao alternar abas. |
| `apps/web/e2e/student-fixture.ts` | Permite somente bancos E2E locais nomeados; inclui `enturma_social3_e2e`, sem acesso a produção. |
| `docs/social-instagram-reference.md` | Inventário local não commitado; conferir evidências antes de versionar. |
| `docs/social-instagram-parity.md` | Matriz local não commitada; atualizar com resultados recentes. |
| `docs/social-instagram-roadmap.md` | Roadmap local não commitado. |
| `premium-audit.json` | Não rastreado; inspecionar antes de decidir se deve entrar em commit. |

Não há nova migração ou alteração Java neste incremento registrado.

## 7. Problemas e bloqueios

- Teste de preservação de leitura falhava porque usava `.social-stream`, que não era o scroll owner. Corrigido para o contêiner real e passou.
- Inicialização automática do Web foi bloqueada pela revisão automática. O usuário iniciou manualmente e confirmou “Pronto ativo”. Não contornar esse bloqueio. Verificar disponibilidade e se o processo serve o build atual antes de novos testes visuais.
- Node/Java locais exigem atenção: usar Java 21; Java padrão antigo não serve. No Windows, testes de sockets Java usam `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\Temp\enturma-java`.
- Configuração atual de produção, backup/rollback, flags, R2, FFmpeg e LiveKit ainda não foi revalidada neste incremento. Não declarar disponibilidade presumida.
- Lives completas, coleções nomeadas, grupos de mensagens e outros recursos avançados precisam de inventário/validação; não marcar completos apenas por UI.

## 8. Testes executados e resultados

Evidência da sessão anterior, logs locais não destinados ao Git:

| Verificação | Resultado registrado | Evidência |
|---|---|---|
| E2E Social Chromium | 7 passaram, 45,7 s | `.local/social3-e2e.log` |
| Java verify | 170 testes, zero falhas/erros, um ignorado | `.local/social3-java-tests.log` |
| SocialTranscoder | 5 passaram | `.local/social3-transcoder.log` |
| Web unitários | 59 arquivos, 232 testes passaram | `.local/social-web-tests.log` |
| TypeScript | exit 0 | Resultado anterior da sessão |
| Lint | zero erros, 35 avisos existentes | `.local/social-lint.log` |
| Build Web | passou | `.local/social-build.log` |
| Stream/pager focados | 10 testes em dois arquivos passaram | Resultado anterior da sessão |

Os testes completos Web/build precedem a última edição de layout effect; não tratá-los como prova do estado final sem reexecutar a validação apropriada. `git diff --check` havia passado antes da última alteração da fixture; repetir antes do commit. Nenhum teste físico Android/Windows ou smoke de produção foi comprovado neste incremento.

## 9. Pendências por prioridade

1. Salvar estes checkpoints e retomar validação responsiva/visual do Feed e Clips, com screenshots e console.
2. Confirmar que localhost serve o código atual, corrigir overflow/contraste/rolagem encontrados, executar provas unitárias/TS/lint/build afetadas.
3. Atualizar matriz de paridade, revisar diff e arquivos não rastreados; commitar apenas incremento verificado sem arquivos sensíveis.
4. Inspecionar pipelines, PRs, commit publicado, flags e infraestrutura; preparar release compatível e recuperação antes de publicar.
5. Continuar módulos faltantes por incrementos completos: criação/perfis, Stories/Clips/editor, Explorar/recomendações, mensagens/notificações, lives/privacidade/moderação. Usar flags para impedir exposição de partes não prontas.

## 10. Próxima tarefa exata

Ler `docs/SOCIAL_3_NEXT_STEPS.md`, confirmar saúde de localhost:3000 e localhost:8080 e inspecionar a cobertura existente em `apps/web/e2e/enturma-social.spec.ts`. Executar revisão visual nas nove larguras e quatro temas reutilizando fixture local. Verificar que Feed mantém posição ao alternar aba/Clips, pagina no contêiner correto, atualiza por gesto somente no topo e não apresenta overflow horizontal. Não refazer módulos já comprovados.

## 11. Comandos de desenvolvimento e teste

Executar a partir da raiz; ler `package.json` e `apps/web/package.json` antes de escolher scripts. Não imprimir arquivos de ambiente.

```powershell
git status --short
git branch --show-current
git log -5 --oneline
git diff --stat
git diff --check
npm run test:e2e --workspace=@enturma/web -- --project=chromium-social enturma-social.spec.ts
```

O E2E precisa de `E2E_DATABASE_URL` para o PostgreSQL **local** em 127.0.0.1:55432, banco `enturma_social3_e2e`. Obter segredo da configuração local sem imprimi-lo; nunca usar banco de produção. A fixture também aceita `enturma_e2e`. Não usar scripts antigos que renomeiam bancos.

Ferramentas locais disponíveis na sessão: `.tools/apache-maven-3.9.11/bin/mvn.cmd`, `.tools/jdk-21.0.12.1+1`, `.tools/postgres-cli-18.6/psql.exe`, `C:\ffmpeg\bin`. API empacotada: `services/api/target/enturma-api-0.1.0.jar`. Mail de teste: `node apps/web/e2e/mail-server.cjs`.

## 12. Estado do Git

Inspecionado em 13/11/2026: branch `codex/social-instagram-parity`, HEAD `e1c2d39`; seis arquivos rastreados modificados, cinco arquivos não rastreados listados na seção 6. Diff rastreado: 105 inserções e 18 remoções. Estes dois checkpoints são arquivos novos adicionais. Nenhuma alteração anterior foi descartada ou revertida. Não houve commit novo nesta retomada até este registro.

## 13. Estado dos ambientes e da produção

- Web local: localhost:3000, iniciado pelo usuário; anteriormente `/login` respondeu 200.
- API local: localhost:8080, banco isolado `enturma_social3_e2e`; revalidar processo.
- PostgreSQL local: porta 55432. Java integration usa `enturma_social3_test`.
- SMTP local: 1025; serviço `apps/web/e2e/mail-server.cjs`.
- Serviços identificados no histórico: Vercel Web, SquareCloud API sincronizada com GitHub segundo o usuário, Railway distribuição Android/Windows, Cloudflare R2 mídia e LiveKit tempo real. Confirmar configurações/pipelines atuais antes de mutações.
- Não há commit em produção, APK/Windows publicado ou migração de produção verificados neste incremento. Não inferir deploy a partir de commit local, build ou documentação antiga.

## 14. Instruções para o próximo agente

Ler este arquivo, próximos passos, Git e contratos `README.md`, `DESIGN.md`, `UX-CONTRACT.md`, `docs/SOCIAL_2_IMPLEMENTATION.md`, `docs/STATUS.md` e AGENTS aplicáveis. `docs/SOCIAL_STUDIO_RELEASE.md` não foi encontrado anteriormente; verificar sem inventar seu conteúdo. `apps/web/AGENTS.md` exige consultar documentação instalada do Next antes de alterações pertinentes.

Preservar todas as alterações existentes. Não usar reset hard/clean. Não inserir segredos, conteúdo privado, logs sensíveis ou imagens de terceiros em commits. Diferenciar implementado, testado, habilitado, publicado e testado fisicamente. Atualizar estes dois documentos após correções, testes, commits, bloqueios e release e antes de encerrar. Continuar desenvolvimento após checkpoint; não substituir implementação por relatório.

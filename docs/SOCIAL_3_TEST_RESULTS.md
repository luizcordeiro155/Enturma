# Social 3 — resultados de testes

## Checkpoint vigente — histórico de painéis, 13/11/2026

CI `43369840229` do SHA `416fbcd`: Java, auditoria, lint, TypeScript, unitários, builds, Android e Windows aprovados; 73/74 E2E aprovados. As 160 capturas da matriz concluíram, inclusive largura desktop >1100px. A inspeção visual posterior encontrou algumas capturas light ainda escuras: a mutação direta do DOM disputava com ThemeSync. Matriz corrigida para atualizar preferências pela sincronização existente e afirmar tema/paleta antes de capturar; evidência de quatro temas deve ser regenerada. A falha remanescente revelou bug real no histórico compartilhado: substituir Opções por Coleções fechava também Explorar/visualizador. Corrigido em `useOverlayHistory`: somente o painel superior atende Voltar; travessia causada por fechamento não fecha ancestrais. Três testes reproduziram a falha antes e passaram depois; 12 testes focados de histórico/chat aprovados, TypeScript e lint aprovados. Nenhum teste removido ou limite de API relaxado.

Próximo passo: acompanhar CI do próximo commit, concluir E2E de criação/renomeação/exclusão de coleção, inspecionar capturas, integrar #151 preservando #150 e publicar. Produção ainda permanece na base anterior; V72/V73 não aplicadas. `premium-audit.json` permanece intocado.

## Incremento após `8af2e3c`

- CI `43366672237`: 72/74 E2E aprovados; matriz HTTP429 e medida de Clips durante transição. Java, lint, TypeScript, unitários, build, export Expo, compilação Android e segurança do instalador Windows passaram nessa CI. Correções aguardam nova CI.
- Integração Java de coleções/exportação/RLS: 17 testes passaram (`.local/social3-collections-java.log`); RLS reforçada, registro visível ao dono na mesma transação, passou isoladamente (`.local/social3-collection-rls.log`).
- TypeScript e lint focado das correções passaram. Matriz reorganizada mantém 160 capturas (10 larguras × 4 temas × 4 telas), sem alterar rate limits nem simular respostas da API de autorização/dados.
- Capturas reais inspecionadas: Feed mobile 390 e Explorar desktop 1280 escuros. Explorar limitado a 600px; max-width corrigido e asserção adicionada. Validação final pendente.

13/11/2026. Resultados históricos não substituem o check do commit final.

| Prova | Resultado observado |
|---|---|
| Web unitária após recuperar PR #150 | 77 arquivos, 298 testes aprovados; Node 26 local com `NODE_OPTIONS=--no-experimental-webstorage`, dois workers |
| Scroll e navegação após Explorar | 12 testes aprovados |
| TypeScript e lint focado de coleções | Aprovados |
| `SocialIntegrationTest` com V72 e PostgreSQL isolado | 15 testes, zero falhas/erros, Java 21; inclui quota e repetição de criação/renomeação |
| CI `43366672237`, commit `ecb2215` | Java, restore sintético, OSV, lint, tipos, unitários, build e exports Android/iOS aprovados; E2E em execução no registro |
| Android shell e segurança desinstalador Windows na mesma CI | Aprovados |
| Matriz visual e E2E de coleções novos | Aguardam execução e inspeção das capturas |

O startup local da API/SMTP foi rejeitado pela revisão automática com `blocked by policy`; não foi contornado. PostgreSQL isolado permitiu integração JUnit; o pipeline oficial inicia a infraestrutura isolada para E2E. Web local 3000 estava ativa com build anterior, sem API8080. Não considerar esse Web prova das últimas alterações.

Configuração JUnit local confirmada: usuário `enturma`, senha do arquivo local protegido, `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\Temp\enturma-java`. Uma repetição usou usuário incorreto e outra omitiu a opção Windows, falhando no startup; ambas foram corrigidas sem alteração de credenciais. A execução final passou às 01:50 de 13/11.

Próxima prova: concluir o E2E da CI, baixar `interface-evidence`/diagnósticos, inspecionar as capturas e corrigir falhas; enviar coleções e executar todos os checks no novo SHA.

## Checkpoint prioritário — retomada e correção de altura, 13/11/2026

CI 43373088044 (c25c2a2) aprovada. Recuperados por fast-forward todos os commits posteriores até 9c81906, preservando premium-audit.json. PR #150 segue incorporada na #151; nenhum merge em main nesta etapa. CI 43472337435 de 9c81906: 73/75 E2E aprovados, duas falhas de altura de vídeo. Reproduzida localmente em Chromium isolado: frame de 565px e vídeo de 888,875px. Causa: min-height:auto intrínseco do vídeo como item de grid. Corrigido no responsável com min-height:0; E2E existente de CSS real passou nas oito resoluções/zoom, sem relaxar asserções. Chromium isolado funciona nesta sessão; não houve Computer Use nem reinicialização da API bloqueada.

Próxima tarefa: acompanhar CI do commit desta correção, inspecionar evidências visuais, integrar apenas após checks finais; aguardar probe público API/V72/V73 antes de promover Web e atualizar distribuidores oficiais. Produção ainda não atualizada nesta retomada.


# Social 3 — resultados de testes

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

# Dependências — revisão de 02/11/2026

Na [execução 41413561941 da CI](https://github.com/luizcordeiro155/Enturma/actions/runs/41413561941), commit `21ac899` da PR #133, `npm audit --json` registrou **45 entradas: 6 altas, 38 moderadas, 1 baixa e nenhuma crítica**. São seis advisories em cinco pacotes de origem; a contagem inclui dependentes afetados transitivamente, não 45 vulnerabilidades independentes. O inventário contém 1.249 dependências. O relatório é `dist/security/npm-audit.json`, no artefato `interface-evidence`.

Esta auditoria não está limpa. A triagem abaixo não remove alertas nem prova ausência de exploração em produção. Nenhuma dependência foi alterada nesta revisão: as correções publicadas exigem versões fora das faixas usadas pelos respectivos consumidores, e `deepmerge` ainda não possui versão corrigida identificada pelo advisory. Não foi usado `npm audit fix --force`.

Inventário resolvido, não somente versões declaradas. Comandos: `npm audit --json` e `node scripts/audit-java-dependencies.mjs`. A CI guarda os relatórios em `interface-evidence`. Falha de consulta não equivale a ausência de alertas. Os alertas são triados abaixo; o job de inventário não é um gate automático de ausência de vulnerabilidades.

## Java

Base f3f19a0: 162 dependências runtime. Após os ajustes: 155 dependências; dois pares pacote/advisory no OSV. Atualizações compatíveis no POM:

| Componente | Versão corrigida |
| --- | --- |
| HttpClient / HttpCore | 5.6.3 / 5.4.3 |
| Jackson BOM | 2.21.7 |
| Tomcat | 10.1.59 |
| Netty | 4.1.137.Final |
| Log4j API | 2.25.5 |
| PostgreSQL JDBC | 42.7.12 |
| Commons Lang | 3.18.0 |

Excluído `async-http-client` transitivo de web-push. `WebPushNotificationService` usa `PushService.preparePost` com Apache HttpAsyncClient, redirecionamentos desativados e timeout; não usa `PushAsyncService`. A exclusão evita manter uma segunda implementação vulnerável e não utilizada. A entrega real de push ainda exige teste com assinatura autorizada.

### Alertas residuais Spring MVC 6.2.19

- GHSA-pc63-qcmh-9cmg / [CVE-2026-47884](https://spring.io/security/cve-2026-47884/): requer XsltView com resolução implícita de views. Não encontrado nas rotas REST examinadas.
- GHSA-j9f9-w8pj-32f8 / [CVE-2026-47890](https://spring.io/security/cve-2026-47890/): requer fragments de view enviados por SSE. O realtime examinado usa WebSocket/JSON; não foi encontrado esse fluxo.

Conclusão limitada: condições de exploração não encontradas no código atual; a dependência continua listada como afetada. O fornecedor classifica os casos como médio/baixo, diferente do rótulo crítico no agregado. A correção 6.2.20 é de suporte comercial; a linha OSS corrigida é 7.0.9+. Não substituir Spring 6 por 7 por override isolado: exige migração coordenada do Boot, serialização, segurança e integração. Responsável: manutenção do backend. Reavaliar antes de introduzir views/SSE e no próximo ciclo de atualização de plataforma; não há compra de suporte autorizada nesta entrega.

## JavaScript

### Triagem do inventário de 02/11

As versões e cadeias abaixo foram conferidas no `package-lock.json`; as versões corrigidas foram conferidas nos advisories oficiais em 02/11/2026.

| Pacote e versão instalada | Origem e condição de exploração | Correção publicada e encaminhamento |
| --- | --- | --- |
| `decode-uri-component` 0.2.2 — alta/moderada | `expo-router` 55.0.18 → `query-string` 7.1.3. Entradas percent-encoded malformadas podem consumir CPU durante a decodificação. É a cadeia que merece prioridade ao revisar links externos e roteamento Expo. | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) foi corrigido em 0.5.0, mas [GHSA-qr28-fpjm-wq7f](https://github.com/advisories/GHSA-qr28-fpjm-wq7f) exige **0.5.1**. Essa versão usa ESM e está fora de `query-string` → `^0.2.2`; um override isolado não preserva o contrato CommonJS. Atualizar o router e validar deep links, exports e builds em conjunto. |
| `zod` 3.25.76, aninhado em `@expo/cli` — alta | `expo` 55.0.31 → `@expo/cli` 55.0.36 → `zod` `^3.25.76`. O advisory trata de consumo de memória ao validar coleções grandes. A cópia raiz **4.6.7** já está acima da versão corrigida; atualizar somente a raiz não corrige a cópia da CLI. | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): corrigido em **4.6.6**. A CLI usa a API da major 3; atualizar pela versão compatível do conjunto Expo, sem forçar Zod 4 sobre esse consumidor. |
| `minimatch` 3.1.5 e 10.2.6 — moderada | Cadeias ESLint/TypeScript ESLint, `glob` e fingerprint do Expo. A reprodução do advisory usa um padrão controlado pelo atacante e `optimizationLevel >= 2`. O relatório inclui versões antigas pelo intervalo publicado, sem demonstrar que todos os consumidores invocam esse caminho. | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): corrigido em **11.0.1**. Atualizar consumidores de forma coordenada; não substituir globalmente as APIs das majors 3 e 10 pela 11. |
| `glob` 13.0.6 — moderada | Expo CLI/config/plugins/Metro/fingerprint. O cancelamento por `AbortSignal` pode deixar uma travessia de arquivos continuar após o timeout; exige padrões ou árvores de diretórios influenciados pelo atacante. As cópias 7.2.3 de React Native/codegen/rimraf/test-exclude aparecem também pela dependência `minimatch`; **glob 7 não está no intervalo 9–14.0.1 deste advisory específico**. | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4): corrigido em **14.0.2**. Os consumidores Expo declaram `^13.0.0`; atualizar junto ao toolchain e validar o build. |
| `deepmerge` 4.3.1 — baixa | `@expo/config` 55.0.21. Objetos de origem manipulados podem alterar o protótipo do objeto retornado pela mesclagem. A cadeia encontrada trata configuração do projeto, não um endpoint de mesclagem exposto pela aplicação. | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4): **sem versão corrigida publicada no advisory**. Acompanhar correção ou remoção pelo consumidor; não aceitar configuração Expo fornecida por usuários como entrada de serviço. |

As seis entradas altas do agregado são `decode-uri-component`, `query-string`, `expo-router`, `zod`, `@expo/cli` e `expo`: quatro delas propagam alertas das duas bibliotecas de origem. Os alertas novos de `glob`/`minimatch` explicam a expansão das entradas moderadas. A recomendação automática do JSON inclui Expo 58.0.22, router 58.0.29, React Native 0.88.1 e até `eslint-config-next` 0.2.4; **não é um plano compatível para o projeto atual**.

### Alcance e limites

- A busca por importações diretas desses cinco pacotes e de `query-string` no código próprio de `apps/web/src`, `apps/mobile`, `apps/desktop`, `packages`, `deploy` e `scripts` não encontrou consumo direto. O vínculo observado é transitivo; isso não demonstra ausência de chamadas internas dos frameworks.
- O APK distribuído usa a Activity WebView gerada por `deploy/android-download/install-web-shell.cjs`; não executa o router Expo como sua tela principal. Expo e React Native continuam presentes no projeto e no processo de construção/exportação. Esse fato reduz o alcance demonstrado do router no APK atual, mas não elimina o alerta nem substitui análise do bundle e dos deep links.
- O Desktop carrega a aplicação Web. O lockfile dos workspaces não inventaria integralmente ferramentas obtidas separadamente por `npx` no empacotamento, como Electron/electron-builder, nem bibliotecas nativas, imagens de infraestrutura ou dependências Java. Não extrapolar a contagem npm para esses componentes.
- Não foram executadas provas de exploração, ataques contra produção ou migrações major durante esta triagem. As verificações funcionais da CI não comprovam que uma dependência vulnerável seja segura.

### Próxima atualização de plataforma

Responsáveis: manutenção frontend/mobile e release engineering. Prioridade: remover as cadeias altas de decodificação e Zod por uma atualização coordenada de Expo/router/React Native; tratar junto as cadeias de build `glob`/`minimatch` e acompanhar `deepmerge`. Antes de distribuir a migração, repetir auditoria do lockfile, lint/TypeScript, testes, exports Web/Android/iOS incluídos no pipeline, resolução de links e empacotamento Desktop. Registrar os alertas que persistirem com suas condições de alcance. Não rebaixar dependências nem silenciar advisories para obter uma contagem menor.

### Histórico preservado

Em 28/10, `node-forge` foi atualizado de 1.4.0 para 1.4.2 e o relatório caiu de 12 para 11 entradas (3 altas, 3 moderadas e 5 baixas, incluindo metapacotes). Em 30/10, a revalidação registrou 11 entradas (6 altas e 5 baixas) após a inclusão do segundo advisory de `decode-uri-component`. Essas contagens são históricas; a condição documentada para o commit `21ac899` é a de 45 entradas no início deste documento.

## Segredos

Gitleaks com redação examinou 1.125 commits locais em 28/10/2026 e não encontrou vazamentos reconhecidos pelas regras. Isso não comprova ausência de segredos em logs, arquivos ignorados, bundles de implantação ou credenciais antigas fora do histórico local. Nenhum histórico foi reescrito e nenhuma chave foi exibida.

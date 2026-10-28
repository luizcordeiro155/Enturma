# Dependências — revisão de 28/10/2026

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

`node-forge` 1.4.0 → 1.4.2 no lockfile. Audit passou de 12 para 11 entradas: 3 altas, 3 moderadas, 5 baixas, incluindo metapacotes. Os alertas restantes passam por Expo CLI/router, Zod 3, decode-uri-component e deepmerge. A proposta automática de downgrade do Expo ou troca major do router não foi aplicada. Não afirmar auditoria limpa nem homologação mobile com essas entradas pendentes. Requer validar a atualização coordenada do toolchain Expo e seus exports antes da próxima distribuição nativa.

## Segredos

Gitleaks com redação examinou 1.125 commits locais em 28/10/2026 e não encontrou vazamentos reconhecidos pelas regras. Isso não comprova ausência de segredos em logs, arquivos ignorados, bundles de implantação ou credenciais antigas fora do histórico local. Nenhum histórico foi reescrito e nenhuma chave foi exibida.

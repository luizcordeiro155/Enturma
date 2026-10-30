# Release Candidate — 28/10/2026

Este documento preserva a avaliação da RC de 28/10. As alterações e evidências posteriores de 30/10 estão em [estabilização da experiência](RELEASE_EXPERIENCE_STABILIZATION.md) e no [estado atual](STATUS.md). Os resultados abaixo não devem ser atribuídos automaticamente a commits posteriores.

**NO-GO para publicação como produção homologada ou anúncio de escala.** Há correções implementadas e testadas, mas faltam provas operacionais obrigatórias. A autorização para publicar foi recebida; não foi usada para ignorar os gates de integridade, aplicativos e operação exigidos no pedido.

**Atualização de escopo em 28/10/2026:** o responsável confirmou que não existem backups externos e dispensou sua configuração. A ausência está registrada como limitação de recuperação, não como impedimento obrigatório desta entrega. Isso não comprova recuperação nem dispensa os demais gates. O serviço de staging ainda não foi identificado.

PR: [#109](https://github.com/luizcordeiro155/Enturma/pull/109), branch `codex/production-readiness`. HEAD inicial: `f3f19a03103621db91e78b8a23f47625e6eeaca4`. HEAD de código/testes: `4ed7aecfcc0a73fd81acb0b08ed7009e2280137f`; os commits posteriores desta RC consolidam documentação. O SHA final exato e os checks correspondentes estão no cabeçalho da PR e podem ser obtidos com `git rev-parse HEAD`.

## Diagnóstico e prioridades

Treze grupos de trabalho registrados abaixo: **2 P0, 6 P1, 5 P2, 0 P3**. São prioridades de entrega, não contagem de vulnerabilidades. A revisão estática de segurança, com cobertura parcial, confirmou **um achado de severidade média** na base inicial: geração adaptativa contornava a cota de IA. Foi corrigido com regressões de concorrência e transação. Não foi demonstrada exploração em produção.

| ID / prioridade | Sintoma, causa e evidência | Tratamento, risco e estado |
| --- | --- | --- |
| R01 / P0 | Backup externo inexistente, conforme confirmação do responsável | Configuração **dispensada pelo responsável**; não bloqueia esta entrega por si só. Ensaio sintético concluído; recuperação real não comprovada. Sem a chave, dump de ciphertext pode ser insuficiente. |
| R02 / P0 | Credencial do pacote disponível é superusuária/BYPASSRLS; papel do processo atual desconhecido | Separação Flyway/runtime configurável e SQL restrito preparados/testados em banco sintético. Troca real **bloqueada** até staging; grants insuficientes podem interromper rotas. |
| R03 / P1 | Transições concorrentes podiam aplicar callbacks antigos e deixar snapshot/classe presos | Revisão da transição, cancelamento e watchdog; testes 10/20/30/50, erro e movimento reduzido. **Concluído nos cenários automatizados**; WebView/Windows físicos pendentes. |
| R04 / P1 | Start tinha texto escuro em fundo escuro e controlador separado | Tokens semânticos, contraste, controle compartilhado e persistência. **Concluído com evidência Web** claro/escuro/mobile. Arte preservada. |
| R05 / P1 | Pesquisa Web sem destaque/estado acessível fiel e possibilidade de resposta antiga no caderno | Três estados, `aria-pressed`, tooltip e payload limitados à capacidade do backend; workspace por ID e revisão de carregamento. **Concluído com testes de contrato e layout**. |
| R06 / P1 | Título/favicon não acompanhavam a caixa real; som e troca de sessão precisavam coordenação | Contador real, limpeza na troca de conta, som opcional após gesto, deduplicação entre SW/realtime. **Concluído nos testes de navegador**; som do SO/push físico pendentes. |
| R07 / P1 | IA adaptativa chamava provedor sem cota compartilhada e dentro de transação longa | `AiQuota` atômica, concorrência limitada, I/O externo fora da persistência. **Concluído com testes Java**; limite de execução é por processo, não distribuído. |
| R08 / P1 | Export/build não demonstra instalação, upgrade e comportamento físico | Exports e testes de updater executados; Android/Windows físicos, câmera, áudio, tela, permissões e rollback **não homologados**. |
| R09 / P2 | Preparação do chat fazia chamadas independentes em sequência | Paralelizadas sem reduzir cifragem, locks ou isolamento. **Parcial**: testes funcionais passaram; p50/p95 antes/depois de abertura não medidos. |
| R10 / P2 | Não há capacidade comprovada nem teste multi-réplica | Medição BFF limitada e inspeção de recursos registradas. Benchmark progressivo SQL/WS/filas em staging **não executado**. |
| R11 / P2 | Dependências resolvidas tinham advisories e transitivas não usadas | Patches compatíveis e remoção de cliente HTTP não usado. **Parcial**: 2 alertas Java e 11 entradas npm residuais, triados sem downgrade forçado. |
| R12 / P2 | RPO/RTO, alertas e responsabilidades operacionais sem prova | Runbook de recuperação, promoção e rollback preparado. Configuração/ensaio operacional **pendente**; não é observabilidade implantada. |
| R13 / P2 | Documentação contradizia custódia, RLS e arquitetura Android | Referências corrigidas, histórico preservado, inventário e checker local na CI. **Parcial**: não houve auditoria funcional exaustiva de cada documento nem validação de todas as âncoras/URLs externas. |

## Mudanças e compatibilidade

- **Web:** Start/temas, notificações, compositor dos Cadernos e preparação do chat. Preferências existentes preservadas; nenhum reload obrigatório introduzido.
- **Android e Windows:** recebem as páginas compartilhadas quando uma promoção Web for aprovada. Nenhum instalador/APK novo foi distribuído nesta RC. O workspace Expo e o shell Android gerado têm caminhos diferentes; não confundir export com homologação do APK.
- **Banco:** nenhuma migration criada ou reescrita. Flyway V65 preservado. `FLYWAY_DATABASE_*` permite credencial separada sem alterar o default existente. `deploy/postgres-runtime-role.sql` é preparação manual de staging, não migração automática nem RLS por estudante.
- **IA/workers:** 40 tentativas/dia por usuário no PostgreSQL. Execução direta consome antes do provedor em transação independente; enqueue reserva na própria transação, revertendo se o job falhar ao persistir. Falha do provedor consome tentativa. Uma geração adaptativa por usuário e duas por processo; cadernos continuam usando claim `SKIP LOCKED`.
- **WebSocket:** não foi reescrito. Autenticação, revalidação e escopos existentes revisados; estado permanece local ao processo. Não há prova de coordenação horizontal e Redis não foi adicionado sem medição.
- **Caronas/salas/desafios:** não foram recriados. Regressões existentes exercitam jornadas, typing, perfil, teclado simulado, avaliações e acesso. Geolocalização real, desvios, rede móvel e mídia LiveKit em dispositivos físicos continuam pendentes.
- **Criptografia:** não houve troca de chave, eliminação de identidade ou exclusão de conta. Custódia por conta é recuperável pela API, não E2EE inacessível ao serviço. Identidades antigas nunca sincronizadas e perdidas não podem ser reconstruídas artificialmente.

## Testes e evidências

Execução de referência: [CI40760550624](https://github.com/luizcordeiro155/Enturma/actions/runs/40760550624), SHA `a764409`. Ela passou nos checks abaixo até E2E, onde 33/34 cenários passaram e um seletor antigo ainda procurava o nome anterior do botão de pesquisa. `4ed7aec` atualizou esse seletor para os três nomes acessíveis, preservando todas as asserções de layout/teclado. Execução posterior: [CI40762399978](https://github.com/luizcordeiro155/Enturma/actions/runs/40762399978).

| Verificação | Evidência observada |
| --- | --- |
| Maven verify | 123 testes; zero falhas, erros ou pulados na execução de referência |
| JavaScript | 85 Web, 14 Desktop, 4 contratos e 9 updater; todos passaram |
| TypeScript | Web e Mobile passaram |
| Lint | zero erros; 34 avisos Web e 3 Mobile, incluindo dois avisos de refs nas alterações desta RC |
| Build e pacote | Web passou; prévia Vercel READY; pacote SquareCloud gerado e 2 testes Python passaram |
| Android / iOS | ambos os exports passaram; não equivalem a teste físico |
| E2E final | 34 passaram; CI40762399978 concluída com sucesso no SHA 4ed7aec |
| Restore sintético | passou; contagens iguais, Flyway válido e role restrita testada; 2 segundos |
| Push offline | preparação VAPID/AES128GCM passou com dependências atualizadas, sem enviar requisição de rede |
| Prévia protegida Vercel | claro/escuro, 10/20/30/50 trocas, mobile sem overflow e CTA/login; zero erros JavaScript |
| Segredos | Gitleaks: 1.125 commits locais, zero achados reconhecidos; não é prova sobre logs/arquivos ignorados |
| Dependências | 155 Java examinadas, 2 alertas residuais; npm com 11 entradas residuais |
| Documentação | 56 Markdown inventariados; caminhos locais conferidos por `scripts/check-doc-links.mjs`; âncoras e URLs externas não cobertas pelo checker |

Os artefatos `interface-evidence` guardam screenshots, relatórios de advisories, restore e amostra de latência. Os cenários condicionais de IA/LiveKit validam indisponibilidade quando esses provedores não estão configurados na CI; **não comprovam respostas pagas, voz/vídeo reais ou permissões físicas**. O teclado mobile é geometria/foco simulados, não um IME físico.

## Performance e infraestrutura

Na execução de referência, 12 leituras autenticadas sequenciais do inbox pelo BFF, com um usuário sintético e concorrência 1: **p50 3,71 ms; p95 6,12 ms**, medidos no runner isolado. Não são latência de produção, capacidade simultânea nem melhoria antes/depois de chat. Capacidade máxima: **não medida**. Carga distribuída e falha de nó: **não executadas**.

Consulta somente leitura em 28/10/2026: Flyway V65, 152 tabelas públicas, 151 com RLS, nenhuma FORCE RLS. A credencial do pacote disponível é `postgres`, superusuária/BYPASSRLS; não foi demonstrado que corresponda às variáveis atuais do processo SquareCloud. Não declarar isolamento de estudantes por RLS da conexão atual.

Railway: volume PostgreSQL de 50 GB, ocupação observada 1,18 GB. Nas 24 horas consultadas, CPU média 0,0041 e memória média 0,117 GB. Isso não dimensiona carga futura. Serviços de download estavam SUCCESS; não prova instalação. Infraestrutura ainda necessária para os gates restantes: staging isolado com topologia representativa, métricas/alertas com responsáveis e dispositivos de homologação. Backup externo foi dispensado pelo responsável. Não foi contratado serviço pago ou aumentada capacidade sem evidência.

## Segurança, recuperação e publicação

O scan Codex Security `6d6a36ff-bb64-4204-9cc1-48b101e91bec` foi finalizado com **cobertura parcial**, um achado médio e sete superfícies registradas. O achado descreve a base inicial, corrigida na PR. Não há certificação de segurança ou conformidade jurídica. Consulte [dependências](DEPENDENCY_AUDIT.md), [segurança](SECURITY.md) e [privacidade do chat](CHAT_PRIVACY.md).

Não existe backup externo e sua configuração foi dispensada pelo responsável. O runbook mantém as orientações para eventual adoção futura, cobrindo banco, objetos e chave de custódia. RPO/RTO e retenção não foram demonstrados. O ensaio de CI restaura apenas dados sintéticos; não comprova recuperação real. Plano de promoção e rollback em [operação](OPERATIONS_READINESS.md): API compatível, Web, depois clientes homologados; em regressão, reverter código/JAR/deployment compatível, sem down-migration nem restaurar backup sobre mensagens novas automaticamente.

## Gates GO / NO-GO

| Gate | Estado | O que falta |
| --- | --- | --- |
| A — Segurança | Parcial / NO-GO | provar runtime real; resolver ou aceitar explicitamente triagem residual; validar configuração externa |
| B — Integridade / recuperação | Backup externo dispensado; recuperação não comprovada | ausência registrada, sem bloquear por esse motivo; não declarar RPO/RTO ou chaves restauráveis como verificados |
| C — Funcionalidade | Parcial | CI do SHA final e homologação dos provedores físicos/externos |
| D — Performance | Não executado / NO-GO | baseline de chat, carga progressiva e capacidade documentada |
| E — Aplicativos | Parcial / NO-GO | instalação, upgrade, rollback, teclado e permissões Android/Windows |
| F — Operação | Parcial / NO-GO | alertas, responsáveis, ensaio de incidente/rollback e métricas |
| G — Documentação | Parcial | revisão funcional restante, âncoras/URLs externas e validação jurídica pertinente |

LGPD: nenhuma certificação emitida. Validar bases legais, retenção, contratos de operadores, transferências, atendimento a titulares e procedimento de incidentes com o responsável. A licença proprietária vigente foi lida e preservada; não houve alteração jurídica substantiva.

## Commits, arquivos e próximos passos

- `183eed5`: correções de tema, notificações, IA e dependências.
- `a764409`: reserva transacional de jobs, restore sintético, documentação e gates.
- `4ed7aec`: seletor E2E compatível com os nomes acessíveis da pesquisa Web.
- Consolidação documental posterior: referências e resultados desta RC; consultar a [lista completa de commits e arquivos](https://github.com/luizcordeiro155/Enturma/pull/109/files).

Os grupos alterados são `apps/web` (componentes, CSS, SW, helpers e testes), `services/api` (cota, geração adaptativa, configuração e regressões), `deploy/postgres-runtime-role.sql`, scripts de auditoria/restore/links, workflow CI, lockfile/POM e documentação. O [inventário documental](DOCUMENTATION_INDEX.md) distingue referências atualizadas de histórico e revisão limitada.

Ordem para fechar os bloqueios restantes: comprovar o papel efetivo; identificar staging e ensaiar runtime restrito; homologar dispositivos e integrações; medir carga/filas/WS; aprovar o tratamento dos advisories e operação LGPD; então reavaliar os gates e promover. Backup externo não é pré-requisito desta entrega após a dispensa explícita. **Nenhum deploy de produção, merge em main ou lançamento nativo foi realizado nesta RC; previews Vercel foram publicados.**

O início de serviços locais foi bloqueado pela aprovação automática do ambiente nesta sessão; o PostgreSQL local estava indisponível. Integração e E2E foram direcionados à CI isolada. Não houve stress em produção nem chamadas pagas de IA para benchmark.

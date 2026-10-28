# Release Candidate — 28/10/2026

**Decisão atual: NO-GO para anunciar produção homologada ou capacidade de escala.** Base: `f3f19a03103621db91e78b8a23f47625e6eeaca4`. Esta revisão implementa correções e prepara uma PR verificável; não substitui evidência operacional por CI verde. Resultados finais são atualizados após a CI.

## Correções desta revisão

- Tema: callbacks antigos não sobrescrevem a seleção mais recente; cancelamento e watchdog removem snapshots presos. Testes para 10/20/30/50 mudanças, falha do renderer e redução de movimento.
- Start: cores semânticas com contraste em claro/escuro e controlador compartilhado com autenticação, preservando preferências.
- Cadernos: pesquisa Web com três estados acessíveis, cor selecionada forte, payload condicionado à capacidade do backend; respostas de carregamentos antigos não sobrescrevem o caderno atual.
- Notificações: título e favicon derivados do contador real; som original opcional após gesto do usuário, deduplicação no service worker, supressão na conversa visível e limpeza na troca de sessão.
- Chat: operações independentes de preparação da identidade executadas em paralelo, mantendo cifragem, controle de identidade, lock e revalidação.
- IA adaptativa: cota PostgreSQL compartilhada de 40 tentativas/dia, debitada em transação independente antes do provedor; uma execução por usuário e duas por processo; chamada externa fora da transação de persistência. Falha do provedor consome tentativa e libera a vaga. A trava de execução não é distribuída.
- Dependências: atualizações de manutenção e remoção de dependência transitiva não utilizada. [Triagem e riscos restantes](DEPENDENCY_AUDIT.md).

Não foram criadas ou alteradas migrations aplicadas. Não houve exclusão de contas, dados, troca de chave mestre ou alteração jurídica substantiva.

## Evidência disponível

| Verificação | Resultado observado |
| --- | --- |
| Build Web local | passou |
| TypeScript Web | passou |
| Testes unitários Java selecionados | 28 passaram, zero falhas/pulados |
| Testes Java de integração novos | aguardando PostgreSQL isolado na CI |
| Testes Web/Desktop/contratos/updaters | passaram localmente; totais finais na CI |
| Lint | zero erros; avisos preexistentes serão registrados na CI |
| Segredos | 1.125 commits locais, zero achados Gitleaks |
| Maven OSV | 155 dependências, 2 alertas residuais triados |
| npm audit | 11 entradas residuais; não limpo |
| Capacidade simultânea / p95 sob carga | não medida |
| Restauração de backup real | não executada |
| Android físico / instalador Windows | não homologados nesta revisão |

## Infraestrutura observada, somente leitura

Metadados PostgreSQL coletados em 28/10/2026: Flyway V65 aplicado; 152 tabelas públicas, 151 com RLS, nenhuma FORCE RLS. **A credencial do pacote de implantação disponível é `postgres`, superusuária e BYPASSRLS.** Não foi demonstrado que ela corresponda às variáveis atuais do painel SquareCloud. Não declarar que RLS isola usuários da API: a autorização atual é feita pelos serviços Java e consultas com propriedade/membership. Necessária separação de credenciais de migração e runtime, validada antes da troca operacional.

Railway: PostgreSQL com um volume de 50 GB; ocupação observada 1,18 GB. Nas 24 horas consultadas, CPU média 0,0041 e memória média 0,117 GB. Esses dados de ambiente pouco carregado **não** estimam capacidade de usuários. Serviços de download Android/Desktop estavam SUCCESS; isso não prova instalação física. Um volume persistente não é comprovação de backup.

## Gates ainda obrigatórios

1. CI completa incluindo integração, E2E e exports; corrigir qualquer falha.
2. Teste de restore isolado, retenção, RPO/RTO e cópia protegida das chaves de custódia; nunca incluir chaves no relatório.
3. Provar a role efetiva da API em execução e executar a mudança de privilégios em staging antes de produção.
4. Validar atualização/rollback Android e Windows em dispositivo real, notificações, câmera/microfone/tela e teclado móvel. Hash não substitui assinatura de instalador.
5. Benchmark sintético progressivo em staging com SQL/WS/filas; definir limites a partir de medições. Não há prova de operação multi-réplica.
6. Resolver ou aceitar explicitamente a triagem de dependências com plano de atualização do toolchain; não suprimir testes para liberar.
7. Revisão operacional LGPD: bases legais, retenção de documentos, fornecedores, atendimento de direitos e incidentes. Os testes técnicos não são certificação jurídica.

O início de serviços locais foi bloqueado pela aprovação automática do ambiente nesta sessão; o PostgreSQL local estava indisponível. As provas de integração seguem para o ambiente isolado da CI. Não foram executados stress tests em produção nem chamadas pagas de IA para benchmark.

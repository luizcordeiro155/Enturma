# Identidade acadêmica e experiência integrada — 15/10/2026

Implementação preparada na branch `codex/academic-identity-experience`, a partir de `main` (`66be413`). A publicação em produção foi autorizada pelo responsável em 15/10/2026, incluindo a atualização dos aplicativos quando necessária. A integração aguarda CI aprovada, backup e verificação do ambiente; o resultado da implantação será registrado no PR.

## Fluxos implementados

- Cadastro mantém a autenticação existente e cria identidade acadêmica `PENDING`. A instituição e o campus vêm do catálogo normalizado existente. O contexto confirmado é reaproveitado no onboarding, sem inventar curso, semestre ou matrícula.
- Confirmação por e-mail usa a fila SMTP existente, domínio autorizado por instituição, token aleatório armazenado por hash, validade de 30 minutos, consumo único, substituição no reenvio e limites por usuário/IP. A aprovação significa **controle de endereço acadêmico autorizado**, não matrícula ativa comprovada.
- Comprovantes PDF/PNG/JPEG, até 2 MB, ficam privados no PostgreSQL. Apenas administradores autenticados podem baixar a solicitação vigente. Aprovação/rejeição exige justificativa, impede autoaprovação e remove imediatamente o documento. Documentos não analisados expiram em 14 dias; a rotina de limpeza roda de hora em hora. Backups seguem a retenção operacional do banco.
- `/admin/academic-verification` administra associações de domínio, análise, auditoria e dúvidas de usuários. Sem domínio confirmado, a instituição oferece análise documental real. Nenhuma aprovação é simulada.
- A exclusão solicitada pela própria conta continua acessível enquanto pendente e remove tokens, comprovantes, suporte e dados acadêmicos, sem exigir aprovação prévia.
- Java bloqueia HTTP e WebSockets estudantis de contas pendentes. O canal `academic` entrega somente o estado da própria conta; mensagens do navegador apenas pedem uma consulta autenticada. WebSocket, BroadcastChannel, retorno ao app e polling visível de 12 segundos sincronizam as telas. Oscilações de rede não apagam sessões.
- O livro animado substitui a tela de restauração na abertura normal; erros continuam oferecendo recuperação funcional. Tema, páginas, entrada em caronas e perfis usam Remotion/JavaScript e respeitam redução de movimento. As páginas retidas pelo Next Activity mantêm estado; snapshots em memória preservam conteúdo recente quando a rota é remontada, com atualização em segundo plano e limpeza na troca de conta.
- O editor de perfil oferece prévia ao vivo, cores fortes, mural seguindo o perfil/com cores próprias/com fundo padrão, direção e movimento do degradê e entradas selecionáveis. Fotos e banners ficam fora das camadas coloridas. Respostas atrasadas não substituem o rascunho.
- Exclusão de rotinas de carona cancela viagens futuras sem passageiros confirmados e suas notificações pendentes. Viagens aceitas ou em andamento são preservadas e desvinculadas. A entrega de e-mail/push/notificação revalida a origem; a rotina também repara registros já inativos.
- Apresentação de 90 segundos com livro em 3D, sem personagem, narração contínua aprovada, trilha instrumental original e efeitos sincronizados. Ver [INTRO_EXPERIENCE.md](INTRO_EXPERIENCE.md).

## Migrações PostgreSQL

| Versão | Alteração |
|---|---|
| V45 | Identidade acadêmica, snapshot exato das contas existentes, trigger para novos usuários pendentes, domínios, tokens, comprovantes privados, auditoria e campos da fila de e-mail. |
| V46 | Solicitações de suporte acadêmico e resposta administrativa. |
| V47 | Limpeza de viagens/notificações derivadas de rotinas removidas, preservando viagens confirmadas. |
| V48 | Aparência independente do mural, direção/fluxo do degradê e animação de entrada. |
| V49 | Referências oficiais individuais e associação ao importar instituições posteriormente, sem reativar domínios desativados pelo administrador. |

V45 roda em transação Flyway com lock de cadastro enquanto captura os IDs e instala o trigger. `LEGACY_APPROVED` vem desse conjunto exato, nunca de uma data fornecida/calculada. Não altera `email_verified`, senhas, sessões, perfis ou privilégios. Um cadastro posterior com `created_at` antigo continua pendente. Reexecutar o Flyway não recaptura usuários novos. Não reexecutar SQL avulso nem alterar checksums de migrações aplicadas.

Referências iniciais: [UFMG](https://www.ufmg.br/prograd/noticia/matricula-nas-atividades-de-formacao-transversal-sera-na-proxima-semana/) (`ufmg.br`), [PUC Minas](https://www.pucminas.br/Pos-Graduacao/IEC/noticias/Paginas/Coronav%C3%ADrus-pos-graduacao.aspx) (`sga.pucminas.br`), [UNA](https://diploma.una.br/assets/files/faq-central-de-ajuda.pdf) e [UniBH](https://diploma.unibh.br/assets/files/faq-central-de-ajuda.pdf) (`ulife.com.br`, duas associações explícitas). A correspondência é exata, com subdomínios desativados por padrão. CEFET, UFOP, FUMEC e demais instituições não recebem domínios presumidos; a equipe pode cadastrar fontes oficiais no painel. A lista é distinta da allowlist do coletor de sites.

## Arquivos principais

- Backend: `AcademicIdentityService.java`, `AcademicIdentityController.java`, `RequestSecurity.java`, `AuthService.java`, `SecurityConfig.java`, `Realtime.java` e `EmailWorker.java`.
- Migrações: `services/api/src/main/resources/db/migration/V45__academic_identity.sql` até `V49__curated_academic_domain_references.sql`.
- Web: páginas `academic-verification`, `verify-academic` e `admin/academic-verification`; componentes `academic-verification*.tsx`, `academic-motion.tsx`, `app-launch.tsx`, `motion/`, `profile-details-editor.tsx`, `profile-motion.tsx`; cache em `lib/api.ts`; sincronização em `lib/academic-identity.ts`; proxy, onboarding e tema.
- Mobile Expo: `academic-verification.tsx`, `src/academic-identity.tsx`, `src/experience-motion.tsx`, `src/profile-visual-preview.tsx`, login, layout, onboarding, editor e perfil público.
- Contratos: `packages/contracts/src/academic-identity.ts` e `profile-appearance.ts`.
- Caronas: `RideMobilityService.java`, `NotificationDeliveryPolicy.java` e trabalhadores de entrega.
- Vídeo: `components/intro/book/`, `components/motion/brand-book.tsx`, composição, storyboard, MP3 e `scripts/generate-book-intro-audio.py`.
- Testes: `AcademicIdentityIntegrationTest`, `AcademicLegacyMigrationTest`, `PlatformIntegrationTest`, `api.test.ts`, E2E acadêmico/perfil/vídeo, fixture de estudantes e servidor SMTP exclusivamente de testes. O diff do PR contém a lista completa.

## Verificação executada

- Maven: suíte inicial com 95 testes; o ciclo adicional de identidade e plataforma aprovou 65 testes, incluindo a nova exclusão de conta pendente (96 testes no total). Migração real em schema descartável verifica Gmail/Outlook/institucional, administrador, e-mail não confirmado, sessões intactas, idempotência, cadastro posterior e importação tardia de catálogo.
- `npm test`: 41 testes Web, 4 Mobile, 12 Desktop e 8 do atualizador aprovados.
- TypeScript Web/Mobile e build Web de produção aprovados. Lint sem erros; avisos não bloqueantes existentes em componentes de caronas, imagens e refs permanecem.
- Playwright com banco local, API Java real e SMTP local: cadastro na interface → entrega → confirmação em outro contexto sem cookies → avanço da tela original → sessão reaberta; bloqueios HTTP/WS; offline/broadcast sem aprovação; documento privado/análise/purge; administração; navegação, perfil, mural e privacidade; regressões de estudos, fórum, conversas, chamadas e vídeo. Uma conexão local `ECONNRESET` no teste de privacidade passou na repetição isolada.
- Export Expo Android e iOS aprovado. Pacote Electron Windows x64 sem publicação gerado em `apps/desktop/dist/win-unpacked`. O ambiente Windows precisou incluir `C:\Windows\System32\WindowsPowerShell\v1.0` no PATH do processo de empacotamento.
- O APK distribuído usa o shell WebView documentado em [MOBILE.md](MOBILE.md), compartilhando o Player e páginas Web; o código Expo também recebe os controles de identidade e aparência. Exportação JS não equivale a assinar APK/IPA. Testes Chromium com toque não substituem validação manual do binário instalado em aparelho físico.

Para reproduzir E2E, crie somente o banco local `enturma_e2e`, inicie `node apps/web/e2e/mail-server.cjs` e configure a API de testes com `MAIL_ENABLED=true`, `MAIL_HOST=127.0.0.1`, `MAIL_PORT=1025`, `MAIL_AUTH=false`, `MAIL_TLS=false`, `APP_URL=http://localhost:3000`. Defina `E2E_DATABASE_URL` por variável protegida; execute `npm run test:e2e -w @enturma/web`. Fixtures aprovam apenas contas sintéticas de testes de funcionalidades existentes; o teste acadêmico usa o fluxo real, sem esse atalho. A CI foi atualizada para iniciar o SMTP isolado.

Backup de produção restaurado em banco local isolado: 14 contas e 164 sessões. V45–V49 aplicadas com sucesso nessa cópia antes da publicação. O arquivo privado de backup permanece fora do Git.

## Configuração externa e implantação autorizada

1. Homologar em API/banco de staging, conferir SMTP real (`MAIL_ENABLED`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_AUTH`, `MAIL_TLS`, usuário, senha e remetente), URL pública HTTPS e origens exatas de CORS/WebSocket. O teste local comprova transporte SMTP, não entregabilidade no provedor de produção.
2. Garantir equipe administrativa para análise e suporte, revisar domínios/fontes oficiais e conferir retenção de backups. Não há integração com sistemas de matrícula de terceiros nesta entrega; a alternativa é análise humana autenticada.
3. Após autorização, guardar backup restaurável e registrar contagem/IDs de contas antes da migração. Suspender somente novos cadastros na borda durante a troca. Manter demais sessões e tráfego de usuários existentes.
4. Subir a nova API em blue/green, com Flyway serializado; conferir V45–V49 e igualdade entre snapshot e contas que existiam na captura. Trocar todo o tráfego e drenar instâncias antigas antes de reabrir cadastro: misturar APIs antigas e novas permitiria contornar o novo controle. Não substituir segredos nem invalidar sessões.
5. Publicar Web contra a nova API, testar conta antiga ainda conectada e novo cadastro real em dois dispositivos, verificar fila SMTP/análise e só então reabrir cadastro. Electron e shell Android carregam a origem Web atualizada; distribuir binários apenas se houver alterações do shell ou se for usado o cliente Expo independente.
6. Monitorar erros 401/403, falhas de e-mail, fila de revisão e notificações de caronas. Em reversão, manter o bloqueio de novos cadastros/contas pendentes e a API que aplica o controle; não voltar cegamente a uma API anterior nem apagar o snapshot. Restaurar backup só como procedimento explicitamente autorizado.

Redis não foi necessário: PostgreSQL já fornece transações, limites, filas e consistência. O relay WebSocket existente é por instância; o polling autenticado garante convergência entre instâncias. Antes de escalar várias réplicas com entrega instantânea, adicionar um barramento compartilhado conforme [REALTIME.md](REALTIME.md). Nenhum serviço pago foi provisionado.

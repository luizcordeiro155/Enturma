# Enturma

Plataforma de estudo universitário com catálogo acadêmico controlado, salas temporárias, chat, materiais, assistência de IA e caronas. Monorepo com **Java 21 / Spring Boot**, **Next.js** e **React Native / Expo**.

**Estado: implementação em desenvolvimento, ainda não homologada para produção.** Veja [STATUS](docs/STATUS.md) para distinguir os fluxos testados das integrações e requisitos pendentes. O catálogo começa vazio: nenhum dado acadêmico foi inventado ou importado automaticamente.

## Executar localmente

Requisitos: Java 21 JDK, Maven 3.9+, Node 22.14+ (24 recomendado), npm 11 e Docker Compose. No Windows, use `npm.cmd` se a política do PowerShell bloquear scripts.

1. Clone este repositório e entre na pasta.
2. Copie `deploy/local.env.example` para `.env`. Defina senhas locais distintas para PostgreSQL e MinIO. `DATABASE_PASSWORD` deve corresponder a `POSTGRES_PASSWORD`. O `.env.example` da raiz é o modelo de produção da SquareCloud.
3. Execute `docker compose up -d` para PostgreSQL, Redis, MinIO e Mailpit.
4. Exporte as variáveis do `.env` para os processos de desenvolvimento. No PowerShell: `./scripts/load-env.ps1` com dot-sourcing, conforme abaixo. O JAR de produção também lê `.env` diretamente da sua pasta.
5. Instale os pacotes e execute API, web e mobile em terminais separados.

```powershell
. ./scripts/load-env.ps1
npm ci
mvn -f services/api/pom.xml spring-boot:run
```

```powershell
. ./scripts/load-env.ps1
npm run dev:web
```

```powershell
. ./scripts/load-env.ps1
npm run dev:mobile
```

Web: `http://localhost:3000`. API: `http://localhost:8080`. Mailpit: `http://localhost:8025`. O endereço de API no celular precisa ser o IP local acessível do computador; no emulador Android, geralmente `http://10.0.2.2:8080/api/v1`. Para produção, use HTTPS.

Cadastre uma conta e confirme o e-mail pelo Mailpit. A confirmação também funciona com SMTP real configurado. Para preencher o catálogo, crie um administrador pelo procedimento de [autenticação](docs/AUTHENTICATION.md) e importe registros com fontes oficiais em `/admin`. Não há administrador nem catálogo de demonstração embutidos.

## Serviços externos

- Chamadas Web: `VOICE_ENABLED=true` + `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET`. Suporta microfone, câmera e compartilhamento de tela.
- Materiais: configure `OBJECT_STORAGE_*` e crie um bucket privado. MinIO local usa a mesma interface S3. Formatos desta versão: PDF e TXT.
- IA: configure somente `OPENAI_API_KEY` no backend. O modelo `gpt-5.6-sol` é definido no código; `AI_WEB_SEARCH_ENABLED=true` habilita pesquisa externa com citações clicáveis. A busca nos materiais continua isolada por sala.
- WebSocket: derivado automaticamente de `API_URL`; o chat Web usa relay efêmero E2EE, sem persistir texto, imagens, respostas ou reações no banco.

Nenhuma chave secreta deve usar prefixo `NEXT_PUBLIC_` ou `EXPO_PUBLIC_`.

## Publicar na SquareCloud e Vercel

Para sincronização direta com o GitHub, veja [SquareCloud pelo Git](docs/SQUARECLOUD_GIT.md).
O inicializador compila a API na hospedagem após cada atualização dos fontes,
preservando o `.env`. O deploy não depende de GitHub Actions.

A API vai para a SquareCloud em `dist/enturma-squarecloud.zip`; a interface web usa o projeto Vercel com **Root Directory `apps/web`**. O CI gera o ZIP testado no artefato `squarecloud-api`. Para gerar localmente após `mvn verify`, execute `python scripts/package-squarecloud.py` (Python 3.11+).

O `.env.example` da raiz documenta as variáveis básicas e os blocos opcionais de IA, LiveKit e storage; `apps/web/.env.example` mantém somente as variáveis necessárias à Vercel. Uma versão enxuta das integrações opcionais também fica em `deploy/optional.env.example`. Instruções de upload, PostgreSQL com certificados e configuração Vercel estão em [DEPLOYMENT](docs/DEPLOYMENT.md).

## Estrutura

```text
apps/web                 Next.js App Router, BFF de autenticação e testes E2E
apps/mobile              Expo Router e SecureStore
services/api             API Spring modular, Flyway e testes PostgreSQL
packages/contracts       Tipos e cliente HTTP compartilhados
packages/design-tokens   Identidade visual compartilhada
database                 Procedimentos de importação e documentação
docs                     Arquitetura, segurança, execução e progresso
.github/workflows        Verificações automatizadas
```

## Verificar

Crie um banco separado chamado `enturma_test` e configure `TEST_DATABASE_URL`, `TEST_DATABASE_USERNAME` e `TEST_DATABASE_PASSWORD`. Os testes inserem fixtures explicitamente sintéticas; não aponte para produção.

```text
mvn -f services/api/pom.xml verify
npm run lint
npm run typecheck
npm test
npm run build
cd apps/mobile
npx expo export --platform android
```

E2E exige API e web em execução, API apontando para um banco separado com `e2e` no nome e `E2E_DATABASE_URL` com a conexão PostgreSQL correspondente. O teste cria usuários e promove somente sua própria fixture administrativa. Execute `npx playwright install chromium` e `npm run test:e2e -w @enturma/web`.

## Documentação

[Plano](docs/IMPLEMENTATION_PLAN.md) · [Estado e limites](docs/STATUS.md) · [Arquitetura](docs/ARCHITECTURE.md) · [Banco](docs/DATABASE.md) · [API](docs/API.md) · [Autenticação](docs/AUTHENTICATION.md) · [Salas](docs/STUDY_ROOMS.md) · [Tempo real](docs/REALTIME.md) · [Privacidade do chat](docs/CHAT_PRIVACY.md) · [IA](docs/AI.md) · [XP e aprendizagem](docs/LEARNING.md) · [Caronas](docs/CARPOOL.md) · [Segurança](docs/SECURITY.md) · [Deploy](docs/DEPLOYMENT.md)
# Atualização: catálogo acadêmico e laboratório de programação

Catálogo verificado com prioridade UNA Aimorés, matrizes de UNA/PUC Minas/UFMG, importações persistidas, painel `/admin/catalog`, onboarding web/mobile e 12 desafios JavaScript em `/learn`, liberados por matrícula em TI. Veja [cobertura, fontes e operação](docs/ACADEMIC_CATALOG.md). Não exige novas credenciais no `.env`.


## Atualização: colaboração, IA e aprendizagem

Esta versão adiciona ao Web:

- chat efêmero com E2EE no cliente, imagens de até 8 MB com prévia, respostas e reações por emoji;
- nenhuma persistência de conversas no PostgreSQL;
- chamadas LiveKit com microfone, câmera, destaque de quem está falando, participantes visíveis e compartilhamento de tela com identificação do transmissor/espectadores;
- Enturma AI via OpenAI Responses API, materiais da sala e pesquisa web opcional com fontes;
- XP idempotente, níveis, sequência e desafio diário;
- rate limit específico para login/cadastro/recuperação;
- bloqueio explícito de e-mail e username duplicados.

Antes de publicar, configure OpenAI/LiveKit conforme [DEPLOYMENT](docs/DEPLOYMENT.md) e aguarde o CI completo passar.

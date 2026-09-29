# Enturma

Plataforma de estudo universitário com catálogo acadêmico controlado, salas temporárias, chat, materiais, assistência de IA e caronas. Monorepo com **Java 21 / Spring Boot**, **Next.js** e **React Native / Expo**.

**Estado: implementação em desenvolvimento, ainda não homologada para produção.** Veja [STATUS](docs/STATUS.md) para distinguir os fluxos testados das integrações e requisitos pendentes. O catálogo começa vazio: nenhum dado acadêmico foi inventado ou importado automaticamente.

## Executar localmente

Requisitos: Java 21 JDK, Maven 3.9+, Node 22.14+ (24 recomendado), npm 11 e Docker Compose. No Windows, use `npm.cmd` se a política do PowerShell bloquear scripts.

1. Clone este repositório e entre na pasta.
2. Copie `.env.example` para `.env`. Defina senhas locais distintas para PostgreSQL e MinIO. `DATABASE_PASSWORD` deve corresponder a `POSTGRES_PASSWORD`.
3. Execute `docker compose up -d` para PostgreSQL, Redis, MinIO e Mailpit.
4. Exporte as variáveis do `.env` para o processo Java; Maven não carrega esse arquivo automaticamente. No PowerShell: `./scripts/load-env.ps1` com dot-sourcing, conforme abaixo.
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

- Voz: `VOICE_ENABLED=true`, URL, API key e secret do LiveKit. O navegador acessa o LiveKit diretamente.
- Materiais: configure `OBJECT_STORAGE_*` e crie um bucket privado. MinIO local usa a mesma interface S3. Formatos desta versão: PDF e TXT.
- IA: `AI_ENABLED=true`, `AI_BASE_URL`, `AI_API_KEY` e `AI_MODEL` de um serviço compatível com Chat Completions. Sem credenciais, o recurso aparece como indisponível. A busca inicial usa texto completo do PostgreSQL, documentada como fallback, sem embeddings fictícios.
- WebSocket: configure `WEBSOCKET_URL` no servidor Next.js; em produção use `wss://seu-backend/ws`.

Nenhuma chave secreta deve usar prefixo `NEXT_PUBLIC_` ou `EXPO_PUBLIC_`.

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

[Plano](docs/IMPLEMENTATION_PLAN.md) · [Estado e limites](docs/STATUS.md) · [Arquitetura](docs/ARCHITECTURE.md) · [Banco](docs/DATABASE.md) · [API](docs/API.md) · [Autenticação](docs/AUTHENTICATION.md) · [Salas](docs/STUDY_ROOMS.md) · [Tempo real](docs/REALTIME.md) · [IA](docs/AI.md) · [Caronas](docs/CARPOOL.md) · [Segurança](docs/SECURITY.md) · [Deploy](docs/DEPLOYMENT.md)

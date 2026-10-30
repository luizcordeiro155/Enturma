# Enturma

> **Uma plataforma acadêmica para estudar, colaborar, se organizar e se conectar à vida universitária em um só lugar.**

O **Enturma** é um ecossistema acadêmico multiplataforma construído para aproximar estudantes e reduzir a fragmentação da rotina universitária. A proposta é reunir organização acadêmica, salas de estudo, comunidade, comunicação em tempo real, inteligência artificial, portfólio e mobilidade universitária em uma experiência única.

O projeto é um monorepo com **Java 21 / Spring Boot**, **Next.js / React**, **React Native / Expo** e **Electron**, com aplicações para **Web, Android e Desktop**.

> **Estado atual — outubro de 2026:** plataforma funcional em desenvolvimento ativo e estabilização. Além de Caronas, os ciclos recentes incluem chat, biblioteca de mídia e GIFs KLIPY, personalização, Cadernos IA, animações, instalador/atualizador e experiências móveis. Builds e deploys não substituem testes em dispositivos reais nem certificam homologação integral em produção.

## A proposta

O Enturma nasceu da ideia de que a experiência universitária não deveria estar espalhada em várias ferramentas desconectadas.

O objetivo é oferecer um ambiente onde o estudante consiga acompanhar sua vida acadêmica, encontrar colegas, criar grupos de estudo, conversar, entrar em chamadas, compartilhar tela, aprender com IA, participar da comunidade, organizar seu portfólio e combinar caronas universitárias sem sair do mesmo ecossistema.

A direção do produto é simples: **menos troca de aplicativos, mais contexto e conexão entre estudantes**.

## Estado atual do projeto

[Estabilização de experiência de 30/10](docs/RELEASE_EXPERIENCE_STABILIZATION.md): visitante Web, autenticação, som, digitação, transmissão e instalador; inclui escopo dos testes e limites da validação.

[Release Candidate e gates](docs/PRODUCTION_READINESS.md) · [Auditoria de dependências](docs/DEPENDENCY_AUDIT.md) · [Operação e rollback](docs/OPERATIONS_READINESS.md) · [Inventário documental](docs/DOCUMENTATION_INDEX.md)

A apresentação pública fica em [`/start`](https://enturma-flax.vercel.app/start), com imagem própria para compartilhamento. A [revisão da PR #107](docs/RELEASE_PUBLIC_START_SECURITY.md) registra testes, correções de interface e limites da auditoria. Conversas privadas usam sincronização automática com custódia cifrada na API; consulte o [modelo de privacidade](docs/CHAT_PRIVACY.md), incluindo a recuperação de históricos antigos.

| Área | Situação atual |
| --- | --- |
| Web | Implementação principal em Next.js, em uso como referência visual e funcional do ecossistema |
| Android | APK distribuído com shell WebView; projeto Expo/React Native **0.3.30** também serve ao builder, com homologação física pendente |
| Desktop | Aplicativo Electron com instalador e fluxo próprio de atualização; pacote atual **0.3.15** |
| Backend | API Java 21 / Spring Boot com PostgreSQL, Flyway, autenticação, tempo real e integrações externas |
| Salas e colaboração | Implementadas: salas, chat, presença, voz, câmera e compartilhamento de tela |
| Comunidade | Fórum, amigos, perfil, personalização, conquistas e notificações |
| Aprendizagem | Matérias, desafios, missões, notebooks, XP e assistência de IA |
| Caronas | Fluxo universitário em evolução avançada, atualmente recebendo o maior ciclo de refinamento |
| Produção | Existem builds e deploys reais, mas ainda há validações de dispositivo, escala e homologação a concluir |

As versões declaradas são Web **0.3.0**, Android **0.3.30** e Desktop **0.3.15**, com ciclos independentes. Os builders de download podem calcular números de release a partir do histórico de commits: confira os manifests de distribuição antes de anunciar uma versão. Existe estrutura iOS no repositório, mas não há publicação ou homologação oficial confirmada.

## Principais experiências

### Organização acadêmica

O Enturma organiza a vida do estudante em torno do contexto acadêmico real:

- instituições, campus, cursos, matérias e matrículas;
- visão de semestre e agenda;
- salas, turmas e modo professor;
- materiais e notebooks;
- jornada e portfólio acadêmico;
- missões, XP, conquistas e desafios de programação.

O catálogo acadêmico separa instituições, campi, ofertas de cursos, grades versionadas, períodos e disciplinas e acompanha fontes e estados de verificação. O onboarding usa informações verificadas; não se deve inventar faculdades, grades ou matérias. A identidade acadêmica inclui validação e revisão. A cobertura depende de fontes oficiais disponíveis. Veja [Catálogo](docs/ACADEMIC_CATALOG.md), [Modelo acadêmico](docs/ACADEMIC_DATA_MODEL.md) e [Verificação](docs/ACADEMIC_VERIFICATION.md).

### Salas, chat e chamadas

As salas são ambientes de estudo colaborativo com:

- chat e presença em tempo real;
- chamadas por LiveKit;
- microfone e câmera;
- compartilhamento de tela;
- materiais associados ao contexto da sala;
- experiências Web e Mobile integradas ao mesmo backend.

### Enturma AI e Cadernos

A Enturma AI é uma ferramenta de apoio acadêmico, não substitui professores nem fontes oficiais. O backend utiliza a OpenAI Responses API com os materiais autorizados e pesquisa web opcional, somente quando habilitada. Os **Cadernos IA** organizam fontes, conversas contextualizadas, resumos, explicações, flashcards, quizzes, planos e citações. O histórico pode ser persistido, sem prometer memória ilimitada do modelo. A disponibilidade depende das credenciais, limites e provedores. Veja [IA](docs/AI.md) e [Cadernos](docs/STUDY_NOTEBOOKS.md).

### Perfil, comunidade, turmas e portfólio

Um perfil conecta amigos, mural, foto e banner, cores e gradientes, conquistas, privacidade e interações do fórum. A comunidade inclui posts, comentários, reações e notificações. O projeto também oferece turmas, modo professor, jornada e portfólio acadêmico com visibilidade controlada. A experiência deve preservar o mesmo perfil autorizado nas plataformas e oferecer interface responsiva, inclusive no tema escuro.

Notificações no aplicativo, Web Push, Android e Desktop dependem de permissões, configurações e suporte do dispositivo; um pedido de permissão exibido no navegador não comprova a entrega de notificações.

### Enturma Caronas

O módulo de caronas está sendo transformado em uma experiência de **mobilidade universitária**, e não apenas em uma lista de ofertas.

O fluxo atual já trabalha com:

- modo **Passageiro** e **Motorista**;
- viagens **indo para a faculdade** ou **voltando para casa**;
- campus como ponto acadêmico de referência;
- busca de endereço e locais próximos;
- mapa e cálculo de rota;
- busca progressiva por motoristas;
- matching considerando campus, direção, proximidade e rota;
- disponibilidade do motorista;
- acompanhamento de estados da viagem;
- localização ao vivo durante estados autorizados;
- PIN de embarque;
- cancelamentos com motivo;
- perfil de veículo;
- reputação e avaliações;
- pontos de embarque e recursos de segurança.

A localização exata não deve ser exposta como dado público de descoberta. O compartilhamento ao vivo é temporário e restrito aos participantes autorizados da viagem.

## Chats, GIFs, aplicativos e Motion Design

### Mensagens e mídia

As conversas privadas cifram o conteúdo no cliente e sincronizam a identidade por custódia cifrada na API. O serviço consegue recuperar as chaves com sua chave mestre; esse modo não é E2EE inacessível ao servidor. Salas e chamadas têm garantias distintas. O compositor compartilhado inclui emojis, respostas, reações, figurinhas, anexos, biblioteca pessoal de mídias e favoritos. A **KLIPY** é uma fonte separada de GIFs com lupa de pesquisa, resultados paginados e botão para carregar mais; as mídias são requisitadas diretamente do provedor, não copiadas para o backend do Enturma. As funcionalidades dependem de disponibilidade e configuração da API. Consulte [Interações](docs/CHAT_INTERACTIONS.md) e [Privacidade do chat](docs/CHAT_PRIVACY.md).

### Web, Android e Windows

- **Web:** Next.js/React, BFF com cookies de sessão e publicação pela Vercel.
- **Android:** projeto Expo/React Native e distribuição APK; a versão Android oficial inclui experiência Web integrada em um shell WebView e rotinas nativas de instalação/atualização. Verificar teclado, safe areas, câmera, permissões, notificações e instalação em aparelho real; a confirmação de instalação depende do Android.
- **Windows:** aplicativo Electron com preload/IPC restritos, instalador NSIS, atualização própria e notificações. Downloads e arquivos de atualização exigem validação de origem e integridade. Não anunciar assinatura de código que não esteja configurada.
- **UI/UX:** temas claro, escuro e sistema; navegação responsiva, visualização de perfis, chats, caronas e transições com respeito a movimentos reduzidos.

### Animações

A abertura do Enturma utiliza apresentação com livro animado, cenas de recursos e **Remotion**. O Guia oferece composições curtas; há movimentos específicos em perfis, temas, chat e Caronas. O Windows utiliza animações próprias para instalação, atualização e desinstalação, mantendo o processo real sob controle do instalador. Indicadores percentuais devem refletir eventos reais, nunca progresso inventado. Veja [Introdução](docs/INTRO_EXPERIENCE.md), [Mobile](docs/MOBILE.md), [Desktop](docs/DESKTOP.md) e [Instalador](docs/RELEASE_NATIVE_INSTALLER.md); documentos de releases anteriores podem registrar limitações já superadas.

## Arquitetura

```text
apps/web                 Next.js 16 + React
apps/mobile              Expo 55 + React Native
apps/desktop             Electron
services/api             Java 21 + Spring Boot 3.5
packages/contracts       Tipos e cliente HTTP compartilhados
packages/design-tokens   Tokens de identidade visual
database                 Banco, importações e suporte de dados
docs                     Arquitetura, segurança e operação
```

### Backend e infraestrutura

A API é um monólito modular em Spring Boot, com PostgreSQL e Flyway. Os módulos cobrem autenticação, usuários, catálogo acadêmico, salas, chat, IA, materiais, comunidade, notificações e caronas.

Integrações utilizadas pelo projeto incluem:

- PostgreSQL;
- WebSocket autenticado;
- LiveKit;
- armazenamento compatível com S3;
- OpenAI;
- Firebase Cloud Messaging;
- Vercel para a interface Web;
- infraestrutura de backend/deploy configurada pelo projeto.

Segredos devem permanecer somente no backend ou nos ambientes apropriados. Nunca adicione tokens, chaves ou credenciais reais ao repositório. Chaves de aplicativo usadas diretamente no navegador por exigência de provedores, como KLIPY, não devem ser confundidas com tokens privilegiados de backend. Permissões de banco, RLS e autorização por recurso exigem revisão independente. O projeto não declara conformidade integral certificada com a LGPD. Consulte [Segurança](SECURITY.md) e [Proteção do release](docs/RELEASE_CHAT_SECURITY.md).

## Executar localmente

Requisitos principais:

- Java 21;
- Maven 3.9+;
- Node.js 22.14+;
- npm 11+;
- Docker Compose para o ambiente local completo.

Primeiro, copie `deploy/local.env.example` para `.env` e configure as credenciais locais. Depois:

```powershell
. ./scripts/load-env.ps1
npm ci
docker compose up -d
mvn -f services/api/pom.xml spring-boot:run
```

Em outro terminal:

```powershell
. ./scripts/load-env.ps1
npm run dev:web
```

Mobile:

```powershell
. ./scripts/load-env.ps1
npm run dev:mobile
```

Desktop:

```powershell
npm run dev:desktop
```

Endereços padrão de desenvolvimento:

- Web: `http://localhost:3000`
- API: `http://localhost:8080`
- Mailpit: `http://localhost:8025`

No Android físico, o endereço da API precisa apontar para um host acessível pelo dispositivo. Em emuladores, a configuração depende do ambiente.

## Validação

Antes de considerar uma mudança pronta, valide o que foi afetado. O conjunto principal do projeto inclui:

```text
mvn -f services/api/pom.xml verify
npm run lint
npm run typecheck
npm test
npm run build
```

Mudanças de UI também devem ser verificadas em tamanhos mobile e desktop, temas claro/escuro e com redução de movimento. Mudanças de integração devem ser testadas contra serviços e bancos de teste, nunca contra dados de produção. Os testes E2E/Playwright e as verificações de APK, instalador Windows, chamadas, teclado e notificações devem acompanhar os módulos afetados; CI verde não substitui homologação em aparelhos reais.

## Documentação técnica

A documentação detalhada fica em `docs/`.

Pontos de entrada:

- [Estado atual](docs/STATUS.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Banco de dados](docs/DATABASE.md)
- [API](docs/API.md)
- [Autenticação](docs/AUTHENTICATION.md)
- [Tempo real](docs/REALTIME.md)
- [IA](docs/AI.md)
- [Aprendizagem](docs/LEARNING.md)
- [Caronas](docs/CARPOOL.md)
- [Segurança](docs/SECURITY.md)
- [Deploy](docs/DEPLOYMENT.md)
- [Desktop](docs/DESKTOP.md)
- [Mobile](docs/MOBILE.md)
- [Catálogo acadêmico](docs/ACADEMIC_CATALOG.md)
- [Cadernos IA](docs/STUDY_NOTEBOOKS.md)
- [Apresentação animada](docs/INTRO_EXPERIENCE.md)
- [Instalador e mídias](docs/RELEASE_NATIVE_INSTALLER.md)
- [Segurança e privacidade do chat](docs/RELEASE_CHAT_SECURITY.md)

## Contribuindo

Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir alterações. O foco atual é **qualidade, estabilidade, consistência entre plataformas e melhoria do que já existe**.

## Segurança

Encontrou uma vulnerabilidade? Consulte [SECURITY.md](SECURITY.md) e **não publique detalhes sensíveis em uma issue pública**.

## Licença

O código está disponível publicamente para visualização e colaboração controlada, mas **não é distribuído sob uma licença open source**. Consulte [LICENSE](LICENSE).

---

**Enturma — estudar fica melhor quando a universidade está conectada.**

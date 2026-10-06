# Enturma

> **Uma plataforma acadêmica para estudar, colaborar, se organizar e se conectar à vida universitária em um só lugar.**

O **Enturma** é um ecossistema acadêmico multiplataforma construído para aproximar estudantes e reduzir a fragmentação da rotina universitária. A proposta é reunir organização acadêmica, salas de estudo, comunidade, comunicação em tempo real, inteligência artificial, portfólio e mobilidade universitária em uma experiência única.

O projeto é um monorepo com **Java 21 / Spring Boot**, **Next.js / React**, **React Native / Expo** e **Electron**, com aplicações para **Web, Android e Desktop**.

> **Estado atual — outubro de 2026:** desenvolvimento ativo, com os principais módulos já implementados e um ciclo forte de estabilização, paridade entre plataformas e polimento. As mudanças mais recentes em `main` estão concentradas na experiência de **Enturma Caronas**, incluindo busca de locais, mapa, fluxo passageiro/motorista e matching por rota. O projeto ainda não deve ser apresentado como totalmente homologado em todos os dispositivos e cenários de produção.

## A proposta

O Enturma nasceu da ideia de que a experiência universitária não deveria estar espalhada em várias ferramentas desconectadas.

O objetivo é oferecer um ambiente onde o estudante consiga acompanhar sua vida acadêmica, encontrar colegas, criar grupos de estudo, conversar, entrar em chamadas, compartilhar tela, aprender com IA, participar da comunidade, organizar seu portfólio e combinar caronas universitárias sem sair do mesmo ecossistema.

A direção do produto é simples: **menos troca de aplicativos, mais contexto e conexão entre estudantes**.

## Estado atual do projeto

| Área | Situação atual |
| --- | --- |
| Web | Implementação principal em Next.js, em uso como referência visual e funcional do ecossistema |
| Android | Aplicativo Expo/React Native funcional, atualmente com versão de pacote **0.3.26**, em evolução de paridade e validação |
| Desktop | Aplicativo Electron com instalador e fluxo próprio de atualização; pacote atual **0.3.15** |
| Backend | API Java 21 / Spring Boot com PostgreSQL, Flyway, autenticação, tempo real e integrações externas |
| Salas e colaboração | Implementadas: salas, chat, presença, voz, câmera e compartilhamento de tela |
| Comunidade | Fórum, amigos, perfil, personalização, conquistas e notificações |
| Aprendizagem | Matérias, desafios, missões, notebooks, XP e assistência de IA |
| Caronas | Fluxo universitário em evolução avançada, atualmente recebendo o maior ciclo de refinamento |
| Produção | Existem builds e deploys reais, mas ainda há validações de dispositivo, escala e homologação a concluir |

As versões acima são as versões declaradas atualmente nos pacotes do repositório e não representam, por si só, uma certificação de release final.

## Principais experiências

### Organização acadêmica

O Enturma organiza a vida do estudante em torno do contexto acadêmico real:

- instituições, campus, cursos, matérias e matrículas;
- visão de semestre e agenda;
- salas, turmas e modo professor;
- materiais e notebooks;
- jornada e portfólio acadêmico;
- missões, XP, conquistas e desafios de programação.

O catálogo acadêmico não deve inventar dados oficiais. Fontes acadêmicas precisam ser verificadas antes de serem tratadas como oficiais no produto.

### Salas, chat e chamadas

As salas são ambientes de estudo colaborativo com:

- chat e presença em tempo real;
- chamadas por LiveKit;
- microfone e câmera;
- compartilhamento de tela;
- materiais associados ao contexto da sala;
- experiências Web e Mobile integradas ao mesmo backend.

### Enturma IA

A camada de IA foi criada para apoiar o aprendizado, não para substituir o estudante.

Ela pode trabalhar com o contexto acadêmico e materiais autorizados, gerar explicações e apoiar sessões de estudo. A integração de backend utiliza a OpenAI Responses API, com pesquisa web opcional quando habilitada pelo ambiente.

### Perfil, comunidade e portfólio

O estudante possui uma identidade única dentro do Enturma, conectando:

- perfil e personalização;
- amigos e comunidade;
- fórum;
- conquistas;
- histórico de participação;
- portfólio e evolução acadêmica.

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

Segredos devem permanecer somente no backend ou nos ambientes apropriados. Nunca adicione tokens, chaves ou credenciais reais ao repositório.

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

Mudanças de UI também devem ser verificadas em tamanhos mobile e desktop. Mudanças de integração devem ser testadas contra serviços e bancos de teste, nunca contra dados de produção.

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

## Contribuindo

Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir alterações. O foco atual é **qualidade, estabilidade, consistência entre plataformas e melhoria do que já existe**.

## Segurança

Encontrou uma vulnerabilidade? Consulte [SECURITY.md](SECURITY.md) e **não publique detalhes sensíveis em uma issue pública**.

## Licença

O código está disponível publicamente para visualização e colaboração controlada, mas **não é distribuído sob uma licença open source**. Consulte [LICENSE](LICENSE).

---

**Enturma — estudar fica melhor quando a universidade está conectada.**

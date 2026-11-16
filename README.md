# Enturma

> **Uma plataforma acadêmica para estudar, colaborar, se organizar e se conectar à vida universitária em um só lugar.**

O **Enturma** é um ecossistema acadêmico multiplataforma construído para aproximar estudantes e reduzir a fragmentação da rotina universitária. A proposta é reunir organização acadêmica, salas de estudo, comunidade, comunicação em tempo real, inteligência artificial, portfólio e mobilidade universitária em uma experiência única.

O projeto é um monorepo com **Java 21 / Spring Boot**, **Next.js / React**, **React Native / Expo** e **Electron**, com aplicações para **Web, Android e Desktop**.

> **Estado atual — 16/11/2026:** a [PR #172](https://github.com/luizcordeiro155/Enturma/pull/172) alinhou o app à LGPD (aceite versionado de Termos/Política/18+, política de privacidade reescrita, exportação completa, retenção automática) e corrigiu os limites por cliente atrás do proxy da Square Cloud; a [PR #173](https://github.com/luizcordeiro155/Enturma/pull/173) reduziu as idas ao banco por requisição. Capacidade medida: **~1.300 usuários simultâneos online** no plano atual. Consulte [Status](docs/STATUS.md), [LGPD](docs/LGPD.md) e [Capacidade](docs/CAPACITY.md).

## A proposta

O Enturma nasceu da ideia de que a experiência universitária não deveria estar espalhada em várias ferramentas desconectadas.

O objetivo é oferecer um ambiente onde o estudante consiga acompanhar sua vida acadêmica, encontrar colegas, criar grupos de estudo, conversar, entrar em chamadas, compartilhar tela, aprender com IA, participar da comunidade, organizar seu portfólio e combinar caronas universitárias sem sair do mesmo ecossistema.

A direção do produto é simples: **menos troca de aplicativos, mais contexto e conexão entre estudantes**.

## Conheça o Enturma por dentro

Capturas reais de [produção](https://enturma-flax.vercel.app), feitas em 16/11/2026 no aplicativo desktop e no layout para celular. Tudo o que aparece abaixo está publicado e funcionando hoje.

### Boas-vindas

<table>
<tr>
<td width="72%"><img src="docs/readme/start-desktop.webp" alt="Página inicial pública do Enturma no desktop" /></td>
<td width="28%"><img src="docs/readme/start-mobile.webp" alt="Página inicial pública do Enturma no celular" /></td>
</tr>
</table>

**Sua faculdade. Muito mais em companhia.** A porta de entrada apresenta a proposta em uma frase, leva direto ao cadastro e deixa explorar o Enturma como visitante antes de criar conta. Web, Windows e Android saem do mesmo lugar.

### Entrar e criar conta

<table>
<tr>
<td width="72%"><img src="docs/readme/login-desktop.webp" alt="Tela de login no desktop" /></td>
<td width="28%"><img src="docs/readme/login-mobile.webp" alt="Tela de login no celular" /></td>
</tr>
<tr>
<td width="72%"><img src="docs/readme/register-desktop.webp" alt="Tela de cadastro no desktop" /></td>
<td width="28%"><img src="docs/readme/register-mobile.webp" alt="Tela de cadastro no celular" /></td>
</tr>
</table>

O login escolhe entre manter a sessão neste aparelho ou apenas nesta janela. O cadastro pede o essencial, aceita senhas de 8 a 64 caracteres, recusa senhas comuns e registra o aceite dos Termos, da Política de Privacidade e da declaração de 18 anos, com a versão do documento, como manda a LGPD. Depois vem a confirmação do vínculo acadêmico, que libera a comunidade.

### Início: o dia do estudante em uma tela

<table>
<tr>
<td width="72%"><img src="docs/readme/home-desktop.webp" alt="Início no desktop" /></td>
<td width="28%"><img src="docs/readme/home-mobile.webp" alt="Início no celular" /></td>
</tr>
</table>

O Início recebe o estudante pelo nome, mostra a jornada concluída, o nível e o XP, e coloca o próximo passo em um botão: **Estudar agora**. A navegação lateral vira uma barra inferior no celular, com o restante do app em **Mais**.

### Enturma Study: calendário, aulas e presença

<table>
<tr>
<td width="72%"><img src="docs/readme/study-desktop.webp" alt="Calendário acadêmico, próximas aulas e presença no desktop" /></td>
<td width="28%"><img src="docs/readme/study-mobile.webp" alt="Calendário acadêmico no celular" /></td>
</tr>
</table>

Aulas, estudos, provas, feriados e faltas no mesmo calendário, com as próximas aulas ao lado e aviso duas horas antes de cada uma. A presença é contada por semestre (53 presenças e 100% de frequência no exemplo), e as **Sessões de estudo** agendam um tutor de IA para o horário escolhido.

### Salas de estudo

<table>
<tr>
<td width="72%"><img src="docs/readme/rooms-desktop.webp" alt="Salas de estudo no desktop" /></td>
<td width="28%"><img src="docs/readme/rooms-mobile.webp" alt="Salas de estudo no celular" /></td>
</tr>
</table>

**Encontre uma sala para estudar agora.** O Enturma recomenda primeiro as salas abertas ligadas às suas matérias e ao seu curso. Dá para criar a própria sala ou entrar por código ou QR Code, mesmo com as entradas fechadas; dentro dela há chat, voz, vídeo e compartilhamento de tela.

### Fórum da comunidade

<table>
<tr>
<td width="72%"><img src="docs/readme/forum-desktop.webp" alt="Fórum no desktop" /></td>
<td width="28%"><img src="docs/readme/forum-mobile.webp" alt="Fórum no celular" /></td>
</tr>
</table>

**Pergunte. Compartilhe. Aprenda junto.** Publicações por assunto, busca, ordenação, votos que formam a reputação de quem contribui e denúncia para moderação.

### Enturma Social

<table>
<tr>
<td width="72%"><img src="docs/readme/social-desktop.webp" alt="Feed do Enturma Social no desktop" /></td>
<td width="28%"><img src="docs/readme/social-mobile.webp" alt="Feed do Enturma Social no celular" /></td>
</tr>
<tr>
<td width="72%"><img src="docs/readme/clips-desktop.webp" alt="Clips no desktop" /></td>
<td width="28%"><img src="docs/readme/clips-mobile.webp" alt="Clips no celular" /></td>
</tr>
</table>

Uma rede social feita para a faculdade: feed **Para você**, **Seguindo** e **Minha faculdade**, stories, clips em tela cheia, curtidas, comentários, republicações e itens salvos. A coluna da direita sugere colegas da sua turma.

<table>
<tr>
<td width="50%"><img src="docs/readme/explore-desktop.webp" alt="Explorar com hashtags em alta" /></td>
<td width="50%"><img src="docs/readme/profile-desktop.webp" alt="Perfil social" /></td>
</tr>
</table>

O **Explorar** reúne as hashtags em alta e uma grade de descobertas. O **perfil social** mostra capa, bio, interesses, links e contadores, com abas de posts, clips, republicações, marcados e salvos.

### Amigos e conversas

<img src="docs/readme/friends-desktop.webp" alt="Amigos e conversas" />

Lista de amigos com stories, convites enviados e as conversas mais recentes. Cada conversa abre ao lado, com chamadas de voz e vídeo e GIFs.

### Cadernos IA

<img src="docs/readme/notebooks-desktop.webp" alt="Cadernos IA" />

Cadernos por matéria que juntam suas fontes e as conversas com a Enturma AI, para estudar com respostas baseadas no seu próprio material.

### Praticar programação e Desafios acadêmicos

<table>
<tr>
<td width="50%"><img src="docs/readme/practice-desktop.webp" alt="Praticar programação" /></td>
<td width="50%"><img src="docs/readme/challenges-desktop.webp" alt="Desafios acadêmicos" /></td>
</tr>
</table>

**Um pouco de prática. Todos os dias.** Quatro jogos de programação (Termo Dev, Rota do Algoritmo, Laboratório Binário e Detetive de código) com cinco missões diárias e dificuldade crescente. Os **Desafios acadêmicos** trazem atividades ligadas às suas matérias, como rastreamento lógico, acessibilidade, fluxos de interface e planejamento de projetos.

### Caronas universitárias

<table>
<tr>
<td width="72%"><img src="docs/readme/rides-desktop.webp" alt="Caronas no desktop" /></td>
<td width="28%"><img src="docs/readme/rides-mobile.webp" alt="Caronas no celular" /></td>
</tr>
</table>

Motoristas e passageiros da mesma faculdade se encontram no mapa: quem vai para o campus ou volta dele escolhe vagas, ponto de partida e o carro; quem precisa de carona vê o trajeto, acompanha a viagem e avalia no final. Localização só durante a corrida.

### Portfólio, menu e configurações

<table>
<tr>
<td width="50%"><img src="docs/readme/portfolio-desktop.webp" alt="Portfólio acadêmico" /></td>
<td width="50%"><img src="docs/readme/settings-desktop.webp" alt="Configurações" /></td>
</tr>
</table>

<img src="docs/readme/menu-mobile.webp" alt="Menu Seu Enturma no celular" width="260" align="right" />

O **Portfólio acadêmico** transforma XP, tempo de estudo, sequência, título, apresentação e competências em uma página profissional que você decide quando tornar pública. Em **Configurações** ficam o perfil acadêmico, as matérias do semestre, a ajuda por IA, as notificações e a seção de privacidade com exportação de dados, histórico de aceites e exclusão de conta. No celular, tudo isso fica a um toque no menu **Seu Enturma**.

<br clear="right" />

## Estado atual do projeto

[Enturma Social 2.0](docs/SOCIAL_2_IMPLEMENTATION.md): Feed, Clips, Stories e seguidores independentes do Fórum, editor e processamento de mídia limitado. Flags desligadas por padrão; documentação separa implementação, testes, capacidade pendente e ativação.

[Estabilização de experiência — 30/10 e 02/11](docs/RELEASE_EXPERIENCE_STABILIZATION.md): visitante Web, autenticação, som, digitação, transmissão e instalador; continuação com áudio, recibos, convites e identidade visual. Inclui escopo dos testes, migrações e limites da validação.

[Release Candidate e gates](docs/PRODUCTION_READINESS.md) · [Auditoria de dependências](docs/DEPENDENCY_AUDIT.md) · [Operação e rollback](docs/OPERATIONS_READINESS.md) · [Inventário documental](docs/DOCUMENTATION_INDEX.md)

A apresentação pública fica em [`/start`](https://enturma-flax.vercel.app/start), com imagem própria para compartilhamento. A [revisão da PR #107](docs/RELEASE_PUBLIC_START_SECURITY.md) registra testes, correções de interface e limites da auditoria. Conversas privadas usam sincronização automática com custódia cifrada na API; consulte o [modelo de privacidade](docs/CHAT_PRIVACY.md), incluindo a recuperação de históricos antigos.

| Área | Situação atual |
| --- | --- |
| Web | Implementação principal em Next.js, em uso como referência visual e funcional do ecossistema |
| Android | APK WebView distribuído **0.4.424**; o workspace Expo/React Native permanece declarado **0.3.30**, sem homologação física nesta revisão |
| Desktop | Instalador Windows NSIS distribuído **0.4.424**; versão declarada do workspace Electron **0.3.15** |
| Backend | API Java 21 / Spring Boot com PostgreSQL, Flyway, autenticação, tempo real e integrações externas |
| Salas e colaboração | Implementadas: salas, chat, presença, voz, câmera e compartilhamento de tela |
| Comunidade | Fórum, amigos, perfil, personalização, conquistas e notificações |
| Aprendizagem | Matérias, desafios, missões, notebooks, XP e assistência de IA |
| Caronas | Fluxo universitário em evolução avançada, atualmente recebendo o maior ciclo de refinamento |
| Produção | Web e distribuidores nativos publicados; escala medida em 16/11 (~600 req/s, ~1.300 usuários simultâneos — [Capacidade](docs/CAPACITY.md)); recuperação de dados e dispositivos físicos ainda não homologados |

As versões declaradas são Web **0.3.0**, Android **0.3.30** e Desktop **0.3.15**, com ciclos independentes. Os builders de download podem calcular números de release a partir do histórico de commits: confira os manifests de distribuição antes de anunciar uma versão. Existe estrutura iOS no repositório, mas não há publicação ou homologação oficial confirmada.

**Release distribuída verificada em 02/11/2026:** Windows e Android **0.4.424**, originados no commit `9270a5f`; os dois serviços Railway terminaram em `SUCCESS` com healthcheck aprovado. Esse número não substitui os valores declarados nos workspaces.

## Principais experiências

### Organização acadêmica

O Enturma organiza a vida do estudante em torno do contexto acadêmico real:

- instituições, campus, cursos, matérias e matrículas;
- visão de semestre e agenda;
- salas de estudo; estrutura de turmas/modo professor ainda exige validação funcional ponta a ponta antes de anunciar disponibilidade integral;
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
- **UI/UX:** temas claro, escuro, sistema e Enturma; navegação responsiva, visualização de perfis, chats, caronas e transições com respeito a movimentos reduzidos.

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

Segredos devem permanecer somente no backend ou nos ambientes apropriados. Nunca adicione tokens, chaves ou credenciais reais ao repositório. Chaves de aplicativo usadas diretamente no navegador por exigência de provedores, como KLIPY, não devem ser confundidas com tokens privilegiados de backend. Permissões de banco, RLS e autorização por recurso exigem revisão independente. Bases legais, operadores, retenção, direitos dos titulares e plano de incidentes estão em [LGPD](docs/LGPD.md); o projeto não declara conformidade certificada, e Termos/Política ainda precisam de revisão jurídica. Consulte [Segurança](SECURITY.md) e [Proteção do release](docs/RELEASE_CHAT_SECURITY.md).

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
- [LGPD](docs/LGPD.md)
- [Capacidade e testes de carga](docs/CAPACITY.md)
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

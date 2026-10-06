# Estado atual do Enturma — 06/10/2026

Este documento resume o estado observado atualmente na branch `main`. Ele substitui descrições antigas baseadas em branches intermediárias de implementação.

## Visão geral

O Enturma está em **desenvolvimento ativo e estabilização**. Os principais módulos acadêmicos, sociais e de comunicação já existem no repositório, e o trabalho atual está concentrado em confiabilidade, paridade entre plataformas, UX e integração real entre os fluxos.

As mudanças mais recentes de `main` em 06/10/2026 refinam **Enturma Caronas**, especialmente pesquisa de endereços e locais, ordenação de resultados e detalhes da experiência de mobilidade.

## Plataformas

| Plataforma | Estado |
| --- | --- |
| Web | Aplicação principal Next.js/React, com os fluxos mais completos do produto |
| Android | Expo/React Native, pacote 0.3.26; funcional e em evolução de paridade/validação |
| Desktop | Electron, pacote 0.3.15; utiliza a experiência Web oficial com integrações nativas |
| iOS | Estrutura técnica existe no projeto mobile, mas não há distribuição/homologação oficial declarada |

O pacote Web continua declarado como 0.3.0. As versões de pacote são independentes e não significam que todas as plataformas tenham o mesmo ciclo de release.

## Funcionalidades presentes

### Acadêmico e aprendizagem

- catálogo acadêmico controlado;
- matrícula e matérias;
- agenda e organização;
- salas e turmas;
- materiais e notebooks;
- desafios, missões, XP e conquistas;
- portfólio acadêmico;
- Enturma IA com contexto autorizado.

### Comunicação e comunidade

- chat e presença;
- WebSocket autenticado;
- chamadas via LiveKit;
- microfone, câmera e compartilhamento de tela;
- fórum;
- amigos;
- perfil e personalização;
- notificações.

### Caronas

O módulo de caronas já possui uma camada de mobilidade universitária mais avançada que o fluxo antigo de publicação/interesse.

A implementação atual inclui modo passageiro/motorista, campus e direção da viagem, busca de locais, rotas, matching sob demanda, disponibilidade de motoristas, estados da viagem, localização temporária autorizada, PIN de embarque, cancelamentos, reputação, veículo e recursos de segurança.

O módulo continua em refinamento ativo de UX, ranking, busca de locais e paridade entre plataformas.

## Arquitetura observada

- Java 21;
- Spring Boot 3.5.16;
- PostgreSQL + Flyway;
- Next.js 16.3.6;
- React 19.2.x;
- Expo 55;
- React Native 0.83.x;
- Electron 44.5.1;
- WebSocket;
- LiveKit;
- armazenamento S3 compatível;
- OpenAI;
- Firebase Cloud Messaging.

## Validação

O repositório mantém testes Java, testes Web, typecheck, lint, build e fluxos E2E. Mudanças relevantes devem ser validadas no escopo afetado antes de serem consideradas concluídas.

A existência de builds e deploys não deve ser confundida com homologação completa. Ainda é necessário tratar validação real por dispositivo, combinações de ambiente, escala horizontal e comportamento sob falhas externas.

## Limites e pontos ainda abertos

- Android requer validação contínua em dispositivos físicos;
- iOS não possui distribuição oficial declarada;
- escala horizontal do realtime exige coordenação/pub-sub adequada entre instâncias;
- testes de carga e cenários extensos de produção continuam sendo trabalho separado;
- integrações externas dependem de configuração real e podem exigir validação específica;
- recursos de localização dependem de permissão do usuário e devem manter privacidade por padrão;
- o projeto segue em ciclo de QA e polimento, portanto documentação e versões podem evoluir rapidamente.

## Regra de comunicação

Ao apresentar o Enturma publicamente:

- pode ser descrito como uma plataforma acadêmica multiplataforma funcional em desenvolvimento ativo;
- não deve ser anunciado como totalmente homologado para todos os dispositivos ou cenários;
- dados acadêmicos só devem ser tratados como oficiais quando tiverem fonte verificada;
- funcionalidades em refinamento devem ser apresentadas como tal.

Para detalhes técnicos, consulte [ARCHITECTURE.md](ARCHITECTURE.md), [CARPOOL.md](CARPOOL.md), [DEPLOYMENT.md](DEPLOYMENT.md) e [SECURITY.md](SECURITY.md).

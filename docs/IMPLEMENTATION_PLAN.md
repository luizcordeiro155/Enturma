# Plano de implementação do Enturma

## Estado inicial
Repositório remoto: https://github.com/luizcordeiro155/Enturma. A main continha somente README.md. Trabalho na branch codex/enturma-platform, preservando a main.

## Decisões
- Monólito modular Spring Boot / Java 21, PostgreSQL e Flyway. Controllers pequenos, DTOs explícitos, transações nos serviços.
- Next.js App Router e Expo Router consomem a mesma API /api/v1. Contratos e tokens visuais compartilhados.
- Catálogo inicialmente vazio. Importação administrativa exige procedência; somente registros verificados e vigentes são selecionáveis.
- Credenciais web em cookies HttpOnly via BFF Next.js; mobile usa SecureStore. Tokens opacos aleatórios, hash SHA-256 no banco, access curto e refresh rotativo com detecção de reutilização.
- Concorrência de salas serializada por disciplina com lock PostgreSQL; entrada e capacidade protegidas pelo lock da sala.
- Serviços externos opcionais falham explicitamente quando não configurados. Nunca simular chamada, upload ou resposta de IA.
- Sem publicação de infraestrutura paga ou alteração da main automática.

## Fases e critérios de aceite
1. Fundação: monorepo, containers, migrations, builds, CI.
2. Auth: cadastro, login, rotação/revogação, email, recuperação, sessões e testes de segurança.
3. Catálogo: importação, fonte, vigência, hierarquia, auditoria e administração restrita.
4. Perfil: onboarding validado no backend e seleção de matérias oficiais.
5. Salas: descoberta, criar/reutilizar, capacidade, participantes, encerramento idempotente.
6. Chat: persistência e WebSocket autenticado; somente membros autorizados.
7. Voz: LiveKit, permissões e encerramento remoto.
8. Materiais: storage S3, limites, MIME e isolamento por sala.
9. IA: extração, chunks, recuperação, fontes e limites; integração real configurável.
10. Caronas: ofertas/pedidos, interesse/aceite, vagas, mensagens privadas e avaliações.
11. Moderação: bloqueios, denúncias, ações auditáveis, exportação/exclusão.
12. Produção: E2E, observabilidade, Railway/Vercel, backups e revisão operacional.

Cada fase exige implementação, integração, testes e documentação. Ver docs/STATUS.md para evidências reais e limitações; este plano não declara funcionalidades concluídas.

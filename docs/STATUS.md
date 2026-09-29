> Atualização: o chat atual é persistente, autorizado por sala e não usa E2EE. As descrições históricas abaixo foram substituídas pelo fluxo documentado em CHAT_PRIVACY.md.

# Estado da implementação

Este é um incremento funcional do Enturma, **não a conclusão dos 151 requisitos do documento mestre**. Não está homologado para produção. A configuração de hospedagem prioriza web na Vercel, API na SquareCloud e PostgreSQL existente no Railway; veja `docs/DEPLOYMENT.md`. Não houve publicação em lojas.

## Implementado e integrado

- Monorepo, Java/Spring, Next.js, Expo, contratos e tokens visuais, migrations, Dockerfile, Compose e workflow GitHub Actions.
- Deploy web: configuração Vercel do monorepo, healthcheck de ponta a ponta, origens exatas, WebSocket derivado da API, upload web de 4 MB, download em streaming e limites por cliente assinados pelo BFF. ZIP SquareCloud reproduzível com perfil de porta/memória, leitura de `.env` e template mínimo; integrações opcionais separadas.
- Web: cadastro/login, recuperação/confirmação, sessões, catálogo administrativo JSON, onboarding em seis etapas, matérias/perfil, salas, chat, caronas e matches.
- Backend: tokens com hash/rotação/revogação, autorização, hierarquia acadêmica com fontes/vigência/auditoria, locking de salas/vagas, expiração, chat persistente e WebSocket autenticado, ofertas/pedidos/aceite, conversa privada e avaliações de carona.
- App nativo: cadastro/login, armazenamento seguro, onboarding, listagem/criação/reutilização de salas e chat. Usa a mesma API.
- APIs de bloqueio, denúncia, notificações e suspensão/banimento auditado.
- Integrações configuráveis: LiveKit (voz), S3 (PDF/TXT), extração/chunks/busca textual e provedor de IA com fontes recuperadas da sala. Interface web conectada aos endpoints. Permanecem indisponíveis quando não configuradas.

## Evidências locais

- Preparação SquareCloud/Vercel: 17 testes Java, 7 testes web, 2 testes do empacotador, lint/tipos/build web e fluxo E2E com WebSocket aprovados localmente. O CI também executa o JAR em Java 25 e a interface com `next start`, além de gerar o ZIP sem credenciais.
- Verificação em 28/09/2026: `mvn verify` passou com 14 testes (10 de integração e 4 de parsing); `npm test` passou com 6 testes; lint, TypeScript, build Next.js e exportações Expo Android/iOS passaram. `expo install --check` confirmou compatibilidade. As integrações de IA/storage usam doubles somente no teste de isolamento; não houve chamada a fornecedores reais.
- Testes de integração em PostgreSQL real: sessão, replay de refresh, corrida de criação de sala, capacidade, associação, expiração, expulsão, catálogo, privacidade de caronas e validação HTTP.
- Testes de componentes web e armazenamento seguro mobile.
- Playwright Chromium: cadastro → catálogo de teste → onboarding → sala → reutilização por outro estudante → mensagens em dois navegadores via WebSocket → encerramento → publicação de carona → interesse → aceite → ponto privado.
- Layout verificado em 1487×1058 e 390×844; correção de overflow mobile. Referência e capturas em docs/design.
- Build web e exportações JavaScript Android/iOS executados. Exportação não equivale a homologação de binário em aparelho real.
- PostgreSQL portátil 18.6 usado no Windows; CI configurado com PostgreSQL 17. Docker Compose não executado localmente porque Docker não estava instalado.

## Ainda precisa de implementação

1. Google OAuth, política obrigatória de verificação de e-mail, reenvio de verificação e gerenciamento ampliado de conta.
2. Importação CSV, fontes oficiais reais, disciplinas canônicas compartilhadas, carga horária/pré-requisitos e fluxo completo de revisão de catálogo.
3. Salas privadas/agendadas, moderação delegada, reações/anexos de chat, presença/typing, histórico paginado na UI e descoberta avançada.
4. DOCX/imagens/OCR, jobs isolados de parsing, antivírus, exclusão/retention de materiais, embeddings/pgvector e avaliação sistemática de IA.
5. Paridade nativa de voz, materiais, IA, caronas, administração, notificações, recuperação de senha e configurações. Push Expo e testes em dispositivos Android/iOS.
6. Matching de carona por distância/horário, recusa/cancelamento pelo passageiro, reputação agregada e dados de veículo.
7. Interface de moderação, consentimento/termos, exportação/exclusão de conta e política de retenção aprovada.
8. i18n centralizado, contratos gerados do OpenAPI, métricas completas, outbox de eventos, otimização de WebSocket/Redis, quotas de conexão, testes de carga e revisão de dependências.
9. Homologação dos serviços externos com credenciais reais; upload direto seguro para respeitar limites da Vercel; backup/restauração e operação de produção.

As opções ausentes não são apresentadas como funcionalidades concluídas. As fixtures acadêmicas existem somente nos testes e não devem ser usadas como catálogo oficial. Os arquivos `.tools` e `.local` são auxiliares locais ignorados pelo Git.


## Sala colaborativa — experiência v3

Implementado no Web:

- anexos de imagem E2EE de até 8 MB com pré-visualização e remoção antes do envio;
- texto, imagens, respostas e reações continuam efêmeros e sem persistência do conteúdo no banco;
- chamada LiveKit com lista de participantes, estado de microfone/câmera, destaque visual do participante que está falando e contagem de pessoas na call;
- screen share com identificação explícita de quem está transmitindo e dos participantes conectados que recebem a transmissão;
- grade de câmera/transmissão adaptada para desktop e mobile Web;
- Permissions-Policy permite câmera, microfone e display capture somente para a própria origem;
- Enturma AI usa OpenAI Responses API com o modelo `gpt-5.6-sol` definido no código. `OPENAI_API_KEY` é a única variável obrigatória da OpenAI; pesquisa externa continua opcional por `AI_WEB_SEARCH_ENABLED`.

A mídia LiveKit continua usando a segurança de transporte do WebRTC. A documentação não declara E2EE de mídia até que a camada específica de E2EE do LiveKit seja configurada e validada.

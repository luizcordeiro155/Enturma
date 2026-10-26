# Experiência conectada — implantação e validação

## Comportamento

- O seletor de tema abre por mouse, toque e teclado. Os painéis de perfil editam um rascunho com prévia; Cancelar restaura a abertura do painel, Aplicar mantém o rascunho e Salvar perfil publica. O mural novo usa o fundo do aplicativo. Preferências já salvas são preservadas.
- O perfil público separa mural, atividades e conexões em comum. Atividade é opt-in, limitada a sete dias, com presença expirada em 90 segundos. Chamadas privadas nunca são consultadas nem publicadas. Insígnias usam ilustrações SVG próprias.
- Conversas continuam cifradas no cliente. O login deriva uma chave não exportável com PBKDF2-SHA256/600.000 iterações; o servidor guarda apenas o envelope AES-GCM vinculado à conta, identidade pública e versão da credencial. Contas com cofre antigo fazem uma migração única. Recuperar a senha da conta não destrói o histórico nem inventa uma chave substituta: a identidade original ou a senha anterior ainda permite recuperá-lo.
- Typing privado exige amizade aceita, respeita bloqueios, expira em seis segundos e cessa ao enviar. WebSocket notifica somente o colega; polling autenticado cobre desconexões.
- Entradas públicas: até 10 pessoas em salas por horas e 45 por dias. Convites por código podem ultrapassar o limite e entrar com entradas fechadas, conforme a decisão do produto. Remoções, bloqueios e encerramento continuam obrigatórios. Imagens opcionais da sala são geridas pelo anfitrião.
- Monitor atua somente em sala fechada, ativa e com pessoas presentes e conversa real. Responde a menções, gera material contextual e faz no máximo uma pergunta após oito minutos de silêncio, sem insistir sem resposta. Adia a pergunta quando há typing. Há limites de frequência, orçamento de turnos e claims no PostgreSQL. Cadernos só entram no contexto após compartilhamento explícito do proprietário.
- Portfólios aceitam imagens e PDF (3 MB, seis por projeto, 30 por conta). Arquivos só são públicos quando vinculados a um projeto de portfólio público. Download privado exige propriedade. Fontes dos Cadernos IA e planos de estudo mantêm o fluxo real de processamento e citações.
- O PIN correto inicia a carona, sem segunda confirmação. Cinco erros bloqueiam o PIN; somente o passageiro pode renová-lo após cinco minutos. Avaliações mútuas exigem viagem concluída; as médias distinguem motorista e passageiro.
- Segurança compara amostras reais de GPS com uma rota calculada: precisão até 100 m, amostras até 90 s, distância da rota acima de 800 m por dois minutos ou duração acima do maior entre 1,8× estimativa e estimativa +15 min. A confirmação adia novos avisos por dez minutos. Sem GPS/roteamento, a interface informa indisponibilidade. O botão 190 abre o discador, sem ligação automática. Referência: [Polícia Militar — emergência policial](https://www.pmpr.pr.gov.br/Pagina/Emergencia-Policial-o-que-fazer).
- Ajuda por IA usa somente um guia de utilização, sem contexto de código interno, segredos ou dados privados. Exige provedor configurado; não simula respostas ou ações.
- O guia usa cenas Remotion sob demanda, com pausa em segundo plano e redução de movimento. O áudio v2 mantém voz/música e reduz os efeitos a 12 eventos associados a quadros de ações; a versão anterior continua disponível para clientes em cache.

## Migrações

V52–V58 são aditivas: mídia/limites de salas, Monitor/cadernos compartilhados, cofre de conta, typing privado, atividades e padrão de mural, PIN/segurança e arquivos do portfólio. V52 ajusta a capacidade pública de salas antigas sem remover participantes. Não modifica aprovação acadêmica, perfil existente, senha, verificação de email ou sessões. V56 muda apenas o padrão de novas configurações de mural.

## Publicação

1. Validar Maven, lint, TypeScript, unitários, build Web, exportações Android/iOS, Playwright e scripts de empacotamento. PR/CI deve passar antes do merge.
2. Preservar backup PostgreSQL e release anterior. Publicar backend com Flyway antes de liberar o novo frontend; confirmar saúde, migrações e compatibilidade de usuários/sessões.
3. Publicar o commit revisado na Vercel e conferir o SHA do deployment e os fluxos conectados.
4. Railway: os serviços existentes de download devem seguir `main`, sem `commitSha` fixo, com os arquivos `deploy/android-download/railway.json` e `deploy/desktop-download/railway.json`. Os filtros acionam builds para alterações relevantes ao respectivo wrapper. Alterações de interface Web chegam ao WebView/Electron pela publicação Web.
5. `deploy/native-version.cjs` verifica o SHA imutável no GitHub e usa o tamanho de seu histórico para `0.4.N`; Android usa versionCode `40000000 + N`. Exige histórico crescente de `main`, sem force push. Falha de verificação impede publicar uma versão ambígua. Os manifests incluem o SHA de origem e checksums dos binários.
6. Confirmar a saúde dos serviços, `latest.json` e `latest-android.json`, versão, SHA, tamanho/checksum e disponibilidade dos instaladores. Android reutiliza a chave de assinatura existente. Windows mantém o instalador/atualizador existente.

Configuração externa: provedor de IA/visão, SMTP, LiveKit e roteamento já usados pela instalação; acesso Railway ao GitHub e assinatura Android existente. Não há necessidade demonstrada de um novo Redis: claims, limites, presença e dados duráveis usam o PostgreSQL existente. O cache de navegação não é invalidado por heartbeats de atividade ou typing.

## Reversão

Reverter aplicação para o release anterior se necessário, preservando tabelas e envelopes novos. Não executar down migrations destrutivas. Os clientes anteriores continuam usando o cofre legado e os endpoints de confirmação de embarque idempotentes. Repor o deployment anterior dos downloads mantém os binários disponíveis; não publicar uma versão Android menor sobre uma maior já instalada.

---

## Nota de atualização — 25/10/2026

Este documento é preservado como registro histórico da implementação original. Para o estado atual da branch `main` até a PR #104, ver [Estado atual](STATUS.md), [Arquitetura](ARCHITECTURE.md), [Banco V1–V63](DATABASE.md), [API](API.md), [Segurança](SECURITY.md), [Mobile 0.3.30](MOBILE.md) e [Desktop 0.3.15](DESKTOP.md). Versões, limites e pendências registrados nesta entrega podem ter sido atualizados posteriormente (KLIPY, Caronas, perfis, chats, Cadernos IA, animações e instaladores). Não interpretar validação de código como homologação completa em produção.

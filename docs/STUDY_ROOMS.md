# Salas de estudo

`Estudar agora` exige disciplina verificada e selecionada pelo estudante. Tópico deve pertencer à disciplina. Durações: 25, 50, 60, 90, 120 ou 180 minutos, respeitando `ROOM_MAX_MINUTES`. Capacidade entre 2 e 30.

O serviço procura sala aberta compatível por disciplina/tópico, capacidade, bloqueios e expulsão e reutiliza a sala quando possível. O host já ocupa uma vaga. Entrada repetida é idempotente.

## Experiência v4

A interface Web da sala usa uma navegação inspirada em Discord/Teams, com quatro áreas principais:

1. **Conversa** — histórico privado da turma, respostas, reações e imagens de até 8 MB;
2. **Chamada** — LiveKit/WebRTC com voz, câmera, destaque de fala e compartilhamento de tela;
3. **Materiais** — PDFs/TXT persistidos em storage privado;
4. **Enturma AI** — tutor com materiais, pesquisa opcional e recuperação de contexto.

Desktop usa três colunas: canais, conteúdo e participantes. No mobile web, os canais viram navegação horizontal e o painel de participantes deixa de ocupar largura fixa.

## Histórico e entrada tardia

As mensagens são persistidas no PostgreSQL em `room_message` e `room_message_reaction`. Somente participantes não removidos da sala podem consultar o histórico.

Ao entrar em uma sala já em andamento, o backend informa `messagesBeforeJoin`. Quando esse valor é maior que zero, a interface oferece **Entender o que perdi**, que envia apenas o contexto anterior à entrada do estudante para a Enturma AI e devolve um resumo estruturado.

Participantes que saíram voluntariamente ainda podem consultar uma sessão da qual fizeram parte; usuários removidos perdem acesso.

## Encerramento e estudo final

Ao encerrar ou expirar uma sala:

- novas mensagens/reações e novos joins são bloqueados;
- o histórico permanece disponível aos participantes;
- uma linha `room_study_summary` é criada/atualizada como `PENDING`;
- um job agendado gera um estudo completo com conversa + materiais quando a IA está disponível;
- o estudo final fica acessível na própria sala encerrada.

A API também expõe `GET /study-rooms/history` para sessões encerradas das quais o usuário participou.

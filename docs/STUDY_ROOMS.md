# Salas de estudo

`Estudar agora` exige disciplina verificada e selecionada pelo estudante. Tópico deve pertencer à disciplina. Durações: 25, 50, 60, 90, 120 ou 180 minutos, respeitando `ROOM_MAX_MINUTES`. Capacidade entre 2 e 30.

O serviço bloqueia a disciplina, procura sala aberta compatível por disciplina/tópico, capacidade, bloqueios e expulsão e reutiliza a sala quando possível. O host já ocupa uma vaga. Entrada repetida é idempotente.

Quando a sessão expira, o scheduler atualiza o estado de forma idempotente. O backend também valida o horário nas operações sensíveis; o scheduler não é a única barreira.

## Colaboração

A sala Web reúne três áreas principais:

1. chat persistente autorizado por participante;
2. chamada LiveKit com voz, câmera e compartilhamento de tela;
3. materiais + Enturma AI com respostas baseadas em fontes.

O chat possui histórico persistente. Mensagens e imagens ficam disponíveis aos participantes, inclusive após o encerramento. Consulte [CHAT_PRIVACY](CHAT_PRIVACY.md).

Materiais enviados explicitamente para estudo são diferentes do chat: eles são persistidos em storage privado para que a IA possa indexá-los e consultá-los. Essa diferença deve ficar clara na interface.

## Encerramento

Ao encerrar uma sala:

- novas operações de estudo são bloqueadas;
- grants de mídia deixam de ser emitidos;
- a sala LiveKit é removida pelo reconciliador;
- o chat deixa de aceitar novos envios e mantém seu histórico;
- materiais e histórico seguem a política de retenção do produto.

## Ciclo de vida 0.3.0

POST /study-rooms aceita days=1..5 para MULTIDAY; days=0/ausente mantém QUICK e minutes. Prazo nasce na criação e não pode ser prorrogado. Sala longa preserva vínculo enquanto o usuário fecha o aplicativo; saída explícita libera vínculo. O anfitrião pode alterar título/tópico, bloquear entradas, remover membros e encerrar.

Heartbeat atualiza last_seen_at e tempo de presença. Ausência por 90 segundos deixa de contar como presença online. Sala rápida vazia inicia empty_since; retorno cancela a contagem. Grace configurável por ENTURMA_ROOM_EMPTY_GRACE_SECONDS (300, mínimo 30). Sala longa não encerra por vazio. Avisos de 24h, 1h e fechamento usam eventos únicos e preferências/outbox.

A interface alterna conversa/chamada/materiais/IA sem destruir a chamada global. O dock mantém controles e retorno à sala. Chat lateral da chamada tem tokens próprios para contraste em ambos os temas.

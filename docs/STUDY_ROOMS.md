# Salas

`Estudar agora` exige disciplina verificada e selecionada pelo estudante. Tópico deve pertencer à disciplina. Durações: 25, 50, 60, 90, 120 ou 180 minutos, respeitando ROOM_MAX_MINUTES. Capacidade entre 2 e 30.

O serviço bloqueia a disciplina, busca a sala aberta compatível por disciplina/tópico, capacidade, bloqueios e expulsão e reutiliza quando possível. O host já ocupa uma vaga. Entrar repetidamente é idempotente; retornar depois de sair exige vaga; expulsão impede retorno à mesma sala.

Todas as salas desta versão são públicas para usuários autenticados. Agendamento, visibilidade privada, promoções de moderador e similaridade semântica ainda não estão implementados. Há roles de participante, mas a interface de gestão atual é do host.

Expiration scheduler roda a cada 10 segundos e atualiza status/ended_at idempotentemente. Escrita de mensagem, emissão de grant e entrada também verificam horário no servidor; o scheduler não é a única barreira. Histórico de chat permanece acessível aos membros que continuam associados. Remover ou sair elimina acesso.

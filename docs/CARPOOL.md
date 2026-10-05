# Enturma Caronas

Ofertas/pedidos com campus oficial, região aproximada, direção, saída e 1–8 vagas. Busca exibe apenas os campos públicos. Não existe campo público de endereço exato, telefone ou localização residencial.

Interesse gera pedido PENDING único por usuário/carona. Somente dono aceita, com lock da carona e limite de vagas. Chat e ponto de encontro exigem status ACCEPTED e identidade de uma das duas partes. Conhecer UUID não concede acesso. Bloqueios são checados nos pedidos, no aceite e no chat.

Somente dono conclui/cancela. Conclusão exige ter chegado o horário da saída. Avaliação 1–5 só após conclusão, uma por avaliador/match. Há testes para privacidade e lotação. O sistema não faz verificação de motorista nem oferece garantia de segurança.

Ainda pendentes: ranking por proximidade/horário, filtros geográficos, telas equivalentes no app nativo, notificações completas de ciclo de vida, perfis de veículo e reputação agregada. Não há porcentagem de compatibilidade inventada.

## Encerramento e retenção das conversas

Os dois participantes podem cancelar um pedido (inclusive antes do aceite), encerrar a conversa ou excluir o histórico. Cancelar o match libera a vaga. Encerrar bloqueia novas mensagens, alterações no ponto de encontro e entrada em chamadas; o histórico fica disponível por 24 horas. Excluir remove mensagens e ponto para ambos imediatamente, com confirmação, mas preserva o registro da carona e avaliações. Se a carona ainda estiver ativa, aparece um aviso de conversa excluída e o botão de cancelar o match continua disponível.

Concluir ou cancelar a carona encerra suas conversas. Conversas ainda abertas também encerram 24 horas após a saída. A limpeza roda a cada minuto e apaga o conteúdo 24 horas após o encerramento; chamadas encerradas são removidas pelo reconciliador de voz. A interface atualiza o estado do outro participante a cada três segundos. A migração V17 concede uma janela de 24 horas aos históricos já encerrados.

Após o aceite, os participantes veem uma confirmação animada em JavaScript com foto, nome e personalização do perfil. O botão “Combinar encontro” abre a conversa. A confirmação é lembrada por usuário neste navegador para não reaparecer a cada navegação; “Reduzir animações” mantém a confirmação estática e acessível por teclado.


## Mobilidade universitária — implementação atual

O módulo evoluiu de publicação + interesse para um fluxo de mobilidade universitária com matching automático entre `OFFER` e `REQUEST`.

O matching cruza campus, direção, janela de até 90 minutos, bloqueios, vagas, reputação e proximidade quando os dois usuários autorizam localização aproximada. A interface explica os motivos da combinação; ela não exibe porcentagem fictícia de segurança.

A viagem possui estados próprios: `SCHEDULED`, `MATCHING`, `DRIVER_ON_THE_WAY`, `ARRIVING`, `WAITING_PASSENGER`, `IN_PROGRESS`, `ARRIVED`, `COMPLETED` e `CANCELLED`. O backend valida as transições.

Depois do aceite existem confirmação independente de motorista/passageiro, PIN de embarque, lista de espera, ordenação de paradas para múltiplos passageiros, perfil opcional do veículo, reputação detalhada, caronas recorrentes e pontos oficiais de embarque por campus.

Localização aproximada da origem não é devolvida na descoberta. Localização ao vivo só funciona durante estados ativos da viagem, entre participantes aceitos, mantém apenas a última posição e é apagada ao parar, cancelar, encerrar, bloquear ou registrar no-show. O link de segurança usa token temporário e revogável para um contato de confiança.

As animações novas de carona são controladas por JavaScript. Web/Desktop usam Web Animations API; React Native usa `Animated`. A preferência de reduzir movimento continua sendo respeitada.

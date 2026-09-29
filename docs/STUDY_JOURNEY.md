# Jornada de estudo e guia

A página inicial oferece três etapas com recompensa única: selecionar uma matéria (20 XP), participar de uma sala (30 XP) e enviar uma mensagem na sala (50 XP). O servidor verifica os dados existentes ao sincronizar o painel. Os eventos de XP usam chaves únicas e uma transação com bloqueio por usuário para impedir recompensa duplicada em abas ou requisições simultâneas. O total integra `learning_stats`, inclusive para estudantes fora de TI; os minigames mantêm seus critérios de acesso.

O tutorial opcional tem nove passos, atalhos para os recursos reais, navegação por teclado e opção de sair. A preferência de dispensá-lo fica na conta. O botão “Guia do Enturma” permite reabri-lo. O painel sincroniza ao voltar à página, em eventos de notificações e a cada 15 segundos enquanto a aba está visível.

“Limpar notificações” remove os avisos da caixa de entrada do próprio usuário, inclusive os não lidos. A marca de descarte fica no banco para preservar a deduplicação; novos avisos continuam chegando. O cliente ignora consultas antigas que terminem depois da limpeza.

As novas animações usam a Web Animations API. A preferência do sistema ou a opção “Reduzir animações” desabilita movimentos e cancela as animações registradas em andamento. O conteúdo permanece legível e utilizável sem animação. Os testes cobrem concessão concorrente de XP, isolamento da limpeza, persistência, tutorial, foco e movimento reduzido em desktop e celular.

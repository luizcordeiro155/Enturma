# XP, sequência e prática diária

O módulo de aprendizagem complementa as salas de estudo com prática curta e progressiva.

## Progressão

Cada usuário elegível possui:

- XP total;
- nível;
- XP restante para o próximo nível;
- sequência diária atual;
- maior sequência alcançada;
- progresso por jogo e dificuldade.

A primeira conclusão de cada nível concede XP uma única vez. Repetir um nível já concluído pode ser usado para prática, mas não gera XP infinito.

A fórmula inicial usa 250 XP por nível. Isso é um parâmetro de produto e pode evoluir sem alterar o histórico de eventos de XP.

## Desafio diário

A API gera um desafio diário determinístico por usuário e data UTC, selecionando um dos jogos e uma dificuldade. Concluir a missão diária concede um bônus de XP uma única vez e atualiza a sequência.

Falhar aumenta o contador de tentativas, mas não reduz XP. A sequência é atualizada apenas em atividade concluída.

## Minigames atuais

- Rota do algoritmo: raciocínio procedural e planejamento de comandos.
- Laboratório binário: representação numérica e potências de 2.
- Detetive de código: rastreamento de variáveis, arrays e laços.

Cada jogo possui quatro níveis e deve ficar progressivamente mais exigente. Novos jogos devem avaliar conteúdo de verdade, não cliques ou tempo de tela.

## Anti-farm

`learning_xp_event` possui chave única por usuário + evento. Isso impede que refresh, retry ou chamadas repetidas premiem o mesmo feito mais de uma vez.

A progressão deve continuar priorizando aprendizagem. Não adicionar mecânicas que recompensem spam, presença passiva ou comportamento compulsivo.

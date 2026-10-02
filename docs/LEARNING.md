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

A API mantém cinco missões diárias por jogo, usuário e data UTC, com dificuldade progressiva. Concluir a missão diária concede um bônus de XP uma única vez e atualiza a sequência.

Falhar aumenta o contador de tentativas, mas não reduz XP. A sequência é atualizada apenas em atividade concluída.

## Minigames atuais

- Rota do algoritmo: raciocínio procedural e planejamento de comandos.
- Laboratório binário: representação numérica e potências de 2.
- Detetive de código: rastreamento de variáveis, arrays e laços.

Os jogos de programação usam missões diárias e prática progressiva. Novos jogos devem avaliar conteúdo de verdade, não cliques ou tempo de tela.

## Anti-farm

`learning_xp_event` possui chave única por usuário + evento. Isso impede que refresh, retry ou chamadas repetidas premiem o mesmo feito mais de uma vez.

A progressão deve continuar priorizando aprendizagem. Não adicionar mecânicas que recompensem spam, presença passiva ou comportamento compulsivo.

## Registry acadêmico 0.3.0

Os quatro jogos de TI (incluindo Termo Dev) permanecem em /learn. /challenges usa AcademicGames.REGISTRY e ChallengeTemplates separados. Dezoito templates abrangem cálculo proporcional educacional, protocolos, registros e prioridade; caixa/custos/planejamento/decisão; conceitos jurídicos; unidades/circuitos/fórmulas; acessibilidade/heurísticas/fluxos; rastreamento lógico.

Elegibilidade exige matéria REAL selecionada e toda hierarquia VERIFIED. Assignment associa disciplina ao template por nome normalizado específico; curso sem grade confirmada não recebe disciplinas inventadas. Casos clínicos são educativos, não orientação de atendimento.

GET /learning/academic lista atividades; POST /start recebe subjectId/game/daily/slot (1..5). A definição/resposta correta permanece no servidor; o cliente recebe contexto, enunciado e dica. POST /{id}/answer contabiliza tentativas. Cinco missões diárias por jogo/matéria, prática limitada e XP idempotente. Dificuldade sobe a cada dois dias com atividades concluídas, até 10. Progressão alimenta conquistas.

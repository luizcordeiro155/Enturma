# XP, sequência e prática diária

O módulo de aprendizagem complementa as salas de estudo com prática progressiva para estudantes de TI.

## Progressão

Cada usuário elegível possui XP total, nível, sequência diária, maior sequência e progresso por jogo/dificuldade. A primeira conclusão de cada nível concede XP uma única vez. Repetições servem para prática sem gerar XP infinito.

A fórmula atual usa 250 XP por nível.

## Desafio diário

A API escolhe deterministicamente um jogo + nível por usuário/data UTC. A missão diária concede bônus de XP uma única vez.

Os jogos atuais são:

- `robot` — Rota do algoritmo;
- `codeword` — Código Secreto;
- `trace` — Detetive de código.

## Rota do algoritmo

O usuário precisa escrever um pequeno programa textual para mover o robô. Instruções permitidas:

- `UP`
- `DOWN`
- `LEFT`
- `RIGHT`
- `REPEAT N DIRECAO`

Os mapas crescem para 5x5 e 6x6, adicionam mais obstáculos e reduzem o limite de operações nos níveis avançados. O backend valida a mesma gramática e o mesmo mapa do cliente; não há `eval` nem execução de código arbitrário.

## Código Secreto

Substitui o antigo Laboratório binário e usa palavras relacionadas a programação.

Modos:

- **Solo** — uma palavra;
- **Dueto** — duas palavras usando o mesmo palpite;
- **Quarteto** — quatro palavras usando o mesmo palpite.

As pistas seguem três estados: posição correta, letra existente em outra posição e letra ausente. O nível 4 usa palavras de sete letras e dez tentativas compartilhadas.

## Detetive de código

Mantém a leitura de JavaScript, mas os quatro desafios foram elevados para combinações de laços, arrays, map/filter/reduce e índices.

## Anti-farm

`learning_xp_event` possui chave única por usuário + evento. Refresh, retry ou chamadas repetidas não premiam o mesmo feito mais de uma vez.

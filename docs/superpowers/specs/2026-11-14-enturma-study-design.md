# Enturma Study — agenda inteligente e tutor adaptativo

Data: 2026-11-14 · Origem: pedido do Luiz (14/11 12:51) + anexo "Enturma Study — Agenda Inteligente e Tutor Adaptativo" + mockup do Início.

## Intenção e porquê

O Enturma já reúne turmas, Social, Cadernos IA e desafios, mas o aluno não tem um lugar que diga
**o que estudar hoje e quando**. O Enturma Study transforma o Início no centro da rotina acadêmica:
um calendário com aulas, estudos, provas e feriados; lembretes que chegam na hora certa; e um modo de
estudo com o tutor IA que se adapta ao nível e ao ritmo de cada aluno.

Sucesso, para o Luiz: o aluno abre o Início e entende o dia; recebe "sua aula começa em 2 h"; toca no
lembrete de estudo e cai direto no modo de estudo daquela matéria; o tutor conversa, gera quiz e cobra
esforço sem humilhar; o progresso mostrado é real.

## Objetivos

1. Calendário mensal e semanal no Início, com feriados em vermelho, aulas, estudos, provas e lembretes.
2. Aulas recorrentes a partir das matérias do perfil acadêmico, com horário configurado em
   "Minha rotina acadêmica"; editar uma ocorrência ou a série; cancelar e repor.
3. Notificação 2 h antes de cada aula (configurável) e lembretes de estudo com Iniciar / Adiar /
   Reagendar, em Web, Android e Desktop, sem duplicar e respeitando horário de silêncio.
4. Página própria de estudo com tutor IA (estilo NotebookLM): matéria, objetivo, cronômetro, chat,
   anexos (documentos e imagens), emojis, botões de quiz/resumo/exercício, encerrar/reagendar.
5. Personalidades do tutor: Acolhedor, Equilibrado (padrão), Exigente (firme, nunca humilhante).
6. Aprendizado adaptativo: diagnóstico de 5 questões, níveis (Iniciante → Em desenvolvimento →
   Intermediário → Avançado → Domínio demonstrado), sugestões de revisão confirmadas pelo aluno.
7. Desafios cronometrados (30/45/60 min) com relógio no servidor, salvamento automático, resultado
   com explicações e comparação com tentativas anteriores; desistir ≠ cair a conexão. Se o aluno
   desiste, o tutor incentiva a continuar.
8. "Minha evolução" só com métricas reais.
9. Visual Enturma, animado com JS, responsivo; no celular o campo de mensagem acompanha o teclado
   como em Amigos.

## Não-objetivos

- Não criar uma segunda IA, um segundo gerenciador de documentos nem outro sistema de progresso.
- Não sincronizar com Google Agenda/Outlook nesta entrega.
- Não importar grade horária oficial das instituições (o catálogo não tem horários).
- Não marcar presença nem integrar com sistemas acadêmicos das faculdades.

## Anti-objetivos (seria fracasso mesmo "funcionando")

- Feriado cancelando aula automaticamente.
- Notificação duplicada após reinício do servidor, ou lembrete de aula já cancelada/reagendada.
- Métrica inventada no "Minha evolução" ou no "Resumo do seu dia".
- Tutor que humilha, ou que gasta a cota de IA sozinho numa sessão longa.
- Credencial de IA no frontend.
- Composer do chat que pula ou some com o teclado no celular.

## Restrições

- Migrações Flyway aditivas a partir da V75. Postgres no Railway; API Java 21/Spring na SquareCloud
  (reinicia a cada deploy) — por isso todo agendamento fica no banco, com fila idempotente
  (`FOR UPDATE SKIP LOCKED`, como `EmailWorker` e `NotebookService`).
- Cota de IA existente: 40 pedidos/dia por aluno (`AiQuota`). O modo de estudo só chama a IA em ações
  explícitas do aluno (mensagem, gerar quiz/resumo/exercício, correção de resposta aberta).
- LGPD: tudo novo entra na exportação e na exclusão de conta (`AccountPrivacyController`).
- Funciona nos 4 temas (Claro, Escuro, Enturma, Sistema) e com movimento reduzido.
- Fuso: `America/Sao_Paulo` por padrão, configurável na rotina.

## O que já existe e será reaproveitado

| Peça existente | Uso no Study |
| --- | --- |
| `user_subject` + catálogo (`academic_entry`) | matérias do aluno |
| `academic_identity` → `academic_institution`/`academic_campus` (`city`, `state`) | UF/cidade para feriados |
| `academic_enrollment.shift` | sugestão de horário padrão (manhã/tarde/noite) |
| `campus_task` (CLASS/EXAM/ASSIGNMENT/STUDY/EVENT…) | provas, trabalhos e lembretes avulsos |
| `focus_session` | cronômetro e tempo real de estudo |
| `campus_learning_profile` | perfil adaptativo (notas, contagem de interações) |
| `campus_tutor_interaction` | histórico do tutor por matéria/sessão |
| Cadernos IA (`study_notebook`, fontes, `NotebookService`, `AiProvider`) | documentos, imagens e geração de quiz/resumo/flashcards |
| `study_flashcard` (revisão espaçada) | exercícios e revisão |
| `NotificationService` + push (FCM, Web Push, desktop) + `NotificationPreferences` | lembretes |
| `StudyJourney` ("Seu espaço de estudo") e `EnturmaIntroExperience` no Início | ponto de entrada |

As tabelas `campus_*`, `focus_session` e `study_flashcard` existem desde a V30/V32 mas hoje só são
usadas na exportação/exclusão LGPD — o Study volta a usá-las.

## Abordagens consideradas

1. **Módulo `planner` no backend atual + reaproveitamento das tabelas existentes (escolhida).**
   Novo pacote Java `br.com.enturma.planner` (agenda, rotina, feriados, lembretes, avaliações),
   tutor apoiado no `AiProvider`/Cadernos. Uma fila de lembretes no banco. Web: bloco no Início +
   página `/study`. Prós: um só deploy, mesma auth, mesma cota, LGPD centralizada. Contras: mais
   código no serviço principal.
2. **Agenda só no cliente (localStorage) com notificações locais.** Rápido, mas não notifica com o app
   fechado, não sincroniza entre Web/Android/Desktop e perde dados — descartada.
3. **Serviço separado para agenda/lembretes.** Isolamento, mas duplica auth, deploy e LGPD sem ganho
   real no volume atual — descartada.

Decisão do Luiz (14/11 13:27): feriados **nacionais e estaduais automáticos**, a partir da UF/cidade
do campus; **municipais e pontos facultativos** o aluno adiciona no calendário com um toque.
"Pode prosseguir da melhor forma possível" — as demais escolhas abaixo são minhas, marcadas
como *(decisão minha)*.

## Desenho

### Dados (V75, aditiva)

- `academic_routine` (1 por aluno): `timezone`, `default_start` (time), `default_end`, `weekdays`
  (smallint bitmask), `semester_start`/`semester_end` (date), `class_reminder_minutes` (padrão 120),
  `study_reminder_minutes` (padrão 10), `quiet_start`/`quiet_end`, `tutor_personality`
  (`WELCOMING`/`BALANCED`/`DEMANDING`, padrão `BALANCED`), `state`/`city` (preenchidos do campus,
  editáveis).
- `academic_class_schedule`: série recorrente por matéria — `subject_id`, `weekday`, `starts_at`,
  `ends_at` (time), `valid_from`/`valid_until`, `room` (texto livre), `version`.
- `academic_class_exception`: por série e data — `CANCELLED` ou `MOVED` (nova data/hora) ou `EXTRA`
  (reposição), com nota.
- `study_schedule`: estudo planejado — `subject_id`, `starts_at` (timestamptz), `minutes`, `goal`,
  `status` (`PLANNED`/`STARTED`/`DONE`/`SKIPPED`), `focus_session_id`, `origin`
  (`USER`/`SUGGESTION`).
- `calendar_holiday`: `date`, `name`, `scope` (`NATIONAL`/`STATE`/`CITY`/`OPTIONAL`), `state`,
  `city`, `user_id` (nulo = oficial; preenchido = adicionado pelo aluno).
- `academic_reminder_job`: `user_id`, `kind` (`CLASS`/`STUDY`/`EXAM`/`REVIEW`), `source_id`,
  `occurrence_at`, `fire_at`, `status` (`PENDING`/`SENT`/`CANCELLED`), `attempts`, `lease_until`;
  **único** em `(user_id, kind, source_id, occurrence_at)` — reinício do servidor ou reprocessamento
  nunca duplica.
- `study_assessment`: `subject_id`, `kind` (`DIAGNOSTIC`/`QUIZ`/`SIMULATION`/`FLASHCARDS`),
  `minutes`, `questions` (jsonb — enunciado, alternativas, resposta, explicação, tópico),
  `source_ids` (fontes do caderno usadas).
- `study_assessment_attempt`: `started_at`, `deadline_at` (servidor), `answers` (jsonb, autosave),
  `last_seen_at`, `status` (`IN_PROGRESS`/`SUBMITTED`/`ABANDONED`/`EXPIRED`), `score`,
  `topic_scores` (jsonb).
- `subject_mastery`: `user_id`,`subject_id`, `level` (5 níveis), `evidence` (jsonb com contagens
  reais), `updated_at`.

Todas entram na exportação e exclusão de conta.

### Feriados

- Nacionais: calculados (fixos + móveis a partir da Páscoa: Carnaval como ponto facultativo,
  Sexta-feira Santa, Corpus Christi como ponto facultativo), sem chamada externa.
- Estaduais: tabela semeada na V75 com os feriados estaduais dos 27 estados (fonte: leis estaduais;
  revisão anual) *(decisão minha: dado versionado no repositório, não API externa)*.
- Municipais/pontos facultativos: o aluno adiciona no painel do dia ("Marcar como feriado"),
  visível só para ele.
- Feriado só **marca** o dia; aulas daquele dia aparecem com o aviso "feriado — confirme se haverá
  aula" e o aluno decide cancelar (exceção) ou manter.

### Agenda (API `/api/v1/planner`)

- `GET /calendar?from&to` — ocorrências expandidas (aulas da série − exceções + reposições), estudos,
  provas/trabalhos (`campus_task`), lembretes e feriados, já no fuso do aluno.
- `GET/PUT /routine` — "Minha rotina acadêmica".
- CRUD de séries de aula, exceções (`cancelar esta`, `mover esta`, `editar a série`, `repor`), estudos
  (duplicar, reagendar), provas/trabalhos/lembretes (via `campus_task`).
- Toda escrita que muda horário recalcula os `academic_reminder_job` afetados na mesma transação:
  cancela os antigos e cria os novos (idempotente pela chave única).

### Lembretes

- Worker `@Scheduled` a cada 30 s, `FOR UPDATE SKIP LOCKED`, lote pequeno, com `lease_until`.
- Janela: gera jobs para os próximos 14 dias; um job diário estende a janela.
- Silêncio: se `fire_at` cai no horário de silêncio, o lembrete de **estudo** é adiado para o fim do
  silêncio; lembrete de **aula** é enviado no último minuto antes do silêncio *(decisão minha: aula
  não pode ser perdida)*.
- Entrega pelo `NotificationService` existente (in-app + push + desktop) com nova categoria
  `STUDY_REMINDER` nas preferências; `href` abre exatamente a aula (`/home?day=…`) ou o modo de estudo
  (`/study/{scheduleId}`). Ações do push de estudo: Iniciar / Adiar 10 min / Reagendar.
- Um lembrete enviado fica na central de notificações como qualquer outro.

### Modo de estudo (`/study/[id]`, página própria)

- Cabeçalho: matéria, objetivo, cronômetro (`focus_session`, tempo contado pelo servidor), progresso,
  Encerrar / Reagendar.
- Chat com o tutor: mensagens do aluno com texto, emojis e anexos (PDF/imagem entram como **fontes do
  Caderno da matéria** — um Caderno por matéria, criado automaticamente; *decisão minha*). Respostas
  citam as fontes usadas e dizem quando a informação não está nelas.
- Botões: Quiz, Resumo, Exercício, Flashcards → reutilizam os modos do `NotebookService`
  (`QUIZ`, `SUMMARY`, `FLASHCARDS`, `QUESTION`/`LESSON`).
- Personalidade e nível do aluno entram na instrução enviada ao `AiProvider` (servidor). Exigente:
  direto, cobra resposta antes de dar a solução, nunca usa ironia ou humilhação.
- Cota: cada mensagem/geração consome 1 da cota diária; o cronômetro, o autosave e a navegação não
  consomem. Ao atingir a cota, o modo de estudo continua (cronômetro, quiz já gerado, flashcards) e o
  chat avisa quando volta.
- Celular: composer fixo acompanhando o teclado com a mesma técnica de Amigos
  (`useMobileWebChatViewport`); desktop: chat + painel lateral de fontes e progresso.

### Avaliações e adaptação

- Diagnóstico: 5 questões geradas na primeira sessão da matéria; define o nível inicial.
- Quiz/V-F/aberta/código/flashcards; simulados 30/45/60 min com `deadline_at` no servidor e autosave a
  cada resposta. Fechar a aba = `IN_PROGRESS` até o prazo (reconexão retoma); botão "Desistir" =
  `ABANDONED`, e o tutor responde com incentivo de acordo com a personalidade, oferecendo continuar
  ou reagendar.
- Resultado: nota, explicação por questão, tópicos a revisar, comparação com a tentativa anterior.
- `subject_mastery` muda de nível só com evidência (ex.: ≥ 2 simulados ≥ 80 % para Avançado; regras
  exatas ficam com quem implementa, documentadas no código).
- Sugestões de revisão (flashcards vencidos, tópicos fracos) aparecem como "Sugestão" no calendário e
  só viram `study_schedule` quando o aluno confirma.

### Início

- Logo abaixo da apresentação em vídeo (`EnturmaIntroExperience`), o bloco **Enturma Study** segue o
  mockup: calendário + próximos feriados, Próximas aulas, Agenda de hoje, Enturma AI Study (atalhos),
  Sessões de estudo (Iniciar/Reagendar), Ações rápidas, Minha evolução e Resumo do dia — tudo com dados
  reais; vazio vira convite ("Configure sua rotina").
- "Seu espaço de estudo" (StudyJourney) concluído encolhe para uma linha "Jornada concluída", mantendo
  "Guia do Enturma" e "Ver apresentação novamente".
- Animações com a biblioteca de movimento já usada (`playMotion`), respeitando movimento reduzido.

## Fases (cada uma vira um pedido de mudanças próprio)

1. **Agenda MVP:** V75 (rotina, séries, exceções, feriados, jobs), feriados nacionais+estaduais,
   calendário mensal/semanal no Início, painel do dia, "Minha rotina acadêmica", lembrete 2 h antes,
   StudyJourney compacto.
2. **Sessões de estudo:** `study_schedule`, lembrete com ações, cronômetro, página `/study/[id]`
   (sem IA ainda: objetivo, cronômetro, encerrar/reagendar).
3. **Tutor IA:** chat com Cadernos por matéria, anexos, personalidades, quiz/resumo/exercício.
4. **Avaliação adaptativa:** diagnóstico, simulados com relógio no servidor, níveis, sugestões de
   revisão, "Minha evolução".
5. **Refinamento:** 4 temas, celular/desktop, acessibilidade, LGPD, regressões.

## Critérios de aceite (resumo do anexo)

Calendário com feriados e cores + ícones + rótulos; aulas recorrentes editáveis por ocorrência/série;
lembrete de aula 2 h antes sem duplicidade após reinício; lembrete de estudo abre o modo certo; tutor
usa só contexto autorizado e cita fontes; 3 personalidades; diagnóstico e níveis; simulado com relógio
no servidor e distinção desistência/queda; métricas reais; LGPD exportar/excluir; sem regressões.

## Deixado para quem implementa

Layout fino de cada cartão dentro do visual Enturma; texto exato das mensagens do tutor por
personalidade; regras numéricas de nível documentadas no código; tamanho dos lotes do worker.

# Enturma Study — Fase 1 (Agenda) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calendário acadêmico no Início com feriados, aulas recorrentes, rotina acadêmica e lembrete de aula 2 h antes, sem duplicar.

**Architecture:** Novo pacote `br.com.enturma.planner` (rotina, séries de aula, exceções, feriados, calendário expandido, fila de lembretes no banco) exposto em `/api/v1/planner`. Web: componente `EnturmaStudy` no Início logo após `EnturmaIntroExperience`, com calendário mensal/semanal, painel do dia e diálogo "Minha rotina acadêmica". `StudyJourney` concluído vira uma linha compacta.

**Tech Stack:** Java 21 / Spring Boot / JdbcTemplate (`Db`) / Flyway / PostgreSQL 17; Next.js 16 / React / vitest / Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-enturma-study-design.md`

## Global Constraints

- Migração única aditiva `V75__enturma_study_agenda.sql`; nada existente é alterado além do CHECK de `notification_preference.category` (acrescenta `STUDY_REMINDER`).
- Fuso padrão `America/Sao_Paulo`; datas da API em ISO; ocorrências calculadas no fuso da rotina.
- Lembrete de aula padrão: 120 min antes (`class_reminder_minutes`, 0 desliga, máx. 1440).
- Feriado nunca cancela aula: só marca o dia e a ocorrência ganha `holiday: true`.
- Fila idempotente: chave única `(user_id, kind, source_id, occurrence_at)`; worker com `FOR UPDATE SKIP LOCKED` e `lease_until`.
- Aula no horário de silêncio: enviada antes do silêncio; nunca descartada.
- LGPD: toda tabela nova com `user_id` entra em `PersonalDataExport.SECTIONS` e na exclusão em `AccountPrivacyController`.
- Cores/ícones/rótulos: feriado vermelho, aula azul, estudo roxo, prova laranja, concluído verde — sempre com ícone e texto, nunca só cor. Funciona nos 4 temas e com movimento reduzido.
- Textos de UI em português do Brasil.

## Review Focus

1. Série com `valid_until` antes de `valid_from`, ou fim antes do início → 400 com mensagem clara (teste na Task 3).
2. Aula cancelada ou movida depois de o job já existir → o job antigo vira `CANCELLED` e não é enviado (teste na Task 4).
3. Rotina sem cidade/UF (aluno sem campus verificado) → calendário mostra só nacionais, sem erro (teste na Task 2).
4. Intervalo `from/to` maior que 62 dias ou invertido → 400 (teste na Task 3).
5. Dois workers pegando o mesmo job (reinício no meio do envio) → uma notificação só (teste na Task 4).

---

### Task 1: Migração V75 e LGPD

**Files:**
- Create: `services/api/src/main/resources/db/migration/V75__enturma_study_agenda.sql`
- Modify: `services/api/src/main/java/br/com/enturma/auth/PersonalDataExport.java` (SECTIONS)
- Modify: `services/api/src/main/java/br/com/enturma/auth/AccountPrivacyController.java` (exclusão)
- Test: `services/api/src/test/java/br/com/enturma/PlannerIntegrationTest.java`

**Interfaces:**
- Produces tabelas: `academic_routine(user_id PK, timezone, default_start time, default_end time, weekdays smallint, semester_start date, semester_end date, class_reminder_minutes int, quiet_start time, quiet_end time, tutor_personality varchar(12), state varchar(2), city varchar(150), updated_at)`; `academic_class_schedule(id, user_id, subject_id → academic_entry, weekday smallint 1..7 ISO, starts_at time, ends_at time, valid_from date, valid_until date null, room varchar(120), version int, created_at)`; `academic_class_exception(id, schedule_id ON DELETE CASCADE, user_id, occurs_on date, kind CANCELLED|MOVED|EXTRA, moved_to timestamptz null, minutes int null, note varchar(300), UNIQUE(schedule_id, occurs_on, kind))`; `calendar_holiday(id, user_id, date, name varchar(120), scope CITY|OPTIONAL, UNIQUE(user_id,date,name))`; `academic_reminder_job(id, user_id, kind CLASS|STUDY|EXAM|REVIEW, source_id uuid, occurrence_at timestamptz, fire_at timestamptz, status PENDING|SENT|CANCELLED, attempts int, lease_until timestamptz, sent_at, UNIQUE(user_id,kind,source_id,occurrence_at))` + índice parcial `(fire_at) WHERE status='PENDING'`.
- Produces seções de exportação: `study-routine`, `study-classes`, `study-class-exceptions`, `study-holidays`, `study-reminders`, `study-tasks` (`campus_task`), `study-focus` (`focus_session`).

- [ ] **Step 1: Teste** `exportAndDeletionCoverStudyTables`: insere uma linha em cada tabela nova para o aluno `a`, chama a exportação e verifica que as 7 seções acima existem e trazem a linha; executa a exclusão imediata e verifica `count(*)=0` em cada tabela para `a`.
- [ ] **Step 2:** `mvn -q test -Dtest=PlannerIntegrationTest` → FAIL (tabela inexistente).
- [ ] **Step 3:** Escrever V75 (tabelas, CHECKs, índices, RLS default-deny como em V69, CHECK de categoria com `STUDY_REMINDER`) e atualizar exportação/exclusão (excluir jobs, exceções, séries, feriados, rotina antes de `app_user`).
- [ ] **Step 4:** Teste PASS.
- [ ] **Step 5:** Commit `feat(study): agenda tables and LGPD coverage`.

### Task 2: Feriados

**Files:**
- Create: `services/api/src/main/java/br/com/enturma/planner/BrazilHolidays.java`
- Test: `services/api/src/test/java/br/com/enturma/planner/BrazilHolidaysTest.java`

**Interfaces:**
- Produces: `record Holiday(LocalDate date, String name, String scope /* NATIONAL|STATE|OPTIONAL */)`; `static List<Holiday> BrazilHolidays.between(LocalDate from, LocalDate to, String state)` — `state` pode ser nulo.

- [ ] **Step 1: Testes:** `easterBasedDates2026` — 2026: Sexta-feira Santa `2026-04-03` NATIONAL, Carnaval `2026-02-16` e `2026-02-17` OPTIONAL, Corpus Christi `2026-06-04` OPTIONAL; `fixedNational2026` — contém 01/01, 21/04 Tiradentes, 01/05, 07/09, 12/10, 02/11, 15/11, 20/11 Consciência Negra, 25/12; `stateHolidaysOnlyForThatState` — `between(2026-07-01,2026-07-31,"SP")` contém 09/07 "Revolução Constitucionalista" STATE e com `"MG"` não contém; `nullStateIsNationalOnly`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar. Páscoa pelo algoritmo de Meeus/Butcher. Feriados estaduais dos 27 UFs como tabela `Map<String, List<(MonthDay,String)>>` no próprio arquivo, cada entrada com comentário da lei; pesquisar e conferir a lista oficial no momento da implementação (fonte primária: leis estaduais / sites dos governos).
- [ ] **Step 4:** PASS. **Step 5:** Commit `feat(study): Brazilian national and state holidays`.

### Task 3: Rotina, aulas recorrentes e calendário

**Files:**
- Create: `services/api/src/main/java/br/com/enturma/planner/PlannerService.java`, `PlannerController.java`
- Test: `PlannerIntegrationTest.java`

**Interfaces:**
- Consumes: `BrazilHolidays.between`.
- Produces (REST `/api/v1/planner`):
  - `GET /routine` → rotina (cria padrão na 1ª leitura: horário do turno `MORNING 08:00–12:00`, `AFTERNOON 13:30–17:30`, `EVENING 19:00–22:30`, outros `08:00–12:00`; dias seg–sex; UF/cidade do campus verificado ou da instituição). `PUT /routine` com os mesmos campos.
  - `POST /classes` `{subjectId, weekdays:[1..7], startsAt:"HH:mm", endsAt, validFrom, validUntil?, room?}` → cria uma série por dia da semana; matéria precisa estar em `user_subject`. `PUT /classes/{id}` (edita a série, `version` otimista), `DELETE /classes/{id}`.
  - `POST /classes/{id}/exceptions` `{occursOn, kind, movedTo?, minutes?, note?}`; `DELETE /classes/{id}/exceptions/{exceptionId}`.
  - `POST /holidays` `{date, name, scope}`; `DELETE /holidays/{id}`.
  - `POST /tasks` `{kind: EXAM|ASSIGNMENT|EVENT, title, subjectId?, dueAt, minutes}` → `campus_task`; `PUT /tasks/{id}`, `DELETE /tasks/{id}`.
  - `GET /calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` → `{timezone, holidays:[{date,name,scope,custom,id?}], events:[{id, kind:"CLASS"|"EXAM"|"ASSIGNMENT"|"STUDY"|"REMINDER", title, subjectId?, startsAt, endsAt, scheduleId?, occursOn?, status:"SCHEDULED"|"CANCELLED"|"MOVED"|"EXTRA"|"DONE", holiday:boolean}]}`; inclui `campus_task` do período.
- `PlannerService.occurrences(UUID user, LocalDate from, LocalDate to)` → `List<Map<String,Object>>` (usado pela Task 4).

- [ ] **Step 1: Testes:** `routineDefaultsFollowShiftAndCampus`; `weeklyClassExpandsAcrossRange` (série seg 19:00–22:30 de 2026-03-02 a 2026-03-30 → 5 ocorrências em março); `cancelledOccurrenceIsMarkedAndMovedOneAppearsAtNewTime`; `holidayMarksButDoesNotCancel` (aula em 2026-04-21 vem com `holiday:true` e `status:"SCHEDULED"`); `invalidSeriesAndRangesAreRejected` (fim ≤ início, `validUntil<validFrom`, `to<from`, intervalo > 62 dias → `ApiException` 400); `subjectMustBelongToStudent`; `studentWithoutCampusGetsNationalHolidaysOnly`; `otherStudentCannotTouchMyClasses` (404).
- [ ] **Step 2:** FAIL. **Step 3:** Implementar (todas as escritas validam dono; expansão no fuso da rotina). **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(study): academic routine, recurring classes and calendar API`.

### Task 4: Lembretes de aula

**Files:**
- Create: `services/api/src/main/java/br/com/enturma/planner/PlannerReminders.java`
- Modify: `notifications/NotificationPreferences.java` (CATEGORIES + `category()` mapeia `kind` `STUDY_REMINDER`), `PlannerService` (chama `PlannerReminders.reschedule(user)` em toda escrita, na mesma transação)
- Modify: `apps/web/src/components/community-feedback.tsx` (rótulo `STUDY_REMINDER: "Lembretes de estudo"`)
- Test: `PlannerIntegrationTest.java`

**Interfaces:**
- Consumes: `PlannerService.occurrences`, `NotificationService.send(null, user, "STUDY_REMINDER", "study:class", jobId, href, message)`.
- Produces: `void reschedule(UUID user)` — gera jobs CLASS para ocorrências nos próximos 14 dias com `fire_at = início − class_reminder_minutes` (ajustado ao silêncio), cancela jobs PENDING cujo par (source, occurrence) não existe mais; `int deliverDue()` — `@Scheduled(fixedDelay = 30000)`, lote 50, `lease_until = now()+2 min`, marca SENT; `@Scheduled(cron = "0 15 3 * * *", zone = "America/Sao_Paulo") extendWindow()` chama `reschedule` para quem tem séries.
- Mensagem: `"Sua aula de {matéria} começa às {HH:mm}."`, `href = "/home?day=YYYY-MM-DD#enturma-study"`.

- [ ] **Step 1: Testes:** `classReminderFiresTwoHoursBefore` (aula 19:00 → `fire_at` 17:00 local); `rescheduleIsIdempotent` (chamar 3× → 1 job por ocorrência); `cancelledOrMovedClassCancelsOldJob`; `concurrentDeliverySendsOnce` (dois `deliverDue()` em threads → 1 linha em `notification` com o dedupe do job); `quietHoursSendClassReminderBeforeSilence` (silêncio 16:00–18:00, aula 19:00 → `fire_at` 15:59); `zeroMinutesDisablesClassReminders`.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS (e `SocialIntegrationTest` + `PlatformIntegrationTest` continuam verdes).
- [ ] **Step 5:** Commit `feat(study): class reminders with an idempotent queue`.

### Task 5: Enturma Study no Início (web)

**Files:**
- Create: `apps/web/src/components/study/enturma-study.tsx` (bloco), `study-calendar.tsx` (mês/semana), `study-day-panel.tsx` (painel do dia), `study-routine-dialog.tsx` ("Minha rotina acadêmica"), `apps/web/src/lib/planner.ts` (tipos + chamadas), `apps/web/src/app/enturma-study.css`
- Modify: `apps/web/src/components/dashboard.tsx` (renderiza `<EnturmaStudy profile={profile} />` logo após `<EnturmaIntroExperience …/>`), `apps/web/src/app/layout.tsx` ou o CSS raiz que importa as folhas (importar `enturma-study.css`)
- Test: `apps/web/src/components/study/enturma-study.test.tsx`, `study-calendar.test.tsx`

**Interfaces:**
- Consumes: API da Task 3; `profile.subjects` (`@enturma/contracts`).
- Produces: `buildMonthGrid(year: number, month: number): { date: string; inMonth: boolean }[]` (6×7, começa no domingo); `EnturmaStudy({ profile })`.
- Layout (mockup do Luiz): cabeçalho "Seu estudo, sua rotina, tudo em um só lugar."; cartão **Calendário acadêmico** (mês, ‹ ›, Hoje, alternar Mês/Semana, legenda Aula/Estudo/Feriado, "Próximos feriados"); **Próximas aulas** (3 próximas) com o aviso "O Enturma vai te notificar 2 horas antes de cada aula." (usa o valor real da rotina); **Agenda de hoje**. Sem rotina/aulas: convite "Configure sua rotina" que abre o diálogo.
- Painel do dia (abre ao tocar no dia): lista do dia + ações Adicionar aula, Adicionar prova/trabalho (`POST /planner/tasks`), Lembrete, Marcar feriado da cidade; em cada aula: Cancelar esta, Mover esta, Editar série, Excluir série.
- Dia com feriado: número em vermelho + ícone + nome no painel; aula do dia mostra "Feriado — confirme se haverá aula".

- [ ] **Step 1: Testes:** `buildMonthGrid(2026, 3)` (abril, mês base 0) → 42 células, a primeira `2026-03-29` com `inMonth:false` e `2026-04-01` com `inMonth:true`; `marca feriado em vermelho com nome acessível` (dia 21 tem `aria-label` contendo "Tiradentes" e classe `is-holiday`); `abre o painel do dia ao tocar e mostra as aulas`; `sem aulas mostra o convite para configurar a rotina`; `próximas aulas citam o aviso com os minutos da rotina` (rotina 60 → "1 hora antes").
- [ ] **Step 2:** FAIL. **Step 3:** Implementar (animações com `playMotion`, `prefers-reduced-motion` respeitado; cores por tokens `--success`, `--danger` e azul/roxo/laranja definidos no CSS por tema com contraste AA). **Step 4:** PASS + `npx tsc --noEmit` + lint sem erros.
- [ ] **Step 5:** Commit `feat(study): Enturma Study calendar on the home page`.

### Task 6: "Seu espaço de estudo" compacto quando concluído

**Files:**
- Modify: `apps/web/src/components/study-journey.tsx` (+ CSS existente)
- Test: `apps/web/src/components/study-journey.test.tsx`

- [ ] **Step 1: Teste** `com 3 de 3 concluídos mostra só a linha concluída, o Guia e a apresentação`: não renderiza a lista de etapas nem a barra; mostra "Jornada concluída", link "Guia do Enturma" e botão "Ver apresentação novamente"; com 2 de 3 mantém o layout atual.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS. **Step 5:** Commit `feat(study): compact study journey once completed`.

### Task 7: E2E e verificação visual

**Files:**
- Create: `apps/web/e2e/enturma-study.spec.ts`

- [ ] **Step 1:** Cenário: aluno com matéria salva abre o Início → configura rotina → adiciona aula seg/qua 19:00 → vê a aula no calendário e em "Próximas aulas" → cancela uma ocorrência → ela aparece riscada como cancelada; dia 21/04 aparece como feriado.
- [ ] **Step 2:** Rodar `npx playwright test e2e/enturma-study.spec.ts` contra a API local → PASS.
- [ ] **Step 3:** Conferir no navegador, em 1440×900 e 375×812, os temas Claro, Escuro, Enturma e Sistema: contraste dos rótulos, feriado legível, nada cortado.
- [ ] **Step 4:** Commit `test(study): end-to-end agenda flow`.

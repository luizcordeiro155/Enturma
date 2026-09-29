package br.com.enturma;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import br.com.enturma.academics.*;
import br.com.enturma.auth.*;
import br.com.enturma.chat.*;
import br.com.enturma.common.*;
import br.com.enturma.rides.*;
import br.com.enturma.study.*;
import br.com.enturma.users.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PlatformIntegrationTest {
  @org.springframework.test.context.bean.override.mockito.MockitoBean
  br.com.enturma.ai.AiProvider aiProvider;

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  br.com.enturma.materials.ObjectStorageService storage;

  @Autowired br.com.enturma.materials.MaterialService materials;
  @Autowired br.com.enturma.ai.AiService ai;

  @Test
  void materialAndAiAccessAreIsolatedByRoom() {
    org.mockito.Mockito.when(storage.enabled()).thenReturn(true);
    org.mockito.Mockito.when(aiProvider.enabled()).thenReturn(true);
    org.mockito.Mockito.when(
            aiProvider.answer(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(false)))
        .thenReturn(
            new br.com.enturma.ai.AiProvider.Answer("Resposta de teste [1]", java.util.List.of()));
    UUID id = room(8);
    materials.upload(
        host,
        id,
        "aula.txt",
        "Transações preservam a consistência do banco de dados."
            .getBytes(java.nio.charset.StandardCharsets.UTF_8));
    assertThatThrownBy(() -> materials.list(outsider, id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> ai.ask(outsider, id, "transações", "QUESTION"))
        .isInstanceOf(ApiException.class);
    var result = (Map<?, ?>) ai.ask(host, id, "transações", "QUESTION");
    assertThat((List<?>) result.get("sources")).hasSize(1);
    study.end(host, id);
    UUID another = (UUID) study.study(outsider, subject, null, "Outra sessão", 50, 8).get("id");
    var empty = (Map<?, ?>) ai.ask(outsider, another, "transações", "QUESTION");
    assertThat((List<?>) empty.get("sources")).isEmpty();
    org.mockito.Mockito.verify(aiProvider, org.mockito.Mockito.times(1))
        .answer(
            org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.anyString(),
            org.mockito.ArgumentMatchers.eq(false));
  }

  @Autowired br.com.enturma.ai.NotebookService notebooks;
  @Autowired br.com.enturma.learning.DailyMissionsController missions;

  @Test
  void notebooksPersistCitationsAndIsolateOwners() {
    org.mockito.Mockito.when(aiProvider.enabled()).thenReturn(true);
    org.mockito.Mockito.when(
            aiProvider.answer(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(false)))
        .thenReturn(
            new br.com.enturma.ai.AiProvider.Answer(
                "## Aula\nTransações agrupam operações [1].", List.of(), "test-model", 100L, 50L));
    UUID notebook = (UUID) ((Map<?, ?>) notebooks.create(host, "Banco de dados")).get("id");
    UUID source =
        (UUID)
            ((Map<?, ?>)
                    notebooks.add(
                        host,
                        notebook,
                        "Minha aula",
                        "TEXT",
                        "Transações agrupam operações em uma unidade consistente e atômica.",
                        null,
                        null))
                .get("id");
    assertThatThrownBy(() -> notebooks.detail(outsider, notebook)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> notebooks.removeSource(outsider, notebook, source))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () ->
                notebooks.generate(
                    host,
                    notebook,
                    UUID.randomUUID(),
                    "Explique",
                    "LESSON",
                    "BEGINNER",
                    List.of(UUID.randomUUID())))
        .isInstanceOf(ApiException.class);
    UUID generation = UUID.randomUUID();
    notebooks.generate(
        host, notebook, generation, "Explique transações", "LESSON", "BEGINNER", List.of(source));
    notebooks.generate(
        host, notebook, generation, "Explique transações", "LESSON", "BEGINNER", List.of(source));
    org.awaitility.Awaitility.await()
        .atMost(java.time.Duration.ofSeconds(15))
        .until(
            () ->
                "READY"
                    .equals(
                        db.one("SELECT status FROM notebook_generation WHERE id=?", generation)
                            .get("status")));
    var saved = db.one("SELECT * FROM notebook_generation WHERE id=?", generation);
    assertThat(saved.get("answer")).asString().contains("[1]");
    assertThat(saved.get("model")).isEqualTo("test-model");
    assertThat(
            ((com.fasterxml.jackson.databind.JsonNode) saved.get("citations"))
                .get(0)
                .path("id")
                .asText())
        .isEqualTo(source.toString());
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM notebook_generation WHERE id=?", Integer.class, generation))
        .isEqualTo(1);
    notebooks.removeSource(host, notebook, source);
    assertThat(
            db.one("SELECT citations FROM notebook_generation WHERE id=?", generation)
                .get("citations")
                .toString())
        .contains("Transações");
    notebooks.delete(host, notebook);
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM notebook_generation WHERE id=?)", generation))
        .isFalse();
  }

  @Test
  void missionsHaveFivePerGameHideAnswersAndPersistAcrossDays() {
    db.jdbc.update(
        "UPDATE academic_entry SET attributes=attributes||'{\"learningArea\":\"IT\"}'::jsonb WHERE"
            + " id=?",
        subject);
    var day = (Map<?, ?>) missions.daily(host);
    String date = (String) day.get("date");
    var all = (List<Map<String, Object>>) day.get("missions");
    assertThat(all).hasSize(20);
    for (String game : List.of("words", "binary", "trace", "algorithm"))
      assertThat(all.stream().filter(m -> m.get("game").equals(game))).hasSize(5);
    for (var m : all) {
      var d = (com.fasterxml.jackson.databind.JsonNode) m.get("definition");
      assertThat(d.has("word")).isFalse();
      assertThat(d.has("answer")).isFalse();
      assertThat(d.has("seed")).isFalse();
    }
    assertThatThrownBy(
            () ->
                missions.attempt(
                    host,
                    new br.com.enturma.learning.DailyMissionsController.Attempt(
                        date, "words", 2, "CACHE")))
        .isInstanceOf(ApiException.class);
    for (int slot = 1; slot <= 5; slot++) {
      var d =
          (com.fasterxml.jackson.databind.JsonNode)
              db.one(
                      "SELECT definition FROM learning_mission WHERE user_id=? AND game='words' AND"
                          + " slot=? AND mission_date=?::date",
                      host.id(),
                      slot,
                      date)
                  .get("definition");
      String word = d.path("word").asText();
      var wrong =
          (Map<?, ?>)
              missions.attempt(
                  host,
                  new br.com.enturma.learning.DailyMissionsController.Attempt(
                      date, "words", slot, "Z".repeat(word.length())));
      assertThat(wrong.get("completed")).isEqualTo(false);
      var result =
          (Map<?, ?>)
              missions.attempt(
                  host,
                  new br.com.enturma.learning.DailyMissionsController.Attempt(
                      date, "words", slot, word.toLowerCase()));
      assertThat(result.get("won")).isEqualTo(true);
      assertThat(result.containsKey("answer")).isFalse();
      assertThat(result.containsKey("answers")).isFalse();
    }
    assertThatThrownBy(
            () ->
                missions.attempt(
                    host,
                    new br.com.enturma.learning.DailyMissionsController.Attempt(
                        date, "words", 1, "CACHE")))
        .isInstanceOf(ApiException.class);
    var yesterday = java.time.LocalDate.parse(date).minusDays(1);
    db.jdbc.update(
        "UPDATE learning_mission SET mission_date=? WHERE user_id=?", yesterday, host.id());
    db.jdbc.update(
        "UPDATE learning_mission_start SET started_on=? WHERE user_id=?", yesterday, host.id());
    var next = (Map<?, ?>) missions.daily(host);
    assertThat(next.get("difficulty")).isEqualTo(2);
    assertThatThrownBy(
            () ->
                missions.attempt(
                    host,
                    new br.com.enturma.learning.DailyMissionsController.Attempt(
                        yesterday.toString(), "words", 1, "CACHE")))
        .isInstanceOf(ApiException.class);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM learning_mission WHERE user_id=? AND mission_date=? AND"
                    + " completed",
                Integer.class,
                host.id(),
                yesterday))
        .isEqualTo(5);
  }

  @Test
  void unicodeUsernamesAreAcceptedAndNormalized() {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    String username = "Cleita\u0303o_" + suffix;
    var credentials =
        auth.register(
            "Cleitão",
            username,
            "unicode" + suffix + "@example.test",
            "test-password-long",
            "Test");
    assertThat(
            db.one("SELECT username FROM app_user WHERE id=?", credentials.userId())
                .get("username"))
        .isEqualTo("cleitão_" + suffix);
    assertThatThrownBy(
            () ->
                auth.register(
                    "Outro",
                    "CLEITÃO_" + suffix,
                    "other" + suffix + "@example.test",
                    "test-password-long",
                    "Test"))
        .isInstanceOf(ApiException.class);
    assertThat(AuthService.normalizeUsername("Clton_junin")).isEqualTo("clton_junin");
  }

  @Autowired AuthService auth;
  @Autowired CatalogService catalog;
  @Autowired ProfileService profiles;
  @Autowired StudyService study;
  @Autowired ChatService chat;
  @Autowired RideService rides;
  @Autowired Db db;
  @Autowired MockMvc mvc;
  @Autowired CatalogImports imports;
  @Autowired java.util.List<br.com.enturma.academics.provider.AcademicCatalogProvider> providers;
  @Autowired br.com.enturma.learning.LearningController learning;

  @Autowired br.com.enturma.learning.AdvancedLearningController advanced;

  @Test
  void wordModesHavePlayablePoolsAndAttemptsAreAuthoritative() {
    db.jdbc.update(
        "UPDATE academic_entry SET attributes=attributes||'{\"learningArea\":\"IT\"}'::jsonb WHERE"
            + " id=?",
        subject);
    for (int difficulty = 1; difficulty <= 5; difficulty++)
      for (String mode : List.of("SOLO", "DUET", "QUARTET")) {
        var c = (Map<?, ?>) advanced.wordChallenge(host, mode, difficulty, false);
        assertThat((Number) c.get("wordLength")).isNotNull();
        String key = (String) c.get("challengeKey");
        assertThatThrownBy(
                () ->
                    advanced.wordAttempt(
                        outsider,
                        new br.com.enturma.learning.AdvancedLearningController.WordAttempt(
                            key, mode, 1, "CACHE", List.of(), 1, false, 0)))
            .isInstanceOf(ApiException.class);
      }
    var c = (Map<?, ?>) advanced.wordChallenge(host, "SOLO", 1, true);
    var again = (Map<?, ?>) advanced.wordChallenge(host, "SOLO", 1, true);
    assertThat(c.get("challengeKey")).isEqualTo(again.get("challengeKey"));
    var words = List.of("JAVA", "CACHE", "PYTHON");
    String guess =
        words.stream()
            .filter(w -> w.length() == ((Number) c.get("wordLength")).intValue())
            .findFirst()
            .orElse("RETURN");
    var r =
        (Map<?, ?>)
            advanced.wordAttempt(
                host,
                new br.com.enturma.learning.AdvancedLearningController.WordAttempt(
                    (String) c.get("challengeKey"),
                    "SOLO",
                    1,
                    guess,
                    List.of("CACHE", "JAVA", "PYTHON"),
                    19,
                    true,
                    0));
    assertThat(r.get("attempt")).isEqualTo(1);
    assertThatThrownBy(
            () ->
                advanced.wordAttempt(
                    host,
                    new br.com.enturma.learning.AdvancedLearningController.WordAttempt(
                        (String) c.get("challengeKey"), "SOLO", 1, guess, List.of(), 1, true, 0)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void incrementalMemoryKeepsHistoryOnProviderFailureAndGeneratesAfterRecovery() {
    UUID id = room(8);
    chat.send(host, id, "Conceito importante para preservar", null);
    study.end(host, id);
    org.mockito.Mockito.when(aiProvider.enabled()).thenReturn(true);
    org.mockito.Mockito.when(
            aiProvider.answer(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(false)))
        .thenThrow(new IllegalStateException("offline"));
    ai.finalizeEndedSessions();
    assertThat((List<?>) chat.messages(host, id, 0)).hasSize(1);
    org.mockito.Mockito.reset(aiProvider);
    org.mockito.Mockito.when(aiProvider.enabled()).thenReturn(true);
    org.mockito.Mockito.when(
            aiProvider.answer(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(false)))
        .thenReturn(new br.com.enturma.ai.AiProvider.Answer("Resumo preservado", List.of()));
    for (int i = 0; i < 4; i++) ai.finalizeEndedSessions();
    assertThat(
            db.exists(
                "SELECT EXISTS(SELECT 1 FROM room_memory_checkpoint WHERE room_id=? AND"
                    + " through_message_id IS NOT NULL)",
                id))
        .isTrue();
    assertThat((List<?>) chat.messages(host, id, 0)).hasSize(1);
  }

  @Autowired br.com.enturma.users.SocialController social;

  @Test
  void friendshipsRequireAcceptanceAndPrivateMessagesStayCiphertext() throws Exception {
    String username =
        (String) db.one("SELECT username FROM app_user WHERE id=?", member.id()).get("username");
    var invitation =
        (Map<?, ?>) social.invite(host, new br.com.enturma.users.SocialController.Invite(username));
    UUID id = (UUID) invitation.get("id");
    assertThatThrownBy(() -> social.messages(host, id, 0)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> social.accept(host, id)).isInstanceOf(ApiException.class);
    social.accept(member, id);
    var key =
        new br.com.enturma.users.SocialController.PublicKey(
            "EC", "P-256", "a".repeat(43), "b".repeat(43));
    social.identity(host, key);
    var envelope =
        new br.com.enturma.users.SocialController.Envelope(
            UUID.randomUUID(), "Y2lwaGVydGV4dA==", "abcdefghijklmnop");
    social.send(host, id, envelope);
    social.send(host, id, envelope);
    assertThat((List<?>) social.messages(member, id, 0)).hasSize(1);
    assertThat(
            db.one("SELECT ciphertext FROM private_message WHERE friendship_id=?", id)
                .get("ciphertext"))
        .isEqualTo(envelope.ciphertext());
    assertThatThrownBy(() -> social.messages(outsider, id, 0)).isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () ->
                social.identity(
                    host,
                    new br.com.enturma.users.SocialController.PublicKey(
                        "EC", "P-256", "c".repeat(43), "b".repeat(43))))
        .isInstanceOf(ApiException.class);
    assertThat(((Map<?, ?>) social.profile(member, host.id())).containsKey("email")).isFalse();
    db.jdbc.update(
        "INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", member.id(), host.id());
    assertThatThrownBy(() -> social.messages(host, id, 0)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> social.profile(host, member.id())).isInstanceOf(ApiException.class);
  }

  @Test
  void officialCatalogImportsAreCompleteAndIdempotent() {
    for (int i = 0; i < 40; i++) imports.processBatch();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM academic_import_item WHERE status='FAILED' AND job_id"
                    + " IN(SELECT id FROM academic_import_job WHERE seed_key IS NOT NULL)",
                Integer.class))
        .isZero();
    var institutions = catalog.list("INSTITUTION", null, "una", 0, false);
    assertThat(institutions).anyMatch(r -> r.get("name").equals("Centro Universitário UNA"));
    var una =
        providers.stream().filter(p -> p.providerCode().equals("UNA")).findFirst().orElseThrow();
    long before =
        db.jdbc.queryForObject(
            "SELECT count(*) FROM academic_entry WHERE provider='UNA'", Long.class);
    UUID job = imports.submit(admin, una.importCurriculum(), "idempotency-test");
    for (int i = 0; i < 20; i++) imports.processBatch();
    assertThat(db.one("SELECT status FROM academic_import_job WHERE id=?", job).get("status"))
        .isEqualTo("COMPLETED");
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM academic_entry WHERE provider='UNA'", Long.class))
        .isEqualTo(before);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM academic_entry WHERE provider='UNA' AND kind='SUBJECT' AND"
                    + " normalized_name LIKE '%matematica computacional aplicada%'",
                Integer.class))
        .isGreaterThanOrEqualTo(3);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM academic_entry WHERE provider='UNA' AND kind='CURRICULUM'",
                Integer.class))
        .isEqualTo(18);
  }

  @Test
  @org.springframework.transaction.annotation.Transactional
  void importReviewAndPausePreservePublishedRecords() {
    var mapper =
        com.fasterxml.jackson.databind.json.JsonMapper.builder().findAndAddModules().build();
    String provider = "TEST" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
    var src =
        new CatalogRecord.Source(
            "https://example.test/catalog",
            "Fixture exclusiva de testes",
            "JSON_IMPORT",
            "a".repeat(64),
            Instant.now().minusSeconds(20),
            Instant.now().minusSeconds(10));
    var first =
        new CatalogRecord(
            "institution",
            "INSTITUTION",
            null,
            "Fixture de importação",
            null,
            null,
            null,
            "VERIFIED",
            src,
            mapper.createObjectNode());
    UUID job =
        imports.submit(
            admin, new CatalogRecord.Document(provider, List.of(first)), "test-workflow");
    imports.control(admin, job, "pause");
    imports.processBatch();
    assertThat(db.one("SELECT status FROM academic_import_job WHERE id=?", job).get("status"))
        .isEqualTo("PAUSED");
    imports.control(admin, job, "resume");
    for (int i = 0; i < 10; i++) imports.processBatch();
    UUID entity = CatalogImports.identity(provider, "INSTITUTION", "institution");
    assertThat(db.one("SELECT name FROM academic_entry WHERE id=?", entity).get("name"))
        .isEqualTo(first.name());
    var changed =
        new CatalogRecord(
            first.externalId(),
            first.kind(),
            null,
            "Fixture corrigida",
            null,
            null,
            null,
            "VERIFIED",
            src,
            mapper.createObjectNode());
    UUID update =
        imports.submit(
            admin, new CatalogRecord.Document(provider, List.of(changed)), "test-review");
    for (int i = 0; i < 10; i++) imports.processBatch();
    var pending = db.one("SELECT id,status FROM academic_import_item WHERE job_id=?", update);
    assertThat(pending.get("status")).isEqualTo("PENDING_VERIFICATION");
    assertThat(db.one("SELECT name FROM academic_entry WHERE id=?", entity).get("name"))
        .isEqualTo(first.name());
    imports.review(admin, (UUID) pending.get("id"), "approve", changed);
    assertThat(db.one("SELECT name FROM academic_entry WHERE id=?", entity).get("name"))
        .isEqualTo("Fixture corrigida");
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM academic_catalog_audit WHERE entity_id=?",
                Integer.class,
                entity))
        .isEqualTo(2);
  }

  @Test
  void learningRequiresAcademicEligibilityAndSavesProgress() {
    assertThat(learning.eligible(host)).isFalse();
    assertThatThrownBy(
            () ->
                learning.attempt(
                    host,
                    new br.com.enturma.learning.LearningController.Attempt("binary", 1, "101")))
        .isInstanceOf(ApiException.class);
    db.jdbc.update(
        "UPDATE academic_entry SET attributes=attributes||'{\"learningArea\":\"IT\"}'::jsonb WHERE"
            + " id=?",
        subject);
    assertThat(learning.eligible(host)).isTrue();
    learning.attempt(
        host, new br.com.enturma.learning.LearningController.Attempt("binary", 1, "101"));
    learning.attempt(
        host, new br.com.enturma.learning.LearningController.Attempt("binary", 1, "111"));
    var saved =
        db.one("SELECT completed,attempts FROM learning_progress WHERE user_id=?", host.id());
    assertThat(saved.get("completed")).isEqualTo(true);
    assertThat(saved.get("attempts")).isEqualTo(2);
  }

  @Test
  void publicCatalogueAndAdminBoundaries() throws Exception {
    mvc.perform(get("/api/v1/catalog/institutions?search=UNA")).andExpect(status().isOk());
    mvc.perform(
            get("/api/v1/admin/catalog/imports")
                .header("Authorization", "Bearer " + hostCredentials.accessToken()))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/catalog/requests").contentType("application/json").content("{}"))
        .andExpect(status().isUnauthorized());
    assertThat(
            db.one("SELECT subject_id FROM academic_curriculum_subject WHERE id=?", subject)
                .get("subjectId"))
        .isEqualTo(subject);
  }

  Actor host, member, outsider, admin;
  UUID subject, period, campus;
  AuthService.Credentials hostCredentials;

  @BeforeEach
  void setup() {
    String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    hostCredentials =
        auth.register(
            "Estudante de teste",
            "host_" + suffix,
            "host" + suffix + "@example.test",
            "test-password-long",
            "JUnit");
    host = auth.authenticate(hostCredentials.accessToken()).orElseThrow();
    member = create("member" + suffix);
    outsider = create("outsider" + suffix);
    admin = new Actor(host.id(), host.sessionId(), "ADMIN");
    UUID parent = null;
    List<CatalogService.Entry> entries = new ArrayList<>();
    for (String kind :
        List.of("INSTITUTION", "CAMPUS", "COURSE", "CURRICULUM", "PERIOD", "SUBJECT")) {
      UUID id = UUID.randomUUID();
      entries.add(
          new CatalogService.Entry(
              id,
              kind,
              parent,
              "TESTE SINTÉTICO — " + kind,
              null,
              kind.equals("CURRICULUM") ? "test-v1" : null,
              kind.equals("PERIOD") ? 1 : null,
              "https://example.test/catalog",
              "Fixture exclusiva de testes",
              Instant.now().minusSeconds(10),
              LocalDate.now().minusDays(1),
              null,
              "VERIFIED"));
      if (kind.equals("SUBJECT")) subject = id;
      if (kind.equals("PERIOD")) period = id;
      if (kind.equals("CAMPUS")) campus = id;
      parent = id;
    }
    catalog.importEntries(admin, entries);
    for (Actor a : List.of(host, member, outsider))
      profiles.enroll(a, period, List.of(subject), "EVENING", "");
  }

  Actor create(String username) {
    var c =
        auth.register("Teste", username, username + "@example.test", "test-password-long", "JUnit");
    return auth.authenticate(c.accessToken()).orElseThrow();
  }

  UUID room(int capacity) {
    return (UUID) study.study(host, subject, null, "Sessão de teste", 50, capacity).get("id");
  }

  @Test
  void refreshRotationDetectsReuseAndRevokesFamily() {
    var next = auth.refresh(hostCredentials.refreshToken());
    assertThat(auth.authenticate(hostCredentials.accessToken())).isEmpty();
    assertThat(auth.authenticate(next.accessToken())).isPresent();
    assertThatThrownBy(() -> auth.refresh(hostCredentials.refreshToken()))
        .isInstanceOf(ApiException.class);
    assertThat(auth.authenticate(next.accessToken())).isEmpty();
  }

  @Test
  void concurrentCreationReusesRoom() throws Exception {
    try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
      var gate = new CountDownLatch(1);
      var a =
          pool.submit(
              () -> {
                gate.await();
                return study.study(host, subject, null, "A", 50, 8);
              });
      var b =
          pool.submit(
              () -> {
                gate.await();
                return study.study(member, subject, null, "B", 50, 8);
              });
      gate.countDown();
      assertThat(a.get(10, TimeUnit.SECONDS).get("id"))
          .isEqualTo(b.get(10, TimeUnit.SECONDS).get("id"));
    }
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM study_room WHERE subject_id=?", Long.class, subject))
        .isEqualTo(1);
  }

  @Test
  void capacityAndMessageMembershipAreEnforced() {
    UUID id = room(2);
    study.join(member, id);
    assertThatThrownBy(() -> study.join(outsider, id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> chat.messages(outsider, id, 0)).isInstanceOf(ApiException.class);
    chat.send(member, id, "Olá", null);
    var history = (List<?>) chat.messages(host, id, 0);
    assertThat(history).hasSize(1);
  }

  @Test
  void historySurvivesEndingAndDeletionKeepsValidTombstone() {
    UUID id = room(8);
    study.join(member, id);
    var sent = (Map<?, ?>) chat.send(host, id, "Conteúdo para revisar depois", null);
    chat.delete(host, id, (UUID) sent.get("id"));
    chat.send(member, id, "Mensagem preservada", null);
    study.end(host, id);
    assertThat((List<?>) chat.messages(member, id, 0)).hasSize(2);
    assertThatThrownBy(() -> chat.messages(outsider, id, 0)).isInstanceOf(ApiException.class);
  }

  @Test
  void expirationIsCheckedWithoutScheduler() {
    UUID id = room(8);
    db.jdbc.update("UPDATE study_room SET ends_at=now()-interval '1 second' WHERE id=?", id);
    assertThatThrownBy(() -> chat.send(host, id, "Tarde", null)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> study.join(member, id)).isInstanceOf(ApiException.class);
    study.expire();
    study.expire();
    assertThat(study.detail(host, id).get("status")).isEqualTo("ENDED");
  }

  @Test
  void cannotEndOthersRoomOrRejoinAfterRemoval() {
    UUID id = room(8);
    study.join(member, id);
    assertThatThrownBy(() -> study.end(member, id)).isInstanceOf(ApiException.class);
    study.remove(host, id, member.id());
    assertThatThrownBy(() -> study.join(member, id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> chat.send(member, id, "bypass", null))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void invalidCatalogAndCrossPeriodEnrollmentAreRejected() {
    assertThatThrownBy(() -> catalog.importEntries(member, List.of()))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () -> profiles.enroll(host, period, List.of(UUID.randomUUID()), "EVENING", ""))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> study.study(host, subject, null, "invalid", 26, 8))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void rideAcceptanceIsPrivateAndCapacityProtected() {
    var r =
        (Map<?, ?>)
            rides.create(
                host,
                campus,
                "OFFER",
                "Bairro de teste",
                "TO_CAMPUS",
                Instant.now().plusSeconds(3600),
                1);
    UUID ride = (UUID) r.get("id");
    UUID match = (UUID) ((Map<?, ?>) rides.interest(member, ride)).get("id");
    UUID other = (UUID) ((Map<?, ?>) rides.interest(outsider, ride)).get("id");
    assertThatThrownBy(() -> rides.messages(member, match, 0)).isInstanceOf(ApiException.class);
    rides.accept(host, match);
    rides.meeting(member, match, "Ponto privado de teste");
    assertThatThrownBy(() -> rides.messages(outsider, match, 0)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> rides.accept(host, other)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> rides.review(member, match, 5)).isInstanceOf(ApiException.class);
  }

  @Test
  void rideConversationsCanCloseCancelAndPurgeWithoutLeakingAccess() {
    UUID ride =
        (UUID)
            ((Map<?, ?>)
                    rides.create(
                        host,
                        campus,
                        "OFFER",
                        "Teste de encerramento",
                        "TO_CAMPUS",
                        Instant.now().plusSeconds(3600),
                        1))
                .get("id");
    UUID id = (UUID) ((Map<?, ?>) rides.interest(member, ride)).get("id");
    UUID next = (UUID) ((Map<?, ?>) rides.interest(outsider, ride)).get("id");
    rides.accept(host, id);
    rides.message(member, id, "Mensagem a excluir");
    rides.meeting(host, id, "Ponto privado");
    assertThatThrownBy(() -> rides.closeConversation(outsider, id))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> rides.cancelMatch(outsider, id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> rides.deleteConversation(outsider, id))
        .isInstanceOf(ApiException.class);
    rides.closeConversation(member, id);
    var closed = rides.access(host, id);
    assertThat(closed.get("closedAt")).isNotNull();
    assertThat(closed.get("purgeAt")).isNotNull();
    assertThatThrownBy(() -> rides.requireOpen(closed)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> rides.message(host, id, "Após encerramento"))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> rides.meeting(member, id, "Novo ponto"))
        .isInstanceOf(ApiException.class);
    assertThat((List<?>) rides.messages(host, id, 0)).hasSize(1);
    rides.closeConversation(host, id);
    assertThat(rides.access(host, id).get("purgeAt")).isEqualTo(closed.get("purgeAt"));
    rides.deleteConversation(member, id);
    rides.deleteConversation(host, id);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM ride_message WHERE match_id=?", Integer.class, id))
        .isZero();
    assertThat(db.one("SELECT meeting_point FROM ride_match WHERE id=?", id).get("meetingPoint"))
        .isNull();
    assertThatThrownBy(() -> rides.messages(host, id, 0)).isInstanceOf(ApiException.class);
    rides.cancelMatch(member, id);
    rides.cancelMatch(member, id);
    rides.accept(host, next);
    assertThat(db.one("SELECT status FROM ride_match WHERE id=?", next).get("status"))
        .isEqualTo("ACCEPTED");
    rides.message(outsider, next, "Outra conversa");
    rides.finish(host, ride, true);
    assertThat(rides.access(outsider, next).get("closedAt")).isNotNull();
    db.jdbc.update("UPDATE ride_match SET purge_at=now()-interval '1 second' WHERE id=?", next);
    rides.cleanupConversations();
    assertThat(db.one("SELECT deleted_at FROM ride_match WHERE id=?", next).get("deletedAt"))
        .isNotNull();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM ride_message WHERE match_id=?", Integer.class, next))
        .isZero();
    assertThat((List<?>) rides.matches(host))
        .noneMatch(row -> ((Map<?, ?>) row).get("id").equals(next));
  }

  @Test
  void staleRideClosesAndPendingPassengerCanWithdraw() {
    UUID ride =
        (UUID)
            ((Map<?, ?>)
                    rides.create(
                        host,
                        campus,
                        "OFFER",
                        "Teste de expiração",
                        "TO_CAMPUS",
                        Instant.now().plusSeconds(3600),
                        2))
                .get("id");
    UUID first = (UUID) ((Map<?, ?>) rides.interest(member, ride)).get("id");
    UUID second = (UUID) ((Map<?, ?>) rides.interest(outsider, ride)).get("id");
    rides.cancelMatch(member, first);
    assertThatThrownBy(() -> rides.accept(host, first)).isInstanceOf(ApiException.class);
    rides.accept(host, second);
    db.jdbc.update("UPDATE ride SET departure_at=now()-interval '25 hours' WHERE id=?", ride);
    rides.cleanupConversations();
    assertThat(rides.access(host, second).get("closedAt")).isNotNull();
    assertThatThrownBy(() -> rides.message(outsider, second, "Muito tarde"))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void endpointsRejectAnonymousAndMassAssignment() throws Exception {
    mvc.perform(
            get("/api/v1/study-rooms")
                .header("Authorization", "Bearer " + hostCredentials.accessToken()))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
    mvc.perform(
            get("/api/v1/admin/academics?kind=INSTITUTION")
                .header("Authorization", "Bearer " + hostCredentials.accessToken()))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/v1/auth/register")
                .contentType("application/json")
                .content(
                    "{\"name\":\"X\",\"username\":\"xxx\",\"email\":\"test@example.test\",\"password\":\"test-password-long\",\"device\":\"Test\",\"role\":\"ADMIN\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void tokenHashesAreNotCredentials() {
    var s =
        db.one("SELECT access_hash,refresh_hash FROM user_session WHERE id=?", host.sessionId());
    assertThat(s.get("accessHash")).isNotEqualTo(hostCredentials.accessToken());
    assertThat(s.get("refreshHash")).isNotEqualTo(hostCredentials.refreshToken());
  }
}

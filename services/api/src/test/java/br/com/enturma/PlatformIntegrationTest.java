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
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class PlatformIntegrationTest {
  @org.springframework.test.context.bean.override.mockito.MockitoBean
  br.com.enturma.ai.AiProvider aiProvider;

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  br.com.enturma.materials.ObjectStorageService storage;

  @org.springframework.test.context.bean.override.mockito.MockitoBean RideMapService rideMapService;

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
  @Autowired AccountPrivacyController privacy;
  @Autowired CatalogService catalog;
  @Autowired ProfileService profiles;
  @Autowired StudyService study;
  @Autowired ChatService chat;
  @Autowired RideService rides;
  @Autowired RideMatchingService rideMatching;
  @Autowired RideMobilityService rideMobility;
  @Autowired RideDispatchService rideDispatch;
  @Autowired Db db;
  @Autowired MockMvc mvc;
  @Autowired CatalogImports imports;
  @Autowired java.util.List<br.com.enturma.academics.provider.AcademicCatalogProvider> providers;
  @Autowired br.com.enturma.learning.LearningController learning;

  @Autowired br.com.enturma.learning.AdvancedLearningController advanced;

  @Test
  void onDemandRideDispatchIsIdempotentAtomicAndRestoresPassengerAfterDriverCancel() {
    db.jdbc.update(
        "UPDATE academic_campus SET address_label='Campus Teste',latitude=-19.9321000,"
            + " longitude=-43.9387000 WHERE id=?",
        campus);
    rideMobility.saveVehicle(member, "Honda", "Fit", "Prata", 2020, 3, "••1A23");
    rideMobility.saveVehicle(outsider, "Fiat", "Argo", "Preto", 2021, 3, "••9Z99");

    var first =
        (Map<?, ?>)
            rideDispatch.startPassengerSearch(
                host,
                campus,
                "TO_CAMPUS",
                "Caiçara",
                -19.918,
                -43.963,
                "Campus Teste",
                -19.9321,
                -43.9387,
                4200,
                900);
    var duplicate =
        (Map<?, ?>)
            rideDispatch.startPassengerSearch(
                host,
                campus,
                "TO_CAMPUS",
                "Caiçara",
                -19.918,
                -43.963,
                "Campus Teste",
                -19.9321,
                -43.9387,
                4200,
                900);
    assertThat(duplicate.get("id")).isEqualTo(first.get("id"));

    rideDispatch.setDriverAvailability(
        member,
        campus,
        "TO_CAMPUS",
        3,
        "Padre Eustáquio",
        -19.916,
        -43.957,
        "Campus Teste",
        -19.9321,
        -43.9387,
        -19.916,
        -43.957,
        20);
    rideDispatch.setDriverAvailability(
        outsider,
        campus,
        "TO_CAMPUS",
        3,
        "Carlos Prates",
        -19.921,
        -43.954,
        "Campus Teste",
        -19.9321,
        -43.9387,
        -19.921,
        -43.954,
        20);

    var nearby = (Map<String, Object>) rideDispatch.nearbyDrivers(host, campus, "TO_CAMPUS");
    var nearbyDrivers = (List<Map<String, Object>>) nearby.get("drivers");
    assertThat(nearbyDrivers).isNotEmpty();
    assertThat(nearbyDrivers.getFirst()).doesNotContainKeys("userId", "name", "email");
    assertThat(String.valueOf(nearbyDrivers.getFirst().get("id")))
        .doesNotContain(member.id().toString());

    var requests = (List<Map<String, Object>>) rideDispatch.driverRequests(member);
    assertThat(requests).anyMatch(row -> row.get("id").equals(first.get("id")));
    assertThat(requests.getFirst()).doesNotContainKeys("startLat", "startLng", "endLat", "endLng");

    UUID requestRide = (UUID) first.get("id");
    var accepted = (Map<?, ?>) rideDispatch.acceptRequest(member, requestRide);
    UUID match = (UUID) accepted.get("matchId");
    assertThat(((Map<?, ?>) rideDispatch.state(host)).get("activeMatch")).isNotNull();
    assertThatThrownBy(() -> rideDispatch.acceptRequest(outsider, requestRide))
        .isInstanceOf(ApiException.class);

    rides.cancelMatch(member, match);
    assertThat(db.one("SELECT status,trip_status FROM ride WHERE id=?", requestRide).get("status"))
        .isEqualTo("OPEN");
    assertThat(
            db.one("SELECT status,trip_status FROM ride WHERE id=?", requestRide).get("tripStatus"))
        .isEqualTo("MATCHING");
  }

  @Test
  void passengerCancellationEndsOnDemandRequestAndReleasesDriver() {
    db.jdbc.update(
        "UPDATE academic_campus SET address_label='Campus Teste',latitude=-19.9321000,"
            + " longitude=-43.9387000 WHERE id=?",
        campus);
    var request =
        (Map<?, ?>)
            rideDispatch.startPassengerSearch(
                host,
                campus,
                "TO_CAMPUS",
                "Caiçara",
                -19.918,
                -43.963,
                "Campus Teste",
                -19.9321,
                -43.9387,
                4200,
                900);
    rideDispatch.setDriverAvailability(
        member,
        campus,
        "TO_CAMPUS",
        2,
        "Padre Eustáquio",
        -19.916,
        -43.957,
        "Campus Teste",
        -19.9321,
        -43.9387,
        -19.916,
        -43.957,
        20);
    var accepted = (Map<?, ?>) rideDispatch.acceptRequest(member, (UUID) request.get("id"));
    UUID match = (UUID) accepted.get("matchId");

    rides.cancelMatch(host, match);

    assertThat(
            db.one("SELECT status,trip_status FROM ride WHERE id=?", request.get("id"))
                .get("status"))
        .isEqualTo("CANCELLED");
    assertThat(
            db.one(
                    "SELECT status,enabled FROM ride_driver_availability WHERE user_id=?",
                    member.id())
                .get("status"))
        .isEqualTo("ONLINE");
  }

  @Test
  void driverAvailabilityRejectsWrongCampusDirectionAndStaleDuplicateRide() {
    db.jdbc.update(
        "UPDATE academic_campus SET address_label='Campus Teste',latitude=-19.9321000,"
            + " longitude=-43.9387000 WHERE id=?",
        campus);
    assertThatThrownBy(
            () ->
                rideDispatch.setDriverAvailability(
                    member,
                    campus,
                    "TO_CAMPUS",
                    2,
                    "Origem",
                    -19.90,
                    -43.90,
                    "Destino incorreto",
                    -20.50,
                    -44.50,
                    -19.90,
                    -43.90,
                    30))
        .isInstanceOf(ApiException.class);
  }

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
  void messageVisibilityAndReactionsAreScopedToTheirConversationAndAccount() throws Exception {
    String username =
        (String) db.one("SELECT username FROM app_user WHERE id=?", member.id()).get("username");
    UUID friendship =
        (UUID) ((Map<?, ?>) social.invite(host, new SocialController.Invite(username))).get("id");
    social.accept(member, friendship);
    social.identity(
        host, new SocialController.PublicKey("EC", "P-256", "a".repeat(43), "b".repeat(43)));
    social.send(
        host,
        friendship,
        new SocialController.Envelope(UUID.randomUUID(), "Y2lwaGVydGV4dA==", "abcdefghijklmnop"));
    UUID message =
        (UUID) db.one("SELECT id FROM private_message WHERE friendship_id=?", friendship).get("id");
    social.reactPrivateMessage(member, friendship, message, "👩🏽‍💻");
    social.reactPrivateMessage(member, friendship, message, "👩🏽‍💻");
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM private_message_reaction WHERE message_id=?",
                Integer.class,
                message))
        .isEqualTo(1);
    assertThatThrownBy(() -> social.reactPrivateMessage(outsider, friendship, message, "❤️"))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> social.reactPrivateMessage(member, friendship, message, "<script>"))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> social.deletePrivateMessage(member, friendship, message))
        .isInstanceOf(ApiException.class);
    social.hidePrivateMessage(member, friendship, message);
    assertThat(
            ((Map<?, ?>) ((List<?>) social.messages(member, friendship, 0)).getFirst())
                .get("hiddenAt"))
        .isNotNull();
    assertThat(
            ((Map<?, ?>) ((List<?>) social.messages(host, friendship, 0)).getFirst())
                .get("hiddenAt"))
        .isNull();
    assertThat((List<?>) social.friends(member)).hasSize(1);
    assertThat(((Map<?, ?>) ((List<?>) social.friends(member)).getFirst()).get("lastMessageId"))
        .isNull();
    assertThat(((Map<?, ?>) ((List<?>) social.friends(host)).getFirst()).get("lastMessageId"))
        .isEqualTo(message);
    social.editPrivateMessage(
        host,
        friendship,
        message,
        new SocialController.PrivateMessageEdit("bmV3", "abcdefghijklmnop"));
    assertThat(
            ((Map<?, ?>) ((List<?>) social.messages(host, friendship, 0)).getFirst())
                .get("editedAt"))
        .isNotNull();
    social.deletePrivateMessage(host, friendship, message);
    var removed = (Map<?, ?>) ((List<?>) social.messages(host, friendship, 0)).getFirst();
    assertThat(removed.get("deletedAt")).isNotNull();
    assertThat(removed.get("ciphertext")).isEqualTo("");
    assertThatThrownBy(() -> social.reactPrivateMessage(member, friendship, message, "❤️"))
        .isInstanceOf(ApiException.class);

    UUID room = room(8);
    study.join(member, room);
    UUID roomMessage = (UUID) ((Map<?, ?>) chat.send(host, room, "Minha mensagem", null)).get("id");
    chat.react(member, room, roomMessage, "👨‍👩‍👧‍👦");
    chat.unreact(member, room, roomMessage, "👨‍👩‍👧‍👦");
    assertThat((List<?>) chat.reactions(member, room, roomMessage)).isEmpty();
    chat.hide(member, room, roomMessage);
    assertThat(((Map<?, ?>) ((List<?>) chat.messages(member, room, 0)).getFirst()).get("hiddenAt"))
        .isNotNull();
    assertThat(((Map<?, ?>) ((List<?>) chat.messages(host, room, 0)).getFirst()).get("hiddenAt"))
        .isNull();
    assertThatThrownBy(() -> chat.hide(outsider, room, roomMessage))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> chat.hide(member, room, message)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> chat.delete(member, room, roomMessage))
        .isInstanceOf(ApiException.class);
    chat.delete(host, room, roomMessage);
    assertThat(((Map<?, ?>) ((List<?>) chat.messages(member, room, 0)).getFirst()).get("deletedAt"))
        .isNotNull();
  }

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
  void privateVaultIsAccountBoundAndCannotReplaceExistingKeys() throws Exception {
    var key = new SocialController.PublicKey("EC", "P-256", "a".repeat(43), "b".repeat(43));
    social.identity(host, key);
    var vault =
        new SocialController.KeyVault(
            2, key, "a".repeat(43) + "=", "b".repeat(16), "c".repeat(128));
    assertThat((List<?>) social.vault(host)).isEmpty();
    assertThatThrownBy(() -> social.vault(outsider, vault)).isInstanceOf(ApiException.class);
    social.vault(host, vault);
    assertThat((List<?>) social.vault(host)).hasSize(1);
    assertThat((List<?>) social.vault(member)).isEmpty();
    assertThatThrownBy(() -> social.vault(host, vault)).isInstanceOf(ApiException.class);
    var wrongKey = new SocialController.PublicKey("EC", "P-256", "d".repeat(43), "e".repeat(43));
    assertThatThrownBy(
            () ->
                social.vault(
                    host,
                    new SocialController.KeyVault(
                        2, wrongKey, vault.salt(), vault.iv(), vault.data())))
        .isInstanceOf(ApiException.class);
    mvc.perform(get("/api/v1/private-vault")).andExpect(status().isUnauthorized());
    mvc.perform(
            put("/api/v1/private-vault")
                .header("Authorization", "Bearer " + hostCredentials.accessToken())
                .contentType("application/json")
                .content("{\"version\":2,\"data\":\"invalid\"}"))
        .andExpect(status().isBadRequest());
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

  @Autowired br.com.enturma.forum.ForumService forum;
  @Autowired Realtime realtime;

  @Autowired br.com.enturma.notifications.NotificationService notices;

  @Autowired br.com.enturma.learning.StudyJourneyController journey;

  @Test
  void journeyRewardsRealActionsOnceAndKeepsTutorialPreference() throws Exception {
    var first = (Map<String, Object>) journey.sync(host);
    assertThat(first)
        .containsEntry("completed", 1)
        .containsEntry("xpAwarded", 20)
        .containsEntry("tutorialSeen", false);
    assertThat((Map<String, Object>) journey.sync(host)).containsEntry("xpAwarded", 0);
    UUID room = room(8);
    assertThat((Map<String, Object>) journey.sync(host))
        .containsEntry("completed", 2)
        .containsEntry("xpAwarded", 30);
    chat.send(host, room, "Minha primeira dúvida", null);
    try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
      var results =
          pool.invokeAll(
              List.<Callable<Object>>of(() -> journey.sync(host), () -> journey.sync(host)));
      int awarded = 0;
      for (var result : results)
        awarded += ((Number) ((Map<String, Object>) result.get()).get("xpAwarded")).intValue();
      assertThat(awarded).isEqualTo(50);
    }
    assertThat((Map<String, Object>) journey.sync(host))
        .containsEntry("completed", 3)
        .containsEntry("totalXp", 100)
        .containsEntry("xpAwarded", 0);
    journey.seen(host);
    assertThat((Map<String, Object>) journey.sync(host)).containsEntry("tutorialSeen", true);
    assertThat((Map<String, Object>) journey.sync(member))
        .containsEntry("completed", 1)
        .containsEntry("totalXp", 20)
        .containsEntry("tutorialSeen", false);
  }

  @Test
  void clearingInboxIsIsolatedAndDoesNotRestoreDeduplicatedNotices() {
    UUID target = UUID.randomUUID();
    notices.send(
        member.id(),
        host.id(),
        "FORUM_LIKE",
        "forum:" + target,
        target,
        "/forum/" + target,
        "Curtida");
    notices.send(
        host.id(),
        member.id(),
        "FORUM_LIKE",
        "forum:" + target,
        target,
        "/forum/" + target,
        "Curtida");
    notices.clear(host);
    assertThat((List<?>) ((Map<String, Object>) notices.inbox(host)).get("items")).isEmpty();
    assertThat((Map<String, Object>) notices.inbox(host)).containsEntry("unreadCount", 0L);
    assertThat((List<?>) ((Map<String, Object>) notices.inbox(member)).get("items")).hasSize(1);
    notices.send(
        member.id(),
        host.id(),
        "FORUM_LIKE",
        "forum:" + target,
        target,
        "/forum/" + target,
        "Curtida");
    assertThat((List<?>) ((Map<String, Object>) notices.inbox(host)).get("items")).isEmpty();
    notices.send(
        member.id(),
        host.id(),
        "FORUM_REPLY",
        "forum:" + target,
        UUID.randomUUID(),
        "/forum/" + target,
        "Resposta nova");
    assertThat((List<?>) ((Map<String, Object>) notices.inbox(host)).get("items")).hasSize(1);
  }

  @Test
  void notificationsArePrivateDeduplicatedAndSupportMentionsAndReadState() {
    UUID post =
        (UUID)
            ((Map<?, ?>) forum.create(host, "Notificações de teste", "Conversa", "GENERAL"))
                .get("id");
    forum.vote(host, post, 1);
    assertThat(((Number) ((Map<?, ?>) notices.inbox(host)).get("unreadCount")).intValue()).isZero();
    forum.vote(member, post, 1);
    forum.vote(member, post, 0);
    forum.vote(member, post, 1);
    forum.react(member, post, "👍");
    forum.react(member, post, "💡");
    assertThat(((Number) ((Map<?, ?>) notices.inbox(host)).get("unreadCount")).intValue())
        .isEqualTo(2);
    String username =
        (String) db.one("SELECT username FROM app_user WHERE id=?", host.id()).get("username");
    UUID comment =
        (UUID) ((Map<?, ?>) forum.comment(member, post, null, "Confira @" + username)).get("id");
    var mention =
        db.one("SELECT * FROM notification WHERE user_id=? AND target_id=?", host.id(), comment);
    assertThat(mention.get("kind")).isEqualTo("MENTION");
    assertThat(mention.get("href")).isEqualTo("/forum/" + post + "#entry-" + comment);
    UUID notice = (UUID) mention.get("id");
    notices.read(outsider, List.of(notice), null, false);
    assertThat(db.one("SELECT read_at FROM notification WHERE id=?", notice).get("readAt"))
        .isNull();
    notices.read(host, List.of(notice), null, false);
    assertThat(((Number) ((Map<?, ?>) notices.inbox(host)).get("unreadCount")).intValue())
        .isEqualTo(2);
    notices.read(host, null, null, true);
    assertThat(((Number) ((Map<?, ?>) notices.inbox(host)).get("unreadCount")).intValue()).isZero();
    db.jdbc.update(
        "INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", host.id(), outsider.id());
    notices.send(
        outsider.id(),
        host.id(),
        "ROOM_MESSAGE",
        "room:" + UUID.randomUUID(),
        UUID.randomUUID(),
        "/home",
        "Não mostrar");
    assertThat(((Number) ((Map<?, ?>) notices.inbox(host)).get("unreadCount")).intValue()).isZero();
    UUID room = room(8);
    study.join(member, room);
    UUID message = (UUID) ((Map<?, ?>) chat.send(member, room, "Olá @" + username, null)).get("id");
    assertThat(
            db.one(
                "SELECT kind FROM notification WHERE user_id=? AND target_id=?",
                host.id(),
                message))
        .containsEntry("kind", "MENTION");
    assertThat((List<?>) chat.target(host, room, message)).hasSize(1);
    assertThatThrownBy(() -> chat.target(outsider, room, message)).isInstanceOf(ApiException.class);
    notices.read(host, null, "room:" + room, false);
    assertThat(
            db.one(
                    "SELECT read_at FROM notification WHERE user_id=? AND target_id=?",
                    host.id(),
                    message)
                .get("readAt"))
        .isNotNull();
    forum.delete(host, post);
  }

  @Test
  void forumHighlightsRankRecentPostsByLikesAndReactionsAndRespectBlocks() {
    UUID popular =
        (UUID)
            ((Map<?, ?>) forum.create(host, "Destaque popular", "Explicação", "GENERAL")).get("id");
    UUID fresh =
        (UUID)
            ((Map<?, ?>) forum.create(host, "Conversa recente", "Uma dúvida", "GENERAL")).get("id");
    UUID old =
        (UUID) ((Map<?, ?>) forum.create(host, "Conversa antiga", "Arquivo", "GENERAL")).get("id");
    for (Actor a : List.of(host, member, outsider)) {
      forum.vote(a, popular, 1);
      forum.react(a, popular, "💡");
      forum.vote(a, old, 1);
      forum.react(a, old, "💡");
    }
    forum.comment(member, popular, null, "Uma resposta útil");
    db.jdbc.update("UPDATE forum_entry SET created_at=now()-interval '31 days' WHERE id=?", old);
    var highlights = (List<?>) forum.highlights(member);
    assertThat(highlights.size()).isLessThanOrEqualTo(4);
    var first = (Map<?, ?>) highlights.getFirst();
    assertThat(first.get("id")).isEqualTo(popular);
    assertThat(((Number) first.get("likes")).intValue()).isEqualTo(3);
    assertThat(((Number) first.get("reactionCount")).intValue()).isEqualTo(3);
    assertThat(((Number) first.get("commentsCount")).intValue()).isEqualTo(1);
    assertThat(highlights).noneMatch(e -> ((Map<?, ?>) e).get("id").equals(old));
    db.jdbc.update(
        "INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", member.id(), host.id());
    assertThat((List<?>) forum.highlights(member))
        .noneMatch(e -> ((Map<?, ?>) e).get("authorId").equals(host.id()));
    for (UUID id : List.of(popular, fresh, old)) forum.delete(host, id);
  }

  @Test
  void forumSearchVotesRepliesAndOwnershipAreEnforced() {
    String title = "Algoritmos " + UUID.randomUUID();
    UUID post =
        (UUID)
            ((Map<?, ?>) forum.create(host, title, "Como estudar recursão?", "PROGRAMMING"))
                .get("id");
    UUID similar =
        (UUID)
            ((Map<?, ?>)
                    forum.create(
                        member, "Algoritmos recursivos", "Explicação com exemplos", "PROGRAMMING"))
                .get("id");
    assertThat(
            (List<?>)
                ((Map<?, ?>) forum.list(member, title, "PROGRAMMING", "relevance", 0, false))
                    .get("items"))
        .hasSize(1);
    assertThat((List<?>) forum.related(member, post))
        .anyMatch(e -> ((Map<?, ?>) e).get("id").equals(similar));
    forum.vote(member, post, 1);
    forum.vote(member, post, 1);
    var detail = (Map<?, ?>) forum.detail(member, post);
    assertThat(((Number) detail.get("score")).intValue()).isEqualTo(1);
    forum.vote(member, post, -1);
    assertThat(((Number) ((Map<?, ?>) forum.detail(member, post)).get("score")).intValue())
        .isEqualTo(-1);
    forum.vote(member, post, 0);
    forum.react(member, post, "👍");
    forum.react(member, post, "💡");
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM forum_reaction WHERE entry_id=?", Long.class, post))
        .isEqualTo(1L);
    assertThatThrownBy(() -> forum.react(member, post, "invalid")).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> forum.edit(member, post, title, "Alterado", "GENERAL"))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> forum.delete(member, post)).isInstanceOf(ApiException.class);
    UUID comment =
        (UUID) ((Map<?, ?>) forum.comment(member, post, null, "Use um caso base")).get("id");
    UUID reply =
        (UUID)
            ((Map<?, ?>) forum.comment(host, post, comment, "Obrigado pela explicação")).get("id");
    assertThatThrownBy(() -> forum.comment(host, similar, comment, "Resposta cruzada"))
        .isInstanceOf(ApiException.class);
    forum.delete(member, comment);
    var comments = (List<?>) ((Map<?, ?>) forum.comments(host, post, 0)).get("items");
    assertThat(comments).hasSize(2);
    assertThat(db.one("SELECT body,deleted FROM forum_entry WHERE id=?", comment))
        .containsEntry("body", "")
        .containsEntry("deleted", true);
    assertThat(db.one("SELECT body FROM forum_entry WHERE id=?", reply))
        .containsEntry("body", "Obrigado pela explicação");
    db.jdbc.update(
        "INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", outsider.id(), host.id());
    assertThatThrownBy(() -> forum.detail(outsider, post)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> forum.vote(outsider, reply, 1)).isInstanceOf(ApiException.class);
    assertThat(
            (List<?>) ((Map<?, ?>) forum.list(outsider, title, "", "new", 0, false)).get("items"))
        .isEmpty();
    forum.delete(host, post);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM forum_entry WHERE id=? OR root_id=?", Long.class, post, post))
        .isZero();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM forum_reaction WHERE entry_id=?", Long.class, post))
        .isZero();
  }

  @Test
  void rideChangesArePushedAfterCommitWithoutPrivatePayloads() throws Exception {
    var socket = org.mockito.Mockito.mock(org.springframework.web.socket.WebSocketSession.class);
    org.mockito.Mockito.when(socket.getId()).thenReturn(UUID.randomUUID().toString());
    org.mockito.Mockito.when(socket.isOpen()).thenReturn(true);
    realtime.afterConnectionEstablished(socket);
    realtime.handleMessage(
        socket,
        new org.springframework.web.socket.TextMessage(
            "{\"token\":\"" + hostCredentials.accessToken() + "\",\"scope\":\"rides\"}"));
    try {
      org.mockito.Mockito.verify(socket)
          .sendMessage(
              org.mockito.ArgumentMatchers.argThat(
                  m -> m.getPayload().equals("{\"type\":\"rides_ready\"}")));
      UUID ride =
          (UUID)
              ((Map<?, ?>)
                      rides.create(
                          host,
                          campus,
                          "OFFER",
                          "Região teste",
                          "TO_CAMPUS",
                          Instant.now().plusSeconds(3600),
                          1))
                  .get("id");
      UUID match = (UUID) ((Map<?, ?>) rides.interest(member, ride)).get("id");
      rides.accept(host, match);
      org.mockito.Mockito.verify(socket, org.mockito.Mockito.times(3))
          .sendMessage(
              org.mockito.ArgumentMatchers.argThat(
                  m -> m.getPayload().equals("{\"type\":\"rides_changed\"}")));
    } finally {
      realtime.afterConnectionClosed(socket, org.springframework.web.socket.CloseStatus.NORMAL);
    }
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
  void rideMobilityMatchesConfirmsBoardsTracksAndReviews() {
    Instant departure = Instant.now().plusSeconds(3600);
    UUID offer =
        (UUID)
            ((Map<?, ?>)
                    rides.create(
                        host,
                        campus,
                        "OFFER",
                        "Caiçara",
                        "TO_CAMPUS",
                        departure,
                        1,
                        -19.911,
                        -43.961,
                        120))
                .get("id");
    var publicRide =
        ((List<Map<String, Object>>) rides.list(member, campus, 0))
            .stream().filter(row -> row.get("id").equals(offer)).findFirst().orElseThrow();
    assertThat(publicRide).doesNotContainKeys("areaLat", "areaLng", "areaAccuracyM");
    UUID request =
        (UUID)
            ((Map<?, ?>)
                    rides.create(
                        member,
                        campus,
                        "REQUEST",
                        "Padre Eustáquio",
                        "TO_CAMPUS",
                        departure.plusSeconds(600),
                        1,
                        -19.918,
                        -43.952,
                        150))
                .get("id");

    var suggestions = rideMatching.suggestions(member, request);
    assertThat(suggestions)
        .anyMatch(row -> row.get("id").equals(offer) && ((Number) row.get("rank")).intValue() > 0);

    var connected = (Map<?, ?>) rideMatching.connect(member, request, offer);
    UUID match = (UUID) connected.get("id");
    assertThat(connected.get("status")).isEqualTo("PENDING");

    rides.accept(host, match);
    assertThat(db.one("SELECT status FROM ride_match WHERE id=?", match).get("status"))
        .isEqualTo("ACCEPTED");

    rideMobility.confirm(member, match);
    rideMobility.confirm(host, match);
    rideMobility.tripStatus(host, offer, "DRIVER_ON_THE_WAY");
    rideMobility.liveLocation(host, match, -19.912, -43.960, 15);
    rideMobility.liveLocation(member, match, -19.918, -43.952, 20);
    var peer = (Map<?, ?>) rideMobility.peerLocation(member, match);
    assertThat(peer.get("available")).isEqualTo(true);
    assertThat(((Number) peer.get("distanceKm")).doubleValue()).isGreaterThanOrEqualTo(0);

    var share = (Map<?, ?>) rideMobility.createSafetyShare(member, match);
    var publicView = (Map<?, ?>) rideMobility.publicSafety((UUID) share.get("token"));
    assertThat(publicView.get("driverName")).isNotNull();
    assertThat(publicView.get("passengerName")).isNotNull();

    rideMobility.tripStatus(host, offer, "ARRIVING");
    rideMobility.tripStatus(host, offer, "WAITING_PASSENGER");
    String code =
        String.valueOf(((Map<?, ?>) rideMobility.boardingCode(member, match)).get("code"));
    assertThat(code).matches("[0-9]{4}");
    rideMobility.board(host, match, code);
    assertThat(
            db.one("SELECT boarding_verified_at FROM ride_match WHERE id=?", match)
                .get("boardingVerifiedAt"))
        .isNotNull();
    assertThat(db.one("SELECT boarded_at FROM ride_match WHERE id=?", match).get("boardedAt"))
        .isNull();
    assertThat(db.one("SELECT trip_status FROM ride WHERE id=?", offer).get("tripStatus"))
        .isEqualTo("WAITING_PASSENGER");
    rideMobility.confirmBoarding(member, match);
    assertThat(db.one("SELECT boarded_at FROM ride_match WHERE id=?", match).get("boardedAt"))
        .isNotNull();
    assertThat(db.one("SELECT trip_status FROM ride WHERE id=?", offer).get("tripStatus"))
        .isEqualTo("IN_PROGRESS");
    rideMobility.tripStatus(host, offer, "ARRIVED");
    rideMobility.tripStatus(host, offer, "COMPLETED");

    rides.review(member, match, 5, 5, 5, 5, true, "Viagem tranquila");
    var reputation = (Map<?, ?>) rideMobility.reputation(host.id());
    assertThat(((Number) reputation.get("rating")).doubleValue()).isEqualTo(5.0);
    assertThat(((Number) reputation.get("completedTrips")).intValue()).isGreaterThanOrEqualTo(1);
  }

  @Test
  void rideWaitlistPromotesAfterAcceptedPassengerCancels() {
    UUID ride =
        (UUID)
            ((Map<?, ?>)
                    rides.create(
                        host,
                        campus,
                        "OFFER",
                        "Caiçara",
                        "TO_CAMPUS",
                        Instant.now().plusSeconds(3600),
                        1))
                .get("id");
    UUID accepted = (UUID) ((Map<?, ?>) rides.interest(member, ride)).get("id");
    rides.accept(host, accepted);

    var waitingResult = (Map<?, ?>) rides.interest(outsider, ride);
    UUID waiting = (UUID) waitingResult.get("id");
    assertThat(waitingResult.get("status")).isEqualTo("WAITLISTED");

    rides.cancelMatch(member, accepted);
    assertThat(db.one("SELECT status FROM ride_match WHERE id=?", waiting).get("status"))
        .isEqualTo("PENDING");
  }

  @Test
  void recurringRidesAndVehicleProfileStayOwnedAndGenerateUpcomingTrips() {
    var vehicle =
        (Map<?, ?>) rideMobility.saveVehicle(host, "Honda", "Fit", "Prata", 2020, 3, "••1A23");
    assertThat(vehicle.get("model")).isEqualTo("Fit");

    int weekday =
        java.time.ZonedDateTime.now(java.time.ZoneId.of("America/Sao_Paulo"))
            .plusDays(1)
            .getDayOfWeek()
            .getValue();
    UUID recurrence =
        (UUID)
            ((Map<?, ?>)
                    rideMobility.createRecurrence(
                        host,
                        campus,
                        "OFFER",
                        "Caiçara",
                        "TO_CAMPUS",
                        java.time.LocalTime.now().plusHours(2).withSecond(0).withNano(0),
                        "America/Sao_Paulo",
                        List.of(weekday),
                        2,
                        -19.911,
                        -43.961,
                        150))
                .get("id");
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM ride_recurrence_instance WHERE recurrence_id=?",
                Integer.class,
                recurrence))
        .isGreaterThanOrEqualTo(1);
    assertThatThrownBy(() -> rideMobility.deleteRecurrence(member, recurrence))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void loginExplainsUnknownEmailAndWrongPasswordSeparately() {
    assertThatThrownBy(() -> auth.login("nao-existe@example.test", "qualquer-senha", "JUnit"))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("Não encontramos uma conta cadastrada com este e-mail");

    String email = (String) db.one("SELECT email FROM app_user WHERE id=?", host.id()).get("email");
    assertThatThrownBy(() -> auth.login(email, "senha-incorreta", "JUnit"))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("A senha informada está incorreta");
  }

  @Test
  void passwordRecoveryRejectsUnknownEmailBeforeStartingCountdown() {
    assertThatThrownBy(() -> auth.recover("nao-existe@example.test"))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("Não encontramos uma conta cadastrada com este e-mail");
  }

  @Test
  void emailVerificationAndPasswordRecoveryUseOneTimeLinks() {
    String email = (String) db.one("SELECT email FROM app_user WHERE id=?", host.id()).get("email");

    auth.resendVerification(host);
    var verifyMail =
        db.one(
            "SELECT body FROM email_outbox WHERE recipient=? AND subject LIKE '%Confirme%'"
                + " ORDER BY created_at DESC LIMIT 1",
            email);
    String verifyBody = String.valueOf(verifyMail.get("body"));
    String verifyToken = verifyBody.substring(verifyBody.indexOf("#token=") + 7);
    auth.consume(verifyToken, "VERIFY", null);
    assertThat(
            db.one("SELECT email_verified FROM app_user WHERE id=?", host.id())
                .get("emailVerified"))
        .isEqualTo(true);
    assertThatThrownBy(() -> auth.consume(verifyToken, "VERIFY", null))
        .isInstanceOf(ApiException.class);

    var recovery = auth.recover(email);
    assertThat(auth.recoveryStatus(recovery.trackingToken()).status()).isEqualTo("PENDING");
    var resetMail =
        db.one(
            "SELECT body FROM email_outbox WHERE recipient=? AND subject LIKE '%senha%'"
                + " ORDER BY created_at DESC LIMIT 1",
            email);
    String resetBody = String.valueOf(resetMail.get("body"));
    String resetToken = resetBody.substring(resetBody.indexOf("#token=") + 7);
    auth.consume(resetToken, "RESET", "new-test-password-long");

    assertThat(auth.recoveryStatus(recovery.trackingToken()).status()).isEqualTo("COMPLETED");
    assertThat(
            db.one("SELECT revoked_at FROM user_session WHERE id=?", host.sessionId())
                .get("revokedAt"))
        .isNotNull();
    assertThatThrownBy(() -> auth.login(email, "test-password-long", "JUnit"))
        .isInstanceOf(ApiException.class);
    assertThat(auth.login(email, "new-test-password-long", "JUnit").userId()).isEqualTo(host.id());
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

  @Autowired br.com.enturma.community.ProfileShowcaseController showcase;
  @Autowired br.com.enturma.community.AchievementService achievements;
  @Autowired br.com.enturma.learning.AcademicGames academicGames;
  @Autowired br.com.enturma.moderation.AutoModService automod;
  @Autowired org.springframework.transaction.support.TransactionTemplate transactions;
  @Autowired com.fasterxml.jackson.databind.ObjectMapper json;

  @Test
  void optionalClassifierOnlyCreatesOneAuditedProposalAndNeverPunishes() {
    UUID roomId = room(8);
    UUID messageId =
        (UUID)
            ((Map<?, ?>) chat.send(host, roomId, "Discussão para revisão contextual", null))
                .get("id");
    // Other fixtures are outside this worker run; only this message is due.
    db.jdbc.update(
        "UPDATE moderation_review_queue SET available_at=now()+interval '1 hour' WHERE"
            + " message_id<>?",
        messageId);
    org.mockito.Mockito.when(aiProvider.enabled()).thenReturn(true);
    org.mockito.Mockito.when(
            aiProvider.answer(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq("MODERATION_REVIEW")))
        .thenReturn(
            "{\"review\":true,\"confidence\":0.94,\"reason\":\"Requer análise humana de"
                + " contexto\"}");
    var worker =
        new br.com.enturma.moderation.ModerationReviewWorker(
            db, aiProvider, json, transactions, true);
    worker.run();
    db.jdbc.update(
        "UPDATE moderation_review_queue SET completed_at=NULL,available_at=now() WHERE"
            + " message_id=?",
        messageId);
    worker.run();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM moderation_case WHERE dedupe_key=? AND source='CLASSIFIER'"
                    + " AND status='REVIEW'",
                Integer.class,
                "classifier:" + messageId))
        .isEqualTo(1);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM moderation_evidence WHERE message_id=?",
                Integer.class,
                messageId))
        .isEqualTo(1);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM moderation_action a JOIN moderation_case c ON c.id=a.case_id"
                    + " WHERE c.dedupe_key=?",
                Integer.class,
                "classifier:" + messageId))
        .isZero();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT completed_at IS NOT NULL FROM moderation_review_queue WHERE message_id=?",
                Boolean.class,
                messageId))
        .isTrue();
  }

  @Autowired br.com.enturma.notifications.NotificationPreferences notificationPreferences;

  @Test
  void multiDayRoomsReserveMembersLockEntriesAndNotifyOnce() {
    UUID id = (UUID) study.create(host, subject, null, "Sala longa", 50, 8, 3).get("id");
    study.join(member, id);
    db.jdbc.update(
        "UPDATE room_participant SET last_seen_at=now()-interval '1 day' WHERE room_id=?", id);
    db.jdbc.update("UPDATE study_room SET empty_since=now()-interval '1 day' WHERE id=?", id);
    study.expire();
    assertThat(study.detail(host, id))
        .containsEntry("lifecycle", "MULTIDAY")
        .containsEntry("status", "OPEN");
    study.configure(host, id, "Sala reservada", "Revisão", true);
    assertThatThrownBy(() -> study.join(outsider, id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> study.configure(member, id, "Invasão", "", false))
        .isInstanceOf(ApiException.class);
    study.heartbeat(member, id);
    db.jdbc.update("UPDATE study_room SET ends_at=now()+interval '50 minutes' WHERE id=?", id);
    study.expire();
    study.expire();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM notification WHERE user_id=? AND context_key=? AND"
                    + " kind='ROOM_NOTICE'",
                Integer.class,
                host.id(),
                "room:" + id))
        .isEqualTo(1);
  }

  @Test
  void quickRoomClosesOnlyAfterPresenceGrace() {
    UUID id = room(8);
    db.jdbc.update(
        "UPDATE room_participant SET last_seen_at=now()-interval '2 minutes' WHERE room_id=?", id);
    study.expire();
    assertThat(study.detail(host, id).get("status")).isEqualTo("OPEN");
    db.jdbc.update("UPDATE study_room SET empty_since=now()-interval '10 minutes' WHERE id=?", id);
    study.expire();
    assertThat(study.detail(host, id).get("status")).isEqualTo("ENDED");
  }

  @Test
  void showcaseRespectsPrivacyAndRejectsUnearnedBadges() {
    var hidden = (Map<String, Object>) showcase.get(member, host.id());
    assertThat(hidden).doesNotContainKeys("stats", "academic", "achievements", "joinedAt");
    var input =
        new br.com.enturma.community.ProfileShowcaseController.Save(
            "#a020b9",
            "GRADIENT",
            "AURORA",
            "IDENTITY_FIRST",
            "Estudar Java",
            "Java",
            "Projeto de teste",
            Map.of("WIDGETS", true, "STATS", true),
            List.of(
                new br.com.enturma.community.ProfileShowcaseController.Widget("GOAL", true, true)),
            List.of());
    showcase.save(host, input);
    var shown = (Map<String, Object>) showcase.get(member, host.id());
    assertThat(shown).containsKey("stats").doesNotContainKeys("academic", "privacy");
    assertThat((List<?>) shown.get("widgets")).hasSize(1);
    assertThatThrownBy(
            () ->
                showcase.save(
                    host,
                    new br.com.enturma.community.ProfileShowcaseController.Save(
                        "#a020b9",
                        "SOLID",
                        "NONE",
                        "IDENTITY_FIRST",
                        "",
                        "",
                        "",
                        Map.of(),
                        List.of(),
                        List.of("VETERAN"))))
        .isInstanceOf(ApiException.class);
    db.jdbc.update(
        "INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", member.id(), host.id());
    assertThatThrownBy(() -> showcase.get(member, host.id())).isInstanceOf(ApiException.class);
  }

  @Test
  void academicChallengesHideAnswersAndAwardDailyXpOnlyOnce() {
    db.jdbc.update("UPDATE academic_entry SET name='Algoritmos' WHERE id=?", subject);
    var input = new br.com.enturma.learning.AcademicGames.Start(subject, "logic-trace", true, 1);
    var challenge = (Map<String, Object>) academicGames.start(host, input);
    assertThat(challenge).doesNotContainKey("answer");
    assertThat((Map<String, Object>) academicGames.start(host, input))
        .containsEntry("id", challenge.get("id"));
    UUID id = (UUID) challenge.get("id");
    String solution =
        ((com.fasterxml.jackson.databind.JsonNode)
                db.one("SELECT definition FROM academic_game_progress WHERE id=?", id)
                    .get("definition"))
            .path("answer")
            .asText();
    assertThatThrownBy(
            () ->
                academicGames.answer(
                    member, id, new br.com.enturma.learning.AcademicGames.Answer(solution)))
        .isInstanceOf(ApiException.class);
    assertThat(
            (Map<String, Object>)
                academicGames.answer(
                    host, id, new br.com.enturma.learning.AcademicGames.Answer("errado")))
        .containsEntry("correct", false)
        .doesNotContainKey("answer");
    assertThat(
            (Map<String, Object>)
                academicGames.answer(
                    host, id, new br.com.enturma.learning.AcademicGames.Answer(solution)))
        .containsEntry("correct", true)
        .containsEntry("xpAwarded", 25);
    assertThat(
            (Map<String, Object>)
                academicGames.answer(
                    host, id, new br.com.enturma.learning.AcademicGames.Answer(solution)))
        .containsEntry("xpAwarded", 0);
    achievements.sync(host.id());
    achievements.sync(host.id());
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM learning_xp_event WHERE user_id=? AND"
                    + " event_key='achievement:FIRST_SPARK'",
                Integer.class,
                host.id()))
        .isEqualTo(1);
  }

  @Test
  void moderationEvidenceSurvivesRejectedMessageAndCanBeAppealed() {
    UUID id = room(8);
    chat.send(host, id, "Oferta repetida para teste", null);
    chat.send(host, id, "Oferta repetida para teste", null);
    assertThatThrownBy(() -> chat.send(host, id, "Oferta repetida para teste", null))
        .isInstanceOf(br.com.enturma.moderation.PenaltyException.class);
    UUID caseId =
        (UUID)
            db.one(
                    "SELECT id FROM moderation_case WHERE user_id=? ORDER BY created_at DESC",
                    host.id())
                .get("id");
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM moderation_evidence WHERE case_id=?", Integer.class, caseId))
        .isEqualTo(1);
    assertThatThrownBy(() -> automod.appeal(member, caseId, "Não é minha infração"))
        .isInstanceOf(ApiException.class);
    automod.appeal(host, caseId, "Solicito análise de contexto do exercício.");
    automod.review(admin, caseId, true, "Exercício confirmado pelo moderador.");
    assertThat(db.one("SELECT status FROM moderation_case WHERE id=?", caseId))
        .containsEntry("status", "REVOKED");
  }

  @Test
  void preferencesDeduplicateEmailAndKeepSecurityMailIndependent() {
    db.jdbc.update("UPDATE app_user SET email_verified=true WHERE id=?", member.id());
    notificationPreferences.save(member, "FORUM", false, true);
    UUID target = UUID.randomUUID();
    notices.send(
        host.id(),
        member.id(),
        "FORUM_LIKE",
        "forum:" + target,
        target,
        "/forum/" + target,
        "Nova reação");
    notices.send(
        host.id(),
        member.id(),
        "FORUM_LIKE",
        "forum:" + target,
        target,
        "/forum/" + target,
        "Nova reação");
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM email_outbox WHERE user_id=? AND category='FORUM'",
                Integer.class,
                member.id()))
        .isEqualTo(1);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM notification WHERE user_id=? AND target_id=?",
                Integer.class,
                member.id(),
                target))
        .isZero();
    notificationPreferences.save(member, "FORUM", false, false);
    UUID another = UUID.randomUUID();
    notices.send(
        host.id(),
        member.id(),
        "FORUM_LIKE",
        "forum:" + another,
        another,
        "/forum/" + another,
        "Nova reação");
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM email_outbox WHERE user_id=? AND category='FORUM'",
                Integer.class,
                member.id()))
        .isEqualTo(1);
  }

  @Test
  void privacyEraseRemovesAdaptiveAiGroupsAndOwnedTeachingDataBeforeAnonymizing() {
    String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    var credentials =
        auth.register(
            "Privacy Fixture",
            "privacy_" + suffix,
            "privacy-" + suffix + "@example.test",
            "privacy-test-password-long",
            "JUnit");
    Actor actor = auth.authenticate(credentials.accessToken()).orElseThrow();
    UUID userId = actor.id();

    UUID interaction = UUID.randomUUID();
    UUID group = UUID.randomUUID();
    UUID task = UUID.randomUUID();
    UUID classroom = UUID.randomUUID();
    UUID campusTask = UUID.randomUUID();
    UUID focusSession = UUID.randomUUID();
    UUID flashcard = UUID.randomUUID();
    UUID practiceSession = UUID.randomUUID();

    db.jdbc.update(
        "INSERT INTO campus_task(id,user_id,kind,title,due_at) VALUES"
            + " (?,?,'STUDY','Privado',now())",
        campusTask,
        userId);
    db.jdbc.update(
        "INSERT INTO focus_session(id,user_id,label,planned_minutes) VALUES (?,?,?,50)",
        focusSession,
        userId,
        "Foco privado");
    db.jdbc.update("INSERT INTO study_match_profile(user_id) VALUES (?)", userId);
    db.jdbc.update(
        "INSERT INTO study_flashcard(id,user_id,front,back) VALUES (?,?,?,?)",
        flashcard,
        userId,
        "Pergunta privada",
        "Resposta privada");
    db.jdbc.update("INSERT INTO portfolio_profile(user_id) VALUES (?)", userId);
    db.jdbc.update(
        "INSERT INTO practice_session(id,user_id,title) VALUES (?,?,?)",
        practiceSession,
        userId,
        "Prática privada");
    db.jdbc.update("INSERT INTO campus_learning_profile(user_id) VALUES (?)", userId);
    db.jdbc.update(
        "INSERT INTO campus_tutor_interaction(id,user_id,action,prompt,response)"
            + " VALUES (?,?,'EXPLAIN','prompt privado','resposta privada')",
        interaction,
        userId);
    db.jdbc.update(
        "INSERT INTO study_group(id,owner_id,name,description,visibility)"
            + " VALUES (?,?,?,'','PRIVATE')",
        group,
        userId,
        "Grupo privado");
    db.jdbc.update(
        "INSERT INTO study_group_member(group_id,user_id,role) VALUES (?,?,'OWNER')",
        group,
        userId);
    db.jdbc.update(
        "INSERT INTO study_group_task(id,group_id,created_by,assigned_to,title)"
            + " VALUES (?,?,?,?,?)",
        task,
        group,
        userId,
        userId,
        "Tarefa privada");
    db.jdbc.update(
        "INSERT INTO teacher_profile(user_id,institution,title,enabled)"
            + " VALUES (?,'Enturma','Professor',true)",
        userId);
    db.jdbc.update(
        "INSERT INTO teacher_class(id,owner_id,name,description,join_code)"
            + " VALUES (?,?,?,'',?)",
        classroom,
        userId,
        "Turma privada",
        "P" + suffix.substring(0, 7).toUpperCase(Locale.ROOT));

    privacy.now(actor);

    for (String table :
        List.of(
            "campus_task",
            "focus_session",
            "study_match_profile",
            "study_flashcard",
            "portfolio_profile",
            "practice_session",
            "campus_learning_profile",
            "campus_tutor_interaction",
            "teacher_profile",
            "teacher_class_member")) {
      assertThat(
              db.jdbc.queryForObject(
                  "SELECT count(*) FROM "
                      + table
                      + " WHERE "
                      + (table.equals("teacher_class_member")
                          ? "user_id"
                          : table.equals("teacher_class") ? "owner_id" : "user_id")
                      + "=?",
                  Integer.class,
                  userId))
          .as(table)
          .isZero();
    }
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM campus_tutor_interaction WHERE user_id=?",
                Integer.class,
                userId))
        .isZero();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM campus_learning_profile WHERE user_id=?",
                Integer.class,
                userId))
        .isZero();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM study_group WHERE owner_id=?", Integer.class, userId))
        .isZero();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM study_group_member WHERE user_id=?", Integer.class, userId))
        .isZero();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM study_group_task WHERE created_by=? OR assigned_to=?",
                Integer.class,
                userId,
                userId))
        .isZero();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM teacher_class WHERE owner_id=?", Integer.class, userId))
        .isZero();
    assertThat(db.one("SELECT status FROM app_user WHERE id=?", userId).get("status"))
        .isEqualTo("DELETED");
  }
}

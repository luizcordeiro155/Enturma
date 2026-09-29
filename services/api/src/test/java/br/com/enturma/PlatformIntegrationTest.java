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
                org.mockito.ArgumentMatchers.anyString()))
        .thenReturn("Resposta de teste [1]");
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
            org.mockito.ArgumentMatchers.anyString());
  }

  @Autowired AuthService auth;
  @Autowired CatalogService catalog;
  @Autowired ProfileService profiles;
  @Autowired StudyService study;
  @Autowired ChatService chat;
  @Autowired RideService rides;
  @Autowired Db db;
  @Autowired MockMvc mvc;
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
    assertThat((List<?>) chat.messages(host, id, 0)).hasSize(1);
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

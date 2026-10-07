package br.com.enturma;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import br.com.enturma.auth.*;
import br.com.enturma.chat.RealtimePresence;
import br.com.enturma.common.*;
import br.com.enturma.voice.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class PrivateCallsIntegrationTest {
  @Autowired AuthService auth;
  @Autowired Db db;
  @Autowired PrivateCallService calls;
  @Autowired RealtimePresence presence;
  @MockitoBean VoiceProvider voice;
  Actor a, b, outsider;
  UUID friendship, deviceA, deviceB;

  Actor user() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    return auth.authenticate(
            auth.register(
                    "Teste chamada",
                    "call_" + tag,
                    tag + "@example.test",
                    "test-password-long",
                    "JUnit")
                .accessToken())
        .orElseThrow();
  }

  @BeforeEach
  void setup() {
    a = user();
    b = user();
    outsider = user();
    friendship = UUID.randomUUID();
    deviceA = UUID.randomUUID();
    deviceB = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO friendship(id,requester,recipient,status) VALUES (?,?,?,'ACCEPTED')",
        friendship,
        a.id(),
        b.id());
    when(voice.enabled()).thenReturn(true);
    when(voice.url()).thenReturn("ws://localhost:7880");
    when(voice.token(anyString(), anyString(), anyString(), anyLong()))
        .thenReturn("test-voice-token");
  }

  @AfterEach
  void clean() {
    db.jdbc.update(
        "DELETE FROM private_call WHERE caller_id IN (?,?,?) OR callee_id IN (?,?,?)",
        a.id(),
        b.id(),
        outsider.id(),
        a.id(),
        b.id(),
        outsider.id());
  }

  @SuppressWarnings("unchecked")
  Map<String, Object> create() {
    presence.touch("test-" + b.id(), b.id());
    return (Map<String, Object>) calls.create(a, friendship, false, deviceA);
  }

  @Test
  void requiresOnlineAcceptedUnblockedFriend() {
    assertThatThrownBy(() -> calls.create(a, friendship, false, deviceA))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("offline");
    assertThatThrownBy(() -> calls.create(outsider, friendship, false, deviceA))
        .isInstanceOf(ApiException.class);
    presence.touch("test-" + b.id(), b.id());
    db.jdbc.update("INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", b.id(), a.id());
    assertThatThrownBy(() -> calls.create(a, friendship, false, deviceA))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void acceptanceTokensDevicesAndEndAreIsolated() {
    UUID id = (UUID) create().get("id");
    assertThatThrownBy(() -> calls.join(a, id, deviceA)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> calls.transition(a, id, "accept", deviceA))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> calls.transition(outsider, id, "accept", deviceB))
        .isInstanceOf(ApiException.class);
    calls.transition(b, id, "ring", deviceB);
    calls.transition(b, id, "accept", deviceB);
    assertThatThrownBy(() -> calls.join(b, id, deviceA))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("outro dispositivo");
    calls.join(a, id, deviceA);
    calls.join(b, id, deviceB);
    calls.heartbeat(a, id);
    calls.heartbeat(b, id);
    assertThat(db.one("SELECT state FROM private_call WHERE id=?", id).get("state"))
        .isEqualTo("CONNECTED");
    db.jdbc.update("UPDATE private_call SET updated_at=now()-interval '6 minutes' WHERE id=?", id);
    assertThat(((Map<?, ?>) calls.current(a)).get("id")).isEqualTo(id);
    verify(voice).token(eq(a.id().toString()), anyString(), eq("private-" + id), anyLong());
    calls.transition(b, id, "end", deviceB);
    assertThatThrownBy(() -> calls.join(a, id, deviceA)).isInstanceOf(ApiException.class);
    calls.reconcile();
    verify(voice, atLeastOnce()).deleteRoom("private-" + id);
  }

  @Test
  void unansweredCallsExpireAndRejectLateAcceptance() {
    UUID id = (UUID) create().get("id");
    db.jdbc.update("UPDATE private_call SET expires_at=now()-interval '1 second' WHERE id=?", id);
    assertThatThrownBy(() -> calls.transition(b, id, "accept", deviceB))
        .isInstanceOf(ApiException.class);
    calls.reconcile();
    assertThat(db.one("SELECT state FROM private_call WHERE id=?", id).get("state"))
        .isEqualTo("NO_ANSWER");
    assertThatThrownBy(() -> calls.join(a, id, deviceA)).isInstanceOf(ApiException.class);
  }

  @Test
  void crossedInvitationsCreateOnlyOneRoom() throws Exception {
    presence.touch("test-" + a.id(), a.id());
    presence.touch("test-" + b.id(), b.id());
    try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
      var gate = new CountDownLatch(1);
      var first =
          pool.submit(
              () -> {
                gate.await();
                try {
                  calls.create(a, friendship, false, deviceA);
                  return 1;
                } catch (ApiException e) {
                  return 0;
                }
              });
      var second =
          pool.submit(
              () -> {
                gate.await();
                try {
                  calls.create(b, friendship, false, deviceB);
                  return 1;
                } catch (ApiException e) {
                  return 0;
                }
              });
      gate.countDown();
      assertThat(first.get(10, TimeUnit.SECONDS) + second.get(10, TimeUnit.SECONDS)).isEqualTo(1);
    }
  }

  @Test
  void expiredLeaseDoesNotMeanOnline() {
    presence.touch("test-" + b.id(), b.id());
    assertThat(presence.online(b.id())).isTrue();
    db.jdbc.update(
        "UPDATE realtime_presence SET expires_at=now()-interval '1 second' WHERE user_id=?",
        b.id());
    assertThat(presence.online(b.id())).isFalse();
  }

  @Test
  void removingFriendshipEndsActiveMediaAndPreventsRejoin() {
    UUID id = (UUID) create().get("id");
    calls.transition(b, id, "accept", deviceB);
    calls.join(a, id, deviceA);
    calls.join(b, id, deviceB);
    db.jdbc.update("DELETE FROM friendship WHERE id=?", friendship);
    calls.reconcile();
    assertThat(db.one("SELECT state FROM private_call WHERE id=?", id).get("state"))
        .isEqualTo("ENDED");
    assertThatThrownBy(() -> calls.join(a, id, deviceA)).isInstanceOf(ApiException.class);
    verify(voice, atLeastOnce()).deleteRoom("private-" + id);
  }
}

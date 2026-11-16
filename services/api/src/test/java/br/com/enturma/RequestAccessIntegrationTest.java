package br.com.enturma;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.enturma.auth.AuthService;
import br.com.enturma.common.Db;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

/** Every authenticated request learns session, academic access and global moderation at once. */
@SpringBootTest(properties = "enturma.planner.worker-delay=3600000")
@AutoConfigureMockMvc
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class RequestAccessIntegrationTest {
  @Autowired AuthService auth;
  @Autowired Db db;
  @Autowired MockMvc mvc;

  @Test
  void oneLookupReportsAccessAndModerationAndTheFilterEnforcesThem() throws Exception {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    String token =
        auth.register("Acesso", "acesso_" + tag, tag + "@example.test", "password-12345", "JUnit", true)
            .accessToken();

    var pending = auth.access(token).orElseThrow();
    assertThat(pending.student()).isFalse();
    assertThat(pending.restricted()).isFalse();
    mvc.perform(get("/api/v1/calls/private").header("Authorization", "Bearer " + token))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("ACADEMIC_VERIFICATION_REQUIRED"));

    UUID user = pending.actor().id();
    db.jdbc.update(
        "UPDATE academic_identity SET status='STUDENT_VERIFIED',method='TEST_FIXTURE',confidence='TEST_FIXTURE' WHERE user_id=?",
        user);
    assertThat(auth.access(token).orElseThrow().student()).isTrue();
    mvc.perform(get("/api/v1/calls/private").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    UUID moderationCase = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO moderation_case(id,user_id,rule,source,dedupe_key) VALUES (?,?,'TEST','TEST',?)",
        moderationCase,
        user,
        "access-" + tag);
    db.jdbc.update(
        "INSERT INTO moderation_action(id,case_id,kind,ends_at) VALUES (?,?,'SUSPENSION',now()+interval '1 day')",
        UUID.randomUUID(),
        moderationCase);
    assertThat(auth.access(token).orElseThrow().restricted()).isTrue();
    mvc.perform(get("/api/v1/calls/private").header("Authorization", "Bearer " + token))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("MODERATION_ACTION"));
    mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    db.jdbc.update("UPDATE moderation_action SET revoked_at=now() WHERE case_id=?", moderationCase);
    assertThat(auth.access(token).orElseThrow().restricted()).isFalse();
    mvc.perform(get("/api/v1/calls/private").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    assertThat(auth.access("not-a-token")).isEmpty();
  }
}

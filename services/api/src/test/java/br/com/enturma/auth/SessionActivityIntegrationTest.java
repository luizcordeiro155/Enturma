package br.com.enturma.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.enturma.common.Db;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

/** The sessions list says where each login runs, which one is this device and which are online. */
@SpringBootTest(properties = "enturma.planner.worker-delay=3600000")
@AutoConfigureMockMvc
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class SessionActivityIntegrationTest {
  @Autowired AuthService auth;
  @Autowired Db db;
  @Autowired MockMvc mvc;

  @Test
  void sessionsReportPlatformClientCurrentAndLastActivity() throws Exception {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    var phone =
        auth.register("Sessões", "sessoes_" + tag, tag + "@example.test", "password-12345", "JUnit", true);
    String web = auth.login(tag + "@example.test", "password-12345", "Navegador web").accessToken();

    mvc.perform(
            get("/api/v1/users/me")
                .header("Authorization", "Bearer " + phone.accessToken())
                .header("X-Enturma-Platform", "android")
                .header("X-Enturma-Client-Name", "Android"))
        .andExpect(status().isOk());
    mvc.perform(
            get("/api/v1/auth/sessions")
                .header("Authorization", "Bearer " + web)
                .header("X-Enturma-Platform", "web")
                .header("X-Enturma-Client-Name", "Edge   no Windows <b>"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[?(@.current == true)].platform").value("WEB"))
        .andExpect(jsonPath("$[?(@.current == true)].online").value(true))
        .andExpect(jsonPath("$[?(@.current == true)].clientName").value("Edge no Windows b"))
        .andExpect(jsonPath("$[?(@.current == false)].platform").value("ANDROID"))
        .andExpect(jsonPath("$[?(@.current == false)].clientName").value("Android"))
        .andExpect(jsonPath("$[?(@.current == false)].online").value(true))
        .andExpect(jsonPath("$[0].lastSeenAt").isNotEmpty());

    db.jdbc.update(
        "UPDATE user_session SET last_seen_at=now()-interval '2 hours' WHERE user_id=? AND"
            + " platform='ANDROID'",
        phone.userId());
    mvc.perform(get("/api/v1/auth/sessions").header("Authorization", "Bearer " + web))
        .andExpect(jsonPath("$[?(@.current == false)].online").value(false))
        .andExpect(jsonPath("$[?(@.current == true)].platform").value("WEB"));

    // Unknown platform values are ignored rather than stored.
    mvc.perform(
            get("/api/v1/users/me")
                .header("Authorization", "Bearer " + phone.accessToken())
                .header("X-Enturma-Platform", "toaster"))
        .andExpect(status().isOk());
  }
}

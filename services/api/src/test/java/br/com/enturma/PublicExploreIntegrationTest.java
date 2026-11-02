package br.com.enturma;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import br.com.enturma.academics.CatalogService;
import br.com.enturma.auth.*;
import br.com.enturma.common.Db;
import br.com.enturma.forum.ForumService;
import br.com.enturma.study.StudyService;
import br.com.enturma.users.ProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "CHAT_ACCOUNT_MASTER_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
@AutoConfigureMockMvc
@Transactional
class PublicExploreIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired AuthService auth;
  @Autowired ForumService forum;
  @Autowired StudyService study;
  @Autowired ProfileService profiles;
  @Autowired CatalogService catalog;
  @Autowired Db db;
  @Autowired ObjectMapper json;
  Actor author;
  UUID post;

  @BeforeEach
  void setup() {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    var credentials =
        auth.register(
            "Autor público",
            "public_" + suffix,
            suffix + "@example.test",
            "test-password-long",
            "JUnit");
    author = auth.authenticate(credentials.accessToken()).orElseThrow();
    db.jdbc.update(
        "UPDATE academic_identity SET"
            + " status='STUDENT_VERIFIED',method='TEST_FIXTURE',confidence='TEST_FIXTURE' WHERE"
            + " user_id=?",
        author.id());
    post =
        (UUID)
            ((Map<?, ?>)
                    forum.create(
                        author,
                        "Uma dúvida pública " + suffix,
                        "Conteúdo para explorar",
                        "ACADEMIC"))
                .get("id");
  }

  @Test
  void visitorsReadPublishedPostsButCannotMutateOrReadAccounts() throws Exception {
    var response =
        mvc.perform(get("/api/v1/public/explore/forum/" + post))
            .andExpect(status().isOk())
            .andReturn();
    var entry = json.readTree(response.getResponse().getContentAsString());
    assertThat(entry.get("body").asText()).isEqualTo("Conteúdo para explorar");
    assertThat(entry.has("email")).isFalse();
    assertThat(entry.has("passwordHash")).isFalse();
    assertThat(entry.get("profileDetails").isEmpty()).isTrue();
    assertThat(entry.get("hasAvatar").asBoolean()).isFalse();
    mvc.perform(get("/api/v1/public/explore/forum").param("q", post.toString()))
        .andExpect(status().isOk());
    mvc.perform(
            post("/api/v1/forum/" + post + "/comments")
                .contentType("application/json")
                .content("{\"body\":\"blocked\"}"))
        .andExpect(status().isUnauthorized());
    mvc.perform(
            put("/api/v1/forum/" + post + "/vote")
                .contentType("application/json")
                .content("{\"value\":1}"))
        .andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/friends")).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/public/explore/forum").contentType("application/json").content("{}"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void hiddenPostsAndDeletedCommentsAreNeverPublished() throws Exception {
    UUID comment =
        (UUID) ((Map<?, ?>) forum.comment(author, post, null, "Resposta visível")).get("id");
    mvc.perform(get("/api/v1/public/explore/forum/" + post + "/comments"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].body").value("Resposta visível"));
    forum.delete(author, comment);
    mvc.perform(get("/api/v1/public/explore/forum/" + post + "/comments"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items").isEmpty());
    mvc.perform(get("/api/v1/public/explore/forum/" + post + "/target/" + comment))
        .andExpect(status().isNotFound());
    forum.delete(author, post);
    mvc.perform(get("/api/v1/public/explore/forum/" + post)).andExpect(status().isNotFound());
    mvc.perform(get("/api/v1/public/explore/forum/" + post + "/comments"))
        .andExpect(status().isNotFound());
  }

  @Test
  void onlyOpenRoomMetadataIsPublicAndMembershipStaysProtected() throws Exception {
    UUID parent = null, period = null, subject = null;
    var entries = new ArrayList<CatalogService.Entry>();
    for (String kind :
        List.of("INSTITUTION", "CAMPUS", "COURSE", "CURRICULUM", "PERIOD", "SUBJECT")) {
      UUID id = UUID.randomUUID();
      entries.add(
          new CatalogService.Entry(
              id,
              kind,
              parent,
              "PUBLIC FIXTURE " + kind,
              null,
              kind.equals("CURRICULUM") ? "test-v1" : null,
              kind.equals("PERIOD") ? 1 : null,
              "https://example.test/catalog",
              "Isolated test",
              Instant.now().minusSeconds(10),
              LocalDate.now().minusDays(1),
              null,
              "VERIFIED"));
      if (kind.equals("PERIOD")) period = id;
      if (kind.equals("SUBJECT")) subject = id;
      parent = id;
    }
    catalog.importEntries(new Actor(author.id(), author.sessionId(), "ADMIN"), entries);
    profiles.enroll(author, period, List.of(subject), "EVENING", "");
    UUID room =
        (UUID) study.create(author, subject, null, "Sala pública de teste", 50, 10, 0).get("id");
    var result =
        mvc.perform(get("/api/v1/public/explore/rooms").param("subjectId", subject.toString()))
            .andExpect(status().isOk())
            .andReturn();
    var item = json.readTree(result.getResponse().getContentAsString()).get(0);
    assertThat(item.get("id").asText()).isEqualTo(room.toString());
    for (String field : List.of("hostId", "inviteCode", "shareCode", "messages", "members"))
      assertThat(item.has(field)).isFalse();
    mvc.perform(post("/api/v1/study-rooms/" + room + "/join")).andExpect(status().isUnauthorized());
    db.jdbc.update("UPDATE study_room SET entries_locked=true WHERE id=?", room);
    mvc.perform(get("/api/v1/public/explore/rooms").param("subjectId", subject.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isEmpty());
    mvc.perform(get("/api/v1/public/explore/rooms/" + room + "/banner"))
        .andExpect(status().isNotFound());
  }
}

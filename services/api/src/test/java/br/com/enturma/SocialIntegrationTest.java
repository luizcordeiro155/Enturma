package br.com.enturma;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.social.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "SOCIAL_ENABLED=true")
@AutoConfigureMockMvc
// Close scheduled workers before another integration context uses the same test database.
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
@Transactional
class SocialIntegrationTest {
  @Autowired Db db;
  @Autowired AuthService auth;
  @Autowired SocialPosts posts;
  @Autowired SocialPeople people;
  @Autowired SocialAccess access;
  @Autowired SocialReview review;
  @Autowired SocialMaintenance maintenance;
  @Autowired SocialCollections collections;
  @Autowired MockMvc mvc;
  @Autowired org.springframework.transaction.PlatformTransactionManager transactions;
  Actor a, b, c;

  Actor user() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    return auth.authenticate(
            auth.register(
                    "Social estudante",
                    "soc_" + tag,
                    tag + "@example.test",
                    "password-12345",
                    "JUnit")
                .accessToken())
        .orElseThrow();
  }

  @BeforeEach
  void setup() {
    a = user();
    b = user();
    c = user();
  }

  UUID publish(Actor author, String kind, String body) {
    UUID id = UUID.randomUUID();
    var draft =
        posts.draft(author, new SocialPosts.Draft(id, kind, body, "PUBLIC", null, 0, List.of()));
    posts.publish(author, id, ((Number) draft.get("version")).intValue());
    return id;
  }

  @Test
  void publicReleaseProbeRequiresBothMigrationsAndProtectedTables() throws Exception {
    mvc.perform(get("/api/v1/public/social-release"))
        .andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(content().json("{\"release\":\"social-figma-2026-11-13\",\"ready\":true}", true));
    db.jdbc.execute("ALTER TABLE social_collection DISABLE ROW LEVEL SECURITY");
    mvc.perform(get("/api/v1/public/social-release"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.ready").value(false));
    db.jdbc.execute("ALTER TABLE social_collection ENABLE ROW LEVEL SECURITY");
    db.jdbc.update("UPDATE flyway_schema_history SET success=false WHERE version='72'");
    mvc.perform(get("/api/v1/public/social-release"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.ready").value(false));
    // The test transaction rolls back the simulated incomplete rollout.
  }

  @Test
  void namedCollectionsArePrivateIdempotentAndRespectLostPostAccess() {
    UUID post = publish(a, "POST", "Ideia para estudar"), collection = UUID.randomUUID();
    collections.save(b, collection, new SocialCollections.Name("Estudos"));
    collections.save(b, collection, new SocialCollections.Name("Projetos"));
    collections.member(b, collection, post, new SocialCollections.Membership(true));
    collections.member(b, collection, post, new SocialCollections.Membership(true));
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_collection_item WHERE collection_id=?", Integer.class, collection)).isEqualTo(1);
    assertThat((List<?>) collections.list(b, post)).hasSize(1);
    assertThat((List<?>) collections.list(c, null)).isEmpty();
    var own = (Map<?, ?>) posts.feed(b, "for-you", "ALL", "", "", b.id(), "saved", collection);
    assertThat((List<?>) own.get("items")).hasSize(1);
    assertThatThrownBy(() -> posts.feed(c, "for-you", "ALL", "", "", c.id(), "saved", collection)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> collections.save(c, collection, new SocialCollections.Name("Não é minha"))).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> collections.member(c, collection, post, new SocialCollections.Membership(false))).isInstanceOf(ApiException.class);
    db.jdbc.update("UPDATE social_profile SET private_account=true WHERE user_id=?", a.id());
    var privateFeed = (Map<?, ?>) posts.feed(b, "for-you", "ALL", "", "", b.id(), "saved", collection);
    assertThat((List<?>) privateFeed.get("items")).isEmpty();
    assertThatThrownBy(() -> collections.member(b, collection, post, new SocialCollections.Membership(true))).isInstanceOf(ApiException.class);
    // Removal remains possible after access is revoked, without reading the post.
    collections.member(b, collection, post, new SocialCollections.Membership(false));
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_collection_item WHERE collection_id=?", Integer.class, collection)).isZero();
  }

  @Test
  void unsavingRemovesMembershipButDeletingACollectionPreservesSavedPosts() {
    UUID post = publish(a, "POST", "Outra ideia"), collection = UUID.randomUUID();
    collections.save(b, collection, new SocialCollections.Name("Leituras"));
    collections.member(b, collection, post, new SocialCollections.Membership(true));
    posts.react(b, post, "SAVE", false);
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_collection_item WHERE collection_id=?", Integer.class, collection)).isZero();
    collections.member(b, collection, post, new SocialCollections.Membership(true));
    collections.remove(b, collection);
    collections.remove(b, collection);
    assertThat((List<?>) collections.list(b, null)).isEmpty();
    var saved = (Map<?, ?>) posts.feed(b, "for-you", "ALL", "", "", b.id(), "saved");
    assertThat((List<?>) saved.get("items")).hasSize(1);
  }

  @Test
  void socialHttpRoutesRequireAcademicAccessAndReadsAreRateLimited() throws Exception {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    var credentials =
        auth.register(
            "Pendente", "pending_" + tag, tag + "@example.test", "password-12345", "JUnit");
    Actor pending = auth.authenticate(credentials.accessToken()).orElseThrow();
    String bearer = "Bearer " + credentials.accessToken();
    mvc.perform(get("/api/v1/social/feed")).andExpect(status().isUnauthorized());
    for (String path :
        List.of("feed", "people", "drafts", "capabilities", "media/" + UUID.randomUUID())) {
      mvc.perform(get("/api/v1/social/" + path).header("Authorization", bearer))
          .andExpect(status().isForbidden())
          .andExpect(jsonPath("$.code").value("ACADEMIC_VERIFICATION_REQUIRED"));
    }
    UUID id = UUID.randomUUID();
    mvc.perform(
            put("/api/v1/social/drafts")
                .header("Authorization", bearer)
                .contentType("application/json")
                .content(
                    "{\"id\":\""
                        + id
                        + "\",\"kind\":\"POST\",\"body\":\"Teste\",\"visibility\":\"PUBLIC\",\"version\":0,\"mediaIds\":[]}"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("ACADEMIC_VERIFICATION_REQUIRED"));
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM social_post WHERE id=?)", id)).isFalse();
    // Only the test fixture grants access; the HTTP filter must observe the server state.
    db.jdbc.update(
        "UPDATE academic_identity SET"
            + " status='STUDENT_VERIFIED',method='TEST_FIXTURE',confidence='TEST_FIXTURE' WHERE"
            + " user_id=?",
        pending.id());
    mvc.perform(get("/api/v1/social/feed").header("Authorization", bearer))
        .andExpect(status().isOk());
    db.jdbc.update(
        "UPDATE rate_limit SET hits=180,resets_at=now()+interval '1 minute' WHERE bucket=?",
        "social-read:" + Tokens.hash(pending.id().toString()));
    mvc.perform(get("/api/v1/social/feed").header("Authorization", bearer))
        .andExpect(status().isTooManyRequests())
        .andExpect(header().string("Retry-After", "60"));
    // The Social quota must not prevent session recovery or academic status checks.
    mvc.perform(get("/api/v1/auth/academic/status").header("Authorization", bearer))
        .andExpect(status().isOk());
  }

  @Test
  void draftsArePrivateAndPublishingIsIdempotent() {
    UUID id = UUID.randomUUID();
    var d =
        posts.draft(
            a, new SocialPosts.Draft(id, "POST", "#Java @estudante", "PUBLIC", null, 0, List.of()));
    assertThatThrownBy(() -> posts.detail(b, id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> posts.ownDraft(b, id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> posts.publish(a, id, 1)).isInstanceOf(ApiException.class);
    posts.publish(a, id, 2);
    posts.publish(a, id, 2);
    assertThat(posts.detail(b, id).get("body")).isEqualTo("#Java @estudante");
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM social_fanout WHERE post_id=?", Integer.class, id))
        .isEqualTo(1);
  }

  @Test
  @SuppressWarnings("unchecked")
  void declaredInterestsProduceDifferentFeedsWithoutUsingPrivateHistory() {
    UUID java = publish(c, "POST", "Projeto #java");
    UUID art = publish(c, "POST", "Projeto #arte");
    people.preferences(
        a, false, true, true, List.of("java"), false, List.of("feed", "clips", "create"));
    people.preferences(
        b, false, true, true, List.of("arte"), false, List.of("feed", "clips", "create"));
    var first = (Map<String, Object>) posts.feed(a, "for-you", "POST", "", "", null, "posts");
    var second = (Map<String, Object>) posts.feed(b, "for-you", "POST", "", "", null, "posts");
    assertThat(((List<Map<String, Object>>) first.get("items")).getFirst().get("id"))
        .isEqualTo(java);
    assertThat(((List<Map<String, Object>>) second.get("items")).getFirst().get("id"))
        .isEqualTo(art);
    posts.react(a, java, "HIDE", true);
    first = (Map<String, Object>) posts.feed(a, "for-you", "POST", "", "", null, "posts");
    assertThat(((List<Map<String, Object>>) first.get("items")))
        .noneMatch(p -> java.equals(p.get("id")));
    // No verified academic identity: the campus tab must not guess from email or enrollment.
    var campus = (Map<String, Object>) posts.feed(a, "campus", "POST", "", "", null, "posts");
    assertThat((List<?>) campus.get("items")).isEmpty();
  }

  @Test
  void withdrawingConsentSerializesWithAnAlreadyStartedView() throws Exception {
    UUID id = publish(a, "POST", "Consentimento concorrente");
    people.preferences(b, false, true, true, List.of(), false, List.of("feed", "clips", "create"));
    posts.view(b, id, 1000, false);
    org.springframework.test.context.transaction.TestTransaction.flagForCommit();
    org.springframework.test.context.transaction.TestTransaction.end();
    var tx = new org.springframework.transaction.support.TransactionTemplate(transactions);
    var withdrawn = new CountDownLatch(1);
    var commit = new CountDownLatch(1);
    var readerPid = new CompletableFuture<Integer>();
    try (var executor = Executors.newFixedThreadPool(2)) {
      try {
        var withdrawal =
            executor.submit(
                () ->
                    tx.executeWithoutResult(
                        status -> {
                          people.preferences(
                              b,
                              false,
                              false,
                              true,
                              List.of(),
                              false,
                              List.of("feed", "clips", "create"));
                          withdrawn.countDown();
                          try {
                            assertThat(commit.await(15, TimeUnit.SECONDS)).isTrue();
                          } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            throw new IllegalStateException(e);
                          }
                        }));
        assertThat(withdrawn.await(10, TimeUnit.SECONDS)).isTrue();
        var view =
            executor.submit(
                () ->
                    tx.executeWithoutResult(
                        status -> {
                          readerPid.complete(
                              db.jdbc.queryForObject("SELECT pg_backend_pid()", Integer.class));
                          posts.view(b, id, 2500, true);
                        }));
        int pid = readerPid.get(5, TimeUnit.SECONDS);
        org.awaitility.Awaitility.await()
            .atMost(java.time.Duration.ofSeconds(5))
            .until(
                () ->
                    db.exists(
                        "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=? AND"
                            + " wait_event_type='Lock')",
                        pid));
        commit.countDown();
        withdrawal.get(10, TimeUnit.SECONDS);
        view.get(10, TimeUnit.SECONDS);
        assertThat(
                db.jdbc.queryForObject(
                    "SELECT count(*) FROM social_feedback WHERE user_id=?", Integer.class, b.id()))
            .isZero();
      } finally {
        commit.countDown();
      }
    } finally {
      posts.remove(a, id);
    }
  }

  @Test
  void privateFollowApprovalRemovalAndBlockingApplyEverywhere() {
    people.preferences(
        a, true, false, true, List.of("java"), false, List.of("feed", "clips", "create"));
    UUID id = publish(a, "POST", "Meu projeto");
    people.follow(b, a.id(), true);
    assertThatThrownBy(() -> posts.detail(b, id)).isInstanceOf(ApiException.class);
    people.decide(a, b.id(), true);
    assertThat(posts.detail(b, id).get("id")).isEqualTo(id);
    people.decide(a, b.id(), false);
    assertThatThrownBy(() -> posts.detail(b, id)).isInstanceOf(ApiException.class);
    people.follow(b, a.id(), true);
    people.decide(a, b.id(), true);
    db.jdbc.update("INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", a.id(), b.id());
    assertThatThrownBy(() -> posts.detail(b, id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> people.profile(b, a.id())).isInstanceOf(ApiException.class);
  }

  @Test
  void mentionSuggestionsPreferConnectionsAndExcludeBothBlockDirections() {
    people.follow(a, b.id(), true);
    String username = db.one("SELECT username FROM app_user WHERE id=?", b.id()).get("username").toString();
    assertThat(people.mentionSuggestions(a, "").toString()).contains(username);
    assertThat(people.mentionSuggestions(a, username).toString()).contains(username);
    db.jdbc.update("INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", b.id(), a.id());
    assertThat(people.mentionSuggestions(a, username).toString()).doesNotContain(username);
    db.jdbc.update("DELETE FROM user_block WHERE user_id=? AND blocked_id=?", b.id(), a.id());
    db.jdbc.update("INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", a.id(), b.id());
    assertThat(people.mentionSuggestions(a, "").toString()).doesNotContain(username);
    assertThatThrownBy(() -> people.mentionSuggestions(a, "a".repeat(81))).isInstanceOf(ApiException.class);
  }

  @Test
  void storyExpiryIsServerSideAndHighlightsAreExplicit() {
    UUID id = publish(a, "STORY", "Estudando");
    posts.view(b, id, 0, false);
    posts.view(b, id, 0, false);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM social_story_view WHERE post_id=?", Integer.class, id))
        .isEqualTo(1);
    db.jdbc.update("UPDATE social_post SET expires_at=now()-interval '1 second' WHERE id=?", id);
    assertThatThrownBy(() -> posts.detail(b, id)).isInstanceOf(ApiException.class);
    posts.highlight(a, id, "Aprendizado");
    assertThat(posts.detail(b, id).get("id")).isEqualTo(id);
    posts.highlight(a, id, null);
    assertThatThrownBy(() -> posts.detail(b, id)).isInstanceOf(ApiException.class);
  }

  @Test
  void retentionErasesOldStoriesButPreservesExplicitHighlights() {
    UUID expired = publish(a, "STORY", "Story antigo"), saved = publish(a, "STORY", "Meu destaque");
    posts.highlight(a, saved, "Semestre");
    db.jdbc.update(
        "UPDATE social_post SET expires_at=now()-interval '31 days' WHERE id IN (?,?)",
        expired,
        saved);
    maintenance.retention();
    assertThat(db.one("SELECT state,body FROM social_post WHERE id=?", expired))
        .containsEntry("state", "REMOVED")
        .containsEntry("body", "");
    assertThat(posts.detail(b, saved)).containsEntry("body", "Meu destaque");
    posts.highlight(a, saved, null);
    maintenance.retention();
    assertThatThrownBy(() -> posts.detail(b, saved)).isInstanceOf(ApiException.class);
  }

  @Test
  void reactionsAndCommentsAreIdempotentAndRecommendationsRequireConsent() {
    UUID id = publish(a, "POST", "#programação");
    posts.react(b, id, "LIKE", true);
    posts.react(b, id, "LIKE", true);
    assertThat(((Number) posts.detail(b, id).get("likes")).intValue()).isEqualTo(1);
    UUID comment = UUID.randomUUID();
    posts.comment(b, id, comment, "Muito bom", null);
    posts.comment(b, id, comment, "Muito bom", null);
    assertThat(((Number) posts.detail(b, id).get("comments")).intValue()).isEqualTo(1);
    posts.view(b, id, 5000, false);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM social_feedback WHERE user_id=?", Integer.class, b.id()))
        .isZero();
    people.preferences(b, false, true, true, List.of(), false, List.of("clips", "feed", "create"));
    posts.view(b, id, 5000, false);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM social_feedback WHERE user_id=?", Integer.class, b.id()))
        .isEqualTo(1);
    people.preferences(b, false, false, true, List.of(), false, List.of("feed", "clips", "create"));
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM social_feedback WHERE user_id=?", Integer.class, b.id()))
        .isZero();
  }

  @SuppressWarnings("unchecked")
  @Test
  void keysetPagesDoNotRepeatAndMuteHidesCandidates() {
    for (int i = 0; i < 24; i++) publish(a, "POST", "BuscaSocialExclusiva " + i);
    var first =
        (Map<String, Object>)
            posts.feed(b, "for-you", "POST", "BuscaSocialExclusiva", "", a.id(), "posts");
    var page = (List<Map<String, Object>>) first.get("items");
    assertThat(page).hasSize(20);
    var second =
        (Map<String, Object>)
            posts.feed(
                b,
                "for-you",
                "POST",
                "BuscaSocialExclusiva",
                (String) first.get("nextCursor"),
                a.id(),
                "posts");
    assertThat((List<?>) second.get("items")).hasSize(4);
    Set<Object> ids = new HashSet<>();
    page.forEach(p -> ids.add(p.get("id")));
    ((List<Map<String, Object>>) second.get("items"))
        .forEach(p -> assertThat(ids.add(p.get("id"))).isTrue());
    people.mute(b, a.id(), true);
    assertThat(
            (List<?>)
                ((Map<?, ?>)
                        posts.feed(
                            b, "for-you", "POST", "BuscaSocialExclusiva", "", a.id(), "posts"))
                    .get("items"))
        .isEmpty();
  }

  @Test
  void verificationRequiresIndependentAdminAndUnprocessedClipCannotPublish() {
    var request =
        (Map<?, ?>)
            review.request(
                a, new SocialReview.Reason("Projeto acadêmico e identidade verificáveis"));
    assertThatThrownBy(
            () ->
                review.decide(
                    b, (UUID) request.get("id"), new SocialReview.Decision("APPROVED", "Revisado")))
        .isInstanceOf(ApiException.class);
    review.decide(
        new Actor(c.id(), null, "ADMIN"),
        (UUID) request.get("id"),
        new SocialReview.Decision("APPROVED", "Identidade confirmada manualmente"));
    assertThat(
            db.one("SELECT verified FROM social_profile WHERE user_id=?", a.id()).get("verified"))
        .isEqualTo(true);
    UUID id = UUID.randomUUID();
    posts.draft(a, new SocialPosts.Draft(id, "CLIP", "Clipe", "PUBLIC", null, 0, List.of()));
    assertThatThrownBy(() -> posts.publish(a, id, 2)).isInstanceOf(ApiException.class);
  }

  @Test
  void storyDecorationsPersistPrivatelyAndAreErasedOnDeletion() {
    UUID id = UUID.randomUUID();
    var elements = List.of(new SocialPosts.StoryOverlay("Minha descoberta 🎓", .5, .2));
    var draft =
        posts.draft(
            a,
            new SocialPosts.Draft(
                id, "STORY", "Uma ideia", "PUBLIC", null, 0, List.of(), elements));
    assertThat(draft.get("storyOverlays").toString()).contains("Minha descoberta");
    assertThatThrownBy(() -> posts.ownDraft(b, id)).isInstanceOf(ApiException.class);
    posts.publish(a, id, ((Number) draft.get("version")).intValue());
    assertThat(posts.detail(b, id).get("storyOverlays").toString()).contains("Minha descoberta");
    posts.remove(a, id);
    assertThat(
            db.one("SELECT story_overlays FROM social_post WHERE id=?", id)
                .get("storyOverlays")
                .toString())
        .isEqualTo("[]");
    assertThatThrownBy(
            () ->
                posts.draft(
                    a,
                    new SocialPosts.Draft(
                        UUID.randomUUID(),
                        "STORY",
                        "Ideia",
                        "PUBLIC",
                        null,
                        0,
                        List.of(),
                        List.of(new SocialPosts.StoryOverlay("Fora da tela", 2, .5)))))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () ->
                posts.draft(
                    a,
                    new SocialPosts.Draft(
                        UUID.randomUUID(),
                        "POST",
                        "Ideia",
                        "PUBLIC",
                        null,
                        0,
                        List.of(),
                        elements)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void collectionQuotaAllowsRetryAndRenameButRejectsInvalidNames() {
    UUID first = UUID.randomUUID();
    collections.save(a, first, new SocialCollections.Name("Primeira"));
    for (int index = 1; index < 50; index++)
      collections.save(a, UUID.randomUUID(), new SocialCollections.Name("Coleção " + index));
    collections.save(a, first, new SocialCollections.Name("Renomeada"));
    assertThatThrownBy(() -> collections.save(a, UUID.randomUUID(), new SocialCollections.Name("Extra")))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> collections.save(a, first, new SocialCollections.Name(" ")))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> collections.save(a, first, new SocialCollections.Name("a".repeat(61))))
        .isInstanceOf(ApiException.class);
    assertThat(((List<?>) collections.list(a, null))).hasSize(50);
  }

  @Autowired br.com.enturma.auth.PersonalDataExport personalExport;

  @Test
  void collectionExportIncludesOnlyOwnersRecords() {
    UUID collection = UUID.randomUUID(), post = publish(a, "POST", "Fonte de pesquisa");
    collections.save(b, collection, new SocialCollections.Name("Pesquisa privada"));
    collections.member(b, collection, post, new SocialCollections.Membership(true));
    assertThat(personalExport.sections()).contains("social-collections", "social-collection-items");
    for (String section : List.of("social-collections", "social-collection-items")) {
      assertThat((List<?>) ((Map<?, ?>) personalExport.export(b, section, 0).getBody()).get("items")).hasSize(1);
      assertThat((List<?>) ((Map<?, ?>) personalExport.export(c, section, 0).getBody()).get("items")).isEmpty();
    }
  }

  @Test
  void privateCollectionRowsStayHiddenAfterAnAccidentalDatabaseGrant() throws Exception {
    UUID collection = UUID.randomUUID();
    collections.save(a, collection, new SocialCollections.Name("Privada"));
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_collection WHERE id=?", Integer.class, collection)).isEqualTo(1);
    db.jdbc.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
      String role = "collection_probe_" + UUID.randomUUID().toString().replace("-", "");
      try (var statement = connection.createStatement()) {
        statement.execute("CREATE ROLE " + role + " NOLOGIN");
        statement.execute("GRANT USAGE ON SCHEMA public TO " + role);
        statement.execute("GRANT SELECT ON public.social_collection,public.social_collection_item TO " + role);
        statement.execute("SET LOCAL ROLE " + role);
        try (var result = statement.executeQuery("SELECT count(*) FROM public.social_collection")) {
          result.next();
          assertThat(result.getInt(1)).isZero();
        }
        statement.execute("RESET ROLE");
      }
      return null;
    });
  }
}

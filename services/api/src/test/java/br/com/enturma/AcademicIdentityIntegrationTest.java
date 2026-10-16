package br.com.enturma;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import br.com.enturma.academics.*;
import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.users.ProfileService;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "enturma.mail-enabled=true")
@AutoConfigureMockMvc
@org.springframework.test.annotation.DirtiesContext(classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class AcademicIdentityIntegrationTest {
  @Autowired AcademicIdentityService identities;
  @Autowired AuthService auth;
  @Autowired CatalogService catalog;
  @Autowired ProfileService profiles;
  @Autowired Db db;
  @Autowired MockMvc mvc;
  // Tests inspect the queued link without sending real email or racing a worker.
  @MockitoBean EmailWorker worker;
  Actor user, admin;
  AuthService.Credentials credentials;
  UUID institution, campus;
  String domain;

  AuthService.Credentials register(String mailbox) {
    String tag = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    return auth.register("Estudante", "acad_" + tag, mailbox == null ? tag + "@example.test" : mailbox, "test-password-long", "JUnit");
  }

  @BeforeEach void setup() {
    credentials = register(null);
    user = auth.authenticate(credentials.accessToken()).orElseThrow();
    Actor operator = auth.authenticate(register(null).accessToken()).orElseThrow();
    admin = new Actor(operator.id(), operator.sessionId(), "ADMIN");
    institution = UUID.randomUUID();
    campus = UUID.randomUUID();
    catalog.importEntries(admin, List.of(entry(institution, "INSTITUTION", null), entry(campus, "CAMPUS", institution)));
    domain = "student-" + UUID.randomUUID().toString().substring(0, 8) + ".example.test";
    identities.saveDomain(admin, institution, domain, "APPROVED", false, false, "https://example.test/official-student-email");
    identities.choose(user, institution, campus);
  }

  CatalogService.Entry entry(UUID id, String kind, UUID parent) {
    return new CatalogService.Entry(id, kind, parent, "TESTE SINTÉTICO " + id, null, null, null,
        "https://example.test/catalog", "Fixture exclusiva de testes", Instant.now(), LocalDate.now().minusDays(1), null, "VERIFIED");
  }

  String send(Actor actor, String email) {
    identities.sendEmail(actor, email);
    String body = (String) db.one("SELECT body FROM email_outbox WHERE academic_verification_user=? AND sent_at IS NULL ORDER BY created_at DESC LIMIT 1", actor.id()).get("body");
    return body.substring(body.indexOf("#token=") + 7).split("\\s")[0];
  }

  void code(Runnable run, String expected) {
    assertThatThrownBy(run::run).isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.code).isEqualTo(expected));
  }

  @Test void newAccountCannotAccessStudentEndpointsButCanRestoreAndVerify() throws Exception {
    assertThat(identities.status(user)).containsEntry("status", "PENDING").containsEntry("accessAllowed", false);
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM academic_legacy_snapshot WHERE user_id=?)", user.id())).isFalse();
    for (String path : List.of("/study-rooms", "/rides", "/friends", "/notifications"))
      mvc.perform(get("/api/v1" + path).header("Authorization", "Bearer " + credentials.accessToken()))
          .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACADEMIC_VERIFICATION_REQUIRED"));
    mvc.perform(get("/api/v1/auth/academic/status").header("Authorization", "Bearer " + credentials.accessToken()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING"));
    var renewed = auth.refresh(credentials.refreshToken());
    assertThat(auth.authenticate(renewed.accessToken())).isPresent();
    assertThat(auth.studentAccess(user)).isFalse();
  }

  @Test void exactDomainAndRealSingleUseConfirmationAreRequired() throws Exception {
    code(() -> identities.sendEmail(user, "x@gmail.com"), "ACADEMIC_DOMAIN_NOT_ALLOWED");
    code(() -> identities.sendEmail(user, "x@evil" + domain), "ACADEMIC_DOMAIN_NOT_ALLOWED");
    String token = send(user, "Pessoa@" + domain.toUpperCase(Locale.ROOT));
    assertThat(identities.status(user)).containsEntry("status", "EMAIL_PENDING").containsEntry("accessAllowed", false);
    assertThat(db.one("SELECT token_hash FROM academic_verification_token WHERE user_id=?", user.id()).get("tokenHash"))
        .isEqualTo(Tokens.hash(token)).isNotEqualTo(token);
    mvc.perform(post("/api/v1/auth/academic/confirm").contentType("application/json").content("{\"token\":\"" + token + "\"}"))
        .andExpect(status().isNoContent());
    assertThat(identities.status(user)).containsEntry("status", "STUDENT_VERIFIED")
        .containsEntry("confidence", "AUTHORIZED_EMAIL_CONTROL").containsEntry("campusId", campus).containsEntry("accessAllowed", true);
    assertThat(auth.authenticate(credentials.accessToken())).isPresent();
    assertThat(db.one("SELECT email_verified FROM app_user WHERE id=?", user.id())).containsEntry("emailVerified", false);
    code(() -> identities.confirm(token), "ACADEMIC_TOKEN_INVALID");
    mvc.perform(get("/api/v1/friends").header("Authorization", "Bearer " + credentials.accessToken())).andExpect(status().isOk());
  }

  @Test void pendingAccountCanEraseItsOwnVerificationDataWithoutStudentAccess() throws Exception {
    for (boolean hasDocument : List.of(false, true)) {
      var account = register(null);
      Actor pending = auth.authenticate(account.accessToken()).orElseThrow();
      identities.choose(pending, institution, campus);
      identities.askSupport(pending, "Solicitação sintética de suporte acadêmico.");
      if (hasDocument)
        identities.submitDocument(pending, "application/pdf", "%PDF-1.4\nFixture de teste\n%%EOF".getBytes(StandardCharsets.US_ASCII));
      else send(pending, "erase-" + pending.id() + "@" + domain);
      mvc.perform(get("/api/v1/account/privacy/deletion").header("Authorization", "Bearer " + account.accessToken()))
          .andExpect(status().isOk());
      mvc.perform(delete("/api/v1/account/privacy/deletion/now").header("Authorization", "Bearer " + account.accessToken()))
          .andExpect(status().isOk()).andExpect(jsonPath("$.deleted").value(true));
      for (String table : List.of("academic_identity", "academic_verification_token", "academic_verification_document",
          "academic_verification_support", "academic_verification_audit", "account_token"))
        assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM " + table + " WHERE user_id=?)", pending.id())).as(table).isFalse();
      assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM email_outbox WHERE academic_verification_user=?)", pending.id())).isFalse();
      assertThat(auth.authenticate(account.accessToken())).isEmpty();
      assertThat(identities.status(user)).containsEntry("status", "PENDING");
    }
  }

  @Test void subdomainsRequireExplicitApprovalAndCannotMatchSuffixLookalikes() {
    code(() -> identities.sendEmail(user, "x@alunos." + domain), "ACADEMIC_DOMAIN_NOT_ALLOWED");
    identities.saveDomain(admin, institution, domain, "APPROVED", false, true, "https://example.test/subdomains");
    identities.confirm(send(user, "x@alunos." + domain));
    assertThat(auth.studentAccess(user)).isTrue();
    assertThat(AcademicIdentityService.matchesDomain("evil" + domain, domain, true)).isFalse();
    assertThat(AcademicIdentityService.matchesDomain(domain + ".evil.test", domain, true)).isFalse();
  }

  @Test void sharedDomainMustBeAssociatedWithEachInstitution() {
    UUID second = UUID.randomUUID();
    catalog.importEntries(admin, List.of(entry(second, "INSTITUTION", null)));
    Actor peer = auth.authenticate(register(null).accessToken()).orElseThrow();
    identities.choose(peer, second, null);
    code(() -> identities.sendEmail(peer, "x@" + domain), "ACADEMIC_DOMAIN_NOT_ALLOWED");
    assertThatThrownBy(() -> identities.saveDomain(admin, second, domain, "APPROVED", true, false, "https://example.test/shared"))
        .isInstanceOf(ApiException.class);
    identities.saveDomain(admin, institution, domain, "APPROVED", true, false, "https://example.test/shared");
    identities.saveDomain(admin, second, domain, "APPROVED", true, false, "https://example.test/shared");
    identities.confirm(send(peer, "x@" + domain));
    assertThat(auth.studentAccess(peer)).isTrue();
  }

  @Test void expiredInvalidAndDisabledDomainTokensNeverApprove() {
    code(() -> identities.confirm("not-a-valid-token"), "ACADEMIC_TOKEN_INVALID");
    String token = send(user, "x@" + domain);
    db.jdbc.update("UPDATE academic_verification_token SET expires_at=now()-interval '1 second' WHERE user_id=?", user.id());
    code(() -> identities.confirm(token), "ACADEMIC_TOKEN_EXPIRED");
    db.jdbc.update("UPDATE academic_verification_token SET expires_at=now()+interval '5 minutes' WHERE user_id=?", user.id());
    identities.saveDomain(admin, institution, domain, "DISABLED", false, false, "https://example.test/disabled");
    code(() -> identities.confirm(token), "ACADEMIC_TOKEN_EXPIRED");
    assertThat(auth.studentAccess(user)).isFalse();
  }

  @Test void resendReplacesTokenAndHonorsCooldownAndAttemptLimit() {
    String original = send(user, "x@" + domain);
    code(() -> identities.sendEmail(user, "x@" + domain), "ACADEMIC_RESEND_WAIT");
    db.jdbc.update("UPDATE academic_verification_token SET created_at=now()-interval '2 minutes' WHERE user_id=?", user.id());
    String replacement = send(user, "x@" + domain);
    assertThat(replacement).isNotEqualTo(original);
    code(() -> identities.confirm(original), "ACADEMIC_TOKEN_INVALID");
    db.jdbc.update("UPDATE academic_verification_token SET created_at=now()-interval '2 minutes' WHERE user_id=?", user.id());
    db.jdbc.update("UPDATE rate_limit SET hits=5 WHERE bucket=?", "academic:email:" + user.id());
    code(() -> identities.sendEmail(user, "x@" + domain), "ACADEMIC_RATE_LIMITED");
    identities.confirm(replacement);
    assertThat(auth.studentAccess(user)).isTrue();
  }

  @Test void concurrentClaimsApproveOnlyOneOwner() throws Exception {
    Actor other = auth.authenticate(register(null).accessToken()).orElseThrow();
    identities.choose(other, institution, null);
    String first = send(user, "same@" + domain), second = send(other, "same@" + domain);
    try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
      var gate = new CountDownLatch(1);
      var tasks = List.of(first, second).stream().map(token -> pool.submit(() -> {
        gate.await();
        try { identities.confirm(token); return true; } catch (ApiException e) {
          assertThat(e.code).isEqualTo("ACADEMIC_EMAIL_IN_USE"); return false;
        }
      })).toList();
      gate.countDown();
      assertThat(List.of(tasks.get(0).get(15, TimeUnit.SECONDS), tasks.get(1).get(15, TimeUnit.SECONDS)))
          .containsExactlyInAnyOrder(true, false);
    }
    assertThat(db.list("SELECT user_id FROM academic_identity WHERE academic_email=? AND status='STUDENT_VERIFIED'", "same@" + domain)).hasSize(1);
  }

  @Test void duplicateVerifiedEmailCannotBeRequestedAgain() {
    identities.confirm(send(user, "x@" + domain));
    Actor other = auth.authenticate(register(null).accessToken()).orElseThrow();
    identities.choose(other, institution, null);
    code(() -> identities.sendEmail(other, "x@" + domain), "ACADEMIC_EMAIL_IN_USE");
  }

  UUID document() {
    identities.submitDocument(user, "application/pdf", "%PDF-1.4\nTest fixture only\n%%EOF".getBytes(StandardCharsets.US_ASCII));
    return (UUID) identities.status(user).get("requestId");
  }

  @Test void documentsStayPrivateAndAreDeletedAfterAdministrativeReview() throws Exception {
    UUID request = document();
    assertThat(identities.status(user)).containsEntry("status", "PENDING_REVIEW").containsEntry("accessAllowed", false);
    code(() -> identities.document(user, user.id(), request), "FORBIDDEN");
    mvc.perform(get("/api/v1/admin/academic-verification/" + user.id() + "/documents/" + request))
        .andExpect(status().isUnauthorized());
    assertThat(identities.document(admin, user.id(), request).get("content")).isInstanceOf(byte[].class);
    code(() -> identities.review(new Actor(user.id(), user.sessionId(), "ADMIN"), user.id(), request, true, "Comprovante válido"), "FORBIDDEN");
    identities.review(admin, user.id(), request, true, "Vínculo conferido no comprovante");
    assertThat(identities.status(user)).containsEntry("accessAllowed", true).containsEntry("confidence", "ENROLLMENT_DOCUMENT_REVIEWED");
    assertThat(db.list("SELECT user_id FROM academic_verification_document WHERE user_id=?", user.id())).isEmpty();
    code(() -> identities.review(admin, user.id(), request, false, "Revisão antiga"), "ACADEMIC_REVIEW_CHANGED");
  }

  @Test void rejectionCanBeCorrectedAndExpiredDocumentsArePurged() {
    UUID request = document();
    identities.review(admin, user.id(), request, false, "Comprovante sem identificação da instituição");
    assertThat(identities.status(user)).containsEntry("status", "REJECTED").containsEntry("accessAllowed", false);
    UUID corrected = document();
    assertThat(corrected).isNotEqualTo(request);
    db.jdbc.update("UPDATE academic_verification_document SET expires_at=now()-interval '1 second' WHERE user_id=?", user.id());
    identities.purgeExpiredDocuments();
    assertThat(identities.status(user)).containsEntry("status", "REJECTED").containsEntry("requestId", null);
  }

  @Test void invalidAndOversizedDocumentsAreRejectedWithoutChangingIdentity() {
    assertThatThrownBy(() -> identities.submitDocument(user, "application/pdf", "<html>university</html>".getBytes(StandardCharsets.US_ASCII)))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> identities.submitDocument(user, "application/pdf", new byte[2 * 1024 * 1024 + 1]))
        .isInstanceOf(ApiException.class);
    assertThat(identities.status(user)).containsEntry("status", "PENDING");
    code(() -> identities.saveDomain(user, institution, "evil.test", "APPROVED", false, false, "https://evil.test"), "FORBIDDEN");
  }

  @Test void changingInstitutionInvalidatesOutstandingProof() {
    String token = send(user, "x@" + domain);
    identities.choose(user, institution, campus);
    code(() -> identities.confirm(token), "ACADEMIC_TOKEN_INVALID");
    assertThat(auth.studentAccess(user)).isFalse();
  }

  @Test void legacyCompatibilityDoesNotAlterEmailOrSessionOrProfile() throws Exception {
    for (String provider : List.of("gmail.com", "outlook.com", domain)) {
      var c = register(UUID.randomUUID() + "@" + provider);
      var actor = auth.authenticate(c.accessToken()).orElseThrow();
      // Represents the exact migration snapshot, exercised separately by the migration test.
      db.jdbc.update("UPDATE academic_identity SET status='LEGACY_APPROVED',method='COMPATIBILITY',confidence='LEGACY_ACCESS_ONLY' WHERE user_id=?", actor.id());
      assertThat(auth.studentAccess(actor)).isTrue();
      assertThat(auth.authenticate(auth.refresh(c.refreshToken()).accessToken())).isPresent();
      assertThat(db.one("SELECT email_verified,name FROM app_user WHERE id=?", actor.id()))
          .containsEntry("emailVerified", false).containsEntry("name", "Estudante");
      assertThatThrownBy(() -> identities.choose(actor, institution, campus)).isInstanceOf(ApiException.class);
    }
  }
}

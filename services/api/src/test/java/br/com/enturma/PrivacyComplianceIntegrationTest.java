package br.com.enturma;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.privacy.DataRetention;
import br.com.enturma.privacy.LegalConsents;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** LGPD duties that code can prove: consent records, complete access, retention and passwords. */
@SpringBootTest(properties = "enturma.planner.worker-delay=3600000")
// A context left running would let its background workers pick up other classes' jobs.
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class PrivacyComplianceIntegrationTest {
  @Autowired Db db;
  @Autowired AuthService auth;
  @Autowired LegalConsents consents;
  @Autowired DataRetention retention;
  @Autowired PersonalDataExport personalExport;

  String tag() {
    return UUID.randomUUID().toString().substring(0, 8);
  }

  Actor register(boolean accepted) {
    String tag = tag();
    return auth.authenticate(
            auth.register(
                    "Titular", "lgpd_" + tag, tag + "@example.test", "password-12345", "JUnit", accepted)
                .accessToken())
        .orElseThrow();
  }

  @SuppressWarnings("unchecked")
  static List<Map<String, Object>> history(Map<String, Object> view) {
    return (List<Map<String, Object>>) view.get("history");
  }

  @Test
  void acceptingAtSignUpRecordsTermsPrivacyAndAgeWithTheirVersion() {
    Actor a = register(true);
    var view = consents.view(a);
    assertThat(view).containsEntry("current", LegalConsents.VERSION).containsEntry("accepted", true);
    assertThat(history(view))
        .extracting(r -> r.get("document"))
        .containsExactlyInAnyOrder("TERMS", "PRIVACY", "AGE_18");
    assertThat(history(view)).allSatisfy(r -> assertThat(r).containsEntry("version", LegalConsents.VERSION));
  }

  @Test
  void anAccountWithoutRecordedConsentCanAcceptTheCurrentVersionOnly() {
    Actor a = register(false);
    assertThat(consents.view(a)).containsEntry("accepted", false);
    assertThatThrownBy(() -> consents.accept(a, "2020-01-01")).isInstanceOf(ApiException.class);
    consents.accept(a, LegalConsents.VERSION);
    assertThat(consents.view(a)).containsEntry("accepted", true);
    // Accepting again keeps one record per document and version.
    consents.accept(a, LegalConsents.VERSION);
    assertThat(history(consents.view(a))).hasSize(2);
  }

  @Test
  void newPasswordsNeedEightToSixtyFourCharacters() {
    String tag = tag();
    assertThatThrownBy(() -> auth.register("A", "pw_" + tag, tag + "@example.test", "1234567", "JUnit"))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("8 a 64");
    assertThatThrownBy(
            () -> auth.register("A", "pw_" + tag, tag + "@example.test", "x".repeat(65), "JUnit"))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () -> auth.register("A", "pw_" + tag, tag + "@example.test", "12345678", "JUnit"))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("comum");
    assertThat(auth.register("A", "pw_" + tag, tag + "@example.test", "x".repeat(40), "JUnit"))
        .isNotNull();
  }

  @Test
  void retentionRemovesOnlyWhatOutlivedItsPurpose() {
    Actor a = register(true);
    String tag = tag();
    db.jdbc.update(
        "INSERT INTO rate_limit(bucket,hits,resets_at) VALUES (?,1,now()-interval '3 days'),(?,1,now()+interval '1 hour')",
        "old:" + tag,
        "live:" + tag);
    db.jdbc.update(
        "INSERT INTO user_session(id,user_id,device,access_hash,access_expires_at,refresh_hash,expires_at,revoked_at,created_at)"
            + " VALUES (?,?,'old',?,now()-interval '60 days',?,now()-interval '40 days',now()-interval '40 days',now()-interval '90 days')",
        UUID.randomUUID(),
        a.id(),
        "a" + tag,
        "r" + tag);
    db.jdbc.update(
        "INSERT INTO email_outbox(id,recipient,subject,body,created_at,sent_at) VALUES"
            + " (?,'x@example.test','old','link',now()-interval '40 days',now()-interval '40 days'),"
            + " (?,'x@example.test','new','link',now(),now())",
        UUID.randomUUID(),
        UUID.randomUUID());
    UUID oldRead = UUID.randomUUID(), recent = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO notification(id,user_id,message,read_at,created_at) VALUES"
            + " (?,?,'velha',now()-interval '200 days',now()-interval '200 days'),(?,?,'nova',null,now())",
        oldRead,
        a.id(),
        recent,
        a.id());
    retention.run();
    assertThat(count("SELECT count(*) FROM rate_limit WHERE bucket=?", "old:" + tag)).isZero();
    assertThat(count("SELECT count(*) FROM rate_limit WHERE bucket=?", "live:" + tag)).isOne();
    assertThat(count("SELECT count(*) FROM user_session WHERE access_hash=?", "a" + tag)).isZero();
    assertThat(count("SELECT count(*) FROM user_session WHERE user_id=? AND revoked_at IS NULL", a.id()))
        .isOne();
    assertThat(count("SELECT count(*) FROM email_outbox WHERE subject='old' AND sent_at<now()-interval '31 days'"))
        .isZero();
    assertThat(count("SELECT count(*) FROM email_outbox WHERE subject='new'")).isPositive();
    assertThat(count("SELECT count(*) FROM notification WHERE id=?", oldRead)).isZero();
    assertThat(count("SELECT count(*) FROM notification WHERE id=?", recent)).isOne();
  }

  int count(String sql, Object... args) {
    return db.jdbc.queryForObject(sql, Integer.class, args);
  }

  /**
   * Access and portability (LGPD art. 18): every table that points at a person is either exported to
   * that person or listed as an exemption with its reason. A new table must choose one.
   */
  @Test
  void everyTableAboutAPersonIsExportedOrDeliberatelyExempt() {
    var tables =
        new TreeSet<>(
            db.jdbc.queryForList(
                "SELECT DISTINCT tc.table_name FROM information_schema.table_constraints tc JOIN"
                    + " information_schema.constraint_column_usage ccu ON"
                    + " ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema"
                    + " WHERE tc.constraint_type='FOREIGN KEY' AND ccu.table_name='app_user' AND"
                    + " tc.table_schema=current_schema()",
                String.class));
    tables.removeAll(personalExport.exportedTables());
    tables.removeAll(PersonalDataExport.EXEMPT.keySet());
    assertThat(tables).as("tables with personal data missing from the export").isEmpty();
  }

  @Test
  void theExportNeverIncludesSecrets() {
    Actor a = register(true);
    for (String section : personalExport.sections()) {
      @SuppressWarnings("unchecked")
      var items =
          (List<Map<String, Object>>)
              ((Map<String, Object>) personalExport.export(a, section, 0).getBody()).get("items");
      for (var row : items)
        assertThat(row.keySet())
            .as(section)
            .noneMatch(k -> k.matches("(?i).*(hash|secret|password|token|cipher|nonce|salt).*"));
    }
    @SuppressWarnings("unchecked")
    var consentItems =
        (List<Map<String, Object>>)
            ((Map<String, Object>) personalExport.export(a, "privacy-consents", 0).getBody()).get("items");
    assertThat(consentItems).hasSize(3);
  }
}

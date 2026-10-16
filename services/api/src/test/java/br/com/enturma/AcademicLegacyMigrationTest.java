package br.com.enturma;

import static org.assertj.core.api.Assertions.*;
import java.util.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/** A disposable schema exercises the real migration against preexisting accounts. */
class AcademicLegacyMigrationTest {
  @Test void snapshotIsExactRepeatableAndPreservesUnverifiedUsersAndSessions() {
    String url = System.getenv().getOrDefault("TEST_DATABASE_URL", "jdbc:postgresql://localhost:55432/enturma_test");
    String username = System.getenv().getOrDefault("TEST_DATABASE_USERNAME", "enturma");
    String password = System.getenv("TEST_DATABASE_PASSWORD");
    String schema = "academic_migration_test_" + UUID.randomUUID().toString().replace("-", "");
    var source = new DriverManagerDataSource(url, username, password);
    var jdbc = new JdbcTemplate(source);
    jdbc.execute("CREATE SCHEMA " + schema);
    var scoped = new DriverManagerDataSource(url + (url.contains("?") ? "&" : "?") + "currentSchema=" + schema, username, password);
    var db = new JdbcTemplate(scoped);
    try {
      Flyway.configure().dataSource(scoped).defaultSchema(schema).schemas(schema).target("44").load().migrate();
      var oldUsers = new ArrayList<UUID>();
      for (String provider : List.of("gmail.com", "outlook.com", "students.example.test")) {
        UUID id = UUID.randomUUID(); oldUsers.add(id);
        db.update("INSERT INTO app_user(id,name,username,email,password_hash,role) VALUES (?,?,?,?,?,?)", id, "Perfil preservado", "old_" + oldUsers.size(), id + "@" + provider, "existing-password-hash", oldUsers.size()==3 ? "ADMIN" : "USER");
      }
      UUID session = UUID.randomUUID();
      db.update("INSERT INTO user_session(id,user_id,device,access_hash,access_expires_at,refresh_hash,expires_at) VALUES (?,?,?,'existing-access',now()+interval '10 minutes','existing-refresh',now()+interval '30 days')",session,oldUsers.getFirst(),"Desktop conectado");
      var beforeUsers = db.queryForList("SELECT * FROM app_user ORDER BY id");
      var beforeSessions = db.queryForList("SELECT * FROM user_session ORDER BY id");
      var flyway = Flyway.configure().dataSource(scoped).defaultSchema(schema).schemas(schema).load();
      flyway.migrate();
      assertThat(db.queryForList("SELECT * FROM app_user ORDER BY id")).isEqualTo(beforeUsers);
      assertThat(db.queryForList("SELECT * FROM user_session ORDER BY id")).isEqualTo(beforeSessions);
      assertThat(db.queryForList("SELECT status FROM academic_identity", String.class)).containsOnly("LEGACY_APPROVED").hasSize(3);
      UUID newcomer = UUID.randomUUID();
      db.update("INSERT INTO app_user(id,name,username,email,password_hash,created_at) VALUES (?,?,?,?,'new-password',now()-interval '10 years')",newcomer,"Novo estudante","new_student",newcomer+"@gmail.com");
      // An old-looking created_at cannot obtain compatibility approval.
      assertThat(db.queryForObject("SELECT status FROM academic_identity WHERE user_id=?",String.class,newcomer)).isEqualTo("PENDING");
      // Catalogs may be imported after the release. Only individually sourced names receive mappings.
      UUID late = UUID.randomUUID();
      db.update("INSERT INTO academic_entry(id,kind,name,source_url,source_name,verified_at,valid_from,status,external_id) VALUES (?,'INSTITUTION','Centro Universitário de Belo Horizonte','https://example.test','Test',now(),current_date,'VERIFIED',?)", late,late.toString());
      assertThat(db.queryForList("SELECT domain FROM academic_email_domain WHERE institution_id=?",String.class,late)).containsExactly("ulife.com.br");
      db.update("UPDATE academic_email_domain SET status='DISABLED' WHERE institution_id=?",late);
      db.update("UPDATE academic_institution SET normalized_name=normalized_name WHERE id=?",late);
      assertThat(db.queryForObject("SELECT status FROM academic_email_domain WHERE institution_id=?",String.class,late)).isEqualTo("DISABLED");
      flyway.migrate();
      assertThat(db.queryForObject("SELECT count(*) FROM academic_legacy_snapshot",Integer.class)).isEqualTo(3);
      assertThat(db.queryForObject("SELECT count(*) FROM app_user WHERE email_verified",Integer.class)).isZero();
      assertThat(db.queryForObject("SELECT status FROM academic_identity WHERE user_id=?",String.class,newcomer)).isEqualTo("PENDING");
    } finally {
      // Only this test's randomly named schema is removed; the application schema is untouched.
      jdbc.execute("DROP SCHEMA " + schema + " CASCADE");
    }
  }
}

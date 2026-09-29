package br.com.enturma;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.config.DatabaseUrlEnvironmentPostProcessor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

class DatabaseUrlEnvironmentPostProcessorTest {
  private final DatabaseUrlEnvironmentPostProcessor processor =
      new DatabaseUrlEnvironmentPostProcessor();

  private MockEnvironment process(String url) {
    var env = new MockEnvironment().withProperty("spring.datasource.url", url);
    processor.postProcessEnvironment(env, new SpringApplication());
    return env;
  }

  @Test
  void convertsPublicRailwayUriWithoutKeepingCredentialsInJdbcUrl() {
    var env =
        process(
            "postgresql://postgres:p%40ss+word%3A%2F@sample.proxy.rlwy.net:12345/railway?sslmode=require&connectTimeout=10");
    assertThat(env.getProperty("spring.datasource.url"))
        .isEqualTo(
            "jdbc:postgresql://sample.proxy.rlwy.net:12345/railway?sslmode=require&connectTimeout=10");
    assertThat(env.getProperty("spring.datasource.username")).isEqualTo("postgres");
    assertThat(env.getProperty("spring.datasource.password")).isEqualTo("p@ss+word:/");
  }

  @Test
  void acceptsPostgresAliasIpv6AndEncodedUsername() {
    var env = process("postgres://user%40tenant:secret@[::1]:5432/database");
    assertThat(env.getProperty("spring.datasource.url"))
        .isEqualTo("jdbc:postgresql://[::1]:5432/database");
    assertThat(env.getProperty("spring.datasource.username")).isEqualTo("user@tenant");
  }

  @Test
  void keepsExistingJdbcSettingsAndSeparateCredentials() {
    var env =
        new MockEnvironment()
            .withProperty(
                "spring.datasource.url",
                "jdbc:postgresql://localhost:5432/test?sslmode=verify-full")
            .withProperty("spring.datasource.username", "separate")
            .withProperty("spring.datasource.password", "separate-secret");
    processor.postProcessEnvironment(env, new SpringApplication());
    assertThat(env.getProperty("spring.datasource.url"))
        .isEqualTo("jdbc:postgresql://localhost:5432/test?sslmode=verify-full");
    assertThat(env.getProperty("spring.datasource.password")).isEqualTo("separate-secret");
  }

  @Test
  void usesCredentialsFromUriWhenSeparateSettingsAreBlank() {
    var env =
        new MockEnvironment()
            .withProperty("spring.datasource.url", "${DATABASE_URL}")
            .withProperty("DATABASE_URL", "postgresql://user:secret@localhost/test")
            .withProperty("spring.datasource.username", "")
            .withProperty("spring.datasource.password", "");
    processor.postProcessEnvironment(env, new SpringApplication());
    assertThat(env.getProperty("spring.datasource.username")).isEqualTo("user");
    assertThat(env.getProperty("spring.datasource.password")).isEqualTo("secret");
  }

  @Test
  void preservesSeparateCredentialsWhenUriHasNoUserInfo() {
    var env =
        new MockEnvironment()
            .withProperty("spring.datasource.url", "postgresql://localhost/test")
            .withProperty("spring.datasource.username", "separate")
            .withProperty("spring.datasource.password", "separate-secret");
    processor.postProcessEnvironment(env, new SpringApplication());
    assertThat(env.getProperty("spring.datasource.password")).isEqualTo("separate-secret");
  }

  @Test
  void rejectsInvalidUrlsWithoutLeakingCredentialsOrParserCause() {
    for (String value :
        new String[] {
          "",
          "https://user:secret@host/db",
          "postgresql://user:secret@host/db#fragment",
          "postgresql://user:sec%ret@host/db",
          "postgresql://user:secret@host",
          "postgresql://user:secret@host:99999/db",
          "\"postgresql://user:secret@host/db\""
        }) {
      assertThatThrownBy(() -> process(value))
          .isInstanceOf(IllegalStateException.class)
          .hasMessageContaining("DATABASE_URL invalida")
          .hasMessageNotContaining("secret")
          .hasNoCause();
    }
  }

  @Test
  void rejectsPrivateRailwayNetworkOnSquarecloudWithActionableMessage() {
    for (String value :
        new String[] {
          "postgresql://user:secret@postgres.railway.internal:5432/railway",
          "jdbc:postgresql://postgres.railway.internal:5432/railway"
        }) {
      var env = new MockEnvironment().withProperty("spring.datasource.url", value);
      env.setActiveProfiles("squarecloud");
      assertThatThrownBy(() -> processor.postProcessEnvironment(env, new SpringApplication()))
          .hasMessageContaining("DATABASE_PUBLIC_URL")
          .hasMessageNotContaining("secret")
          .hasNoCause();
    }
  }

  @Test
  void allowsPrivateNetworkOutsideSquarecloud() {
    assertThat(
            process("postgresql://user:secret@postgres.railway.internal:5432/railway")
                .getProperty("spring.datasource.url"))
        .isEqualTo("jdbc:postgresql://postgres.railway.internal:5432/railway");
  }
}

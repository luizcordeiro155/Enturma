package br.com.enturma;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import br.com.enturma.auth.*;
import br.com.enturma.auth.ExternalIdentityGateway.Profile;
import br.com.enturma.auth.ExternalIdentityGateway.Repository;
import br.com.enturma.common.*;
import br.com.enturma.users.PortfolioController;
import br.com.enturma.users.PortfolioGithub;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
// Release scheduled workers before another test context uses the same database.
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class ExternalAuthIntegrationTest {
  @Autowired AuthService auth;
  @Autowired ExternalAuthService external;
  @Autowired PortfolioGithub portfolioGithub;
  @Autowired PortfolioController portfolio;
  @Autowired Db db;
  @MockitoBean ExternalIdentityGateway gateway;
  String tag;

  @BeforeEach
  void setup() {
    tag = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    when(gateway.enabled(anyString())).thenReturn(true);
  }

  /** What Google answers for the code "g-" + who. */
  private void google(String who, String email, boolean verified, String name) {
    when(gateway.exchange(eq("GOOGLE"), eq("g-" + who), any()))
        .thenReturn(new Profile("sub-" + who + tag, email, email, verified, name));
  }

  private void github(String who, String login) {
    when(gateway.exchange(eq("GITHUB"), eq("h-" + who), any()))
        .thenReturn(new Profile("gh-" + who + tag, login, null, false, login));
  }

  private String mail(String who) {
    return who + tag + "@example.test";
  }

  private AuthService.Credentials register(String who) {
    return auth.register("Ana Souza", who + "_" + tag, mail(who), "test-password-long", "JUnit");
  }

  private Actor registered(String who, boolean verified) {
    var actor = auth.authenticate(register(who).accessToken()).orElseThrow();
    if (verified) db.jdbc.update("UPDATE app_user SET email_verified=true WHERE id=?", actor.id());
    return actor;
  }

  private Actor actor(String accessToken) {
    return auth.authenticate(accessToken).orElseThrow();
  }

  private Map<String, Object> account(UUID id) {
    return db.one(
        "SELECT name,username,email,email_verified,password_set,status FROM app_user WHERE id=?",
        id);
  }

  private static Repository repo(String fullName, boolean fork, boolean archived) {
    return new Repository(
        fullName,
        fullName.substring(fullName.indexOf('/') + 1),
        "Sobre " + fullName,
        "",
        "TypeScript",
        List.of("react", "typescript"),
        3,
        fork,
        archived,
        "2026-11-20T10:00:00Z");
  }

  @SuppressWarnings("unchecked")
  private List<String> projectNames(Actor a) {
    var view = (Map<String, Object>) portfolio.mine(a);
    var names = new ArrayList<String>();
    for (var project : (Iterable<com.fasterxml.jackson.databind.JsonNode>) view.get("projects"))
      names.add(project.path("name").asText());
    return names;
  }

  @Test
  void aNewPersonSignsUpWithGoogleOnlyAfterAcceptingTheTerms() {
    String email = mail("nova");
    google("nova", email, true, "Nova Pessoa Çã");
    assertThatThrownBy(() -> external.google("g-nova", null, "JUnit", false))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("GOOGLE_SIGNUP_NEEDS_TERMS"));
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM app_user WHERE email=?)", email)).isFalse();

    var credentials = external.google("g-nova", null, "JUnit", true);
    assertThat(credentials.created()).isTrue();
    var row = account(credentials.userId());
    assertThat(row.get("email")).isEqualTo(email);
    assertThat(row.get("name")).isEqualTo("Nova Pessoa Çã");
    // Google already proved the address, and there is no password to sign in with
    assertThat(row.get("emailVerified")).isEqualTo(true);
    assertThat(row.get("passwordSet")).isEqualTo(false);
    assertThat((String) row.get("username")).matches("[a-z0-9_]{3,40}");
    assertThat(auth.authenticate(credentials.accessToken())).isPresent();
    assertThat(
            db.exists(
                "SELECT EXISTS(SELECT 1 FROM consent_record WHERE user_id=? AND document='TERMS')",
                credentials.userId()))
        .isTrue();
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM email_outbox WHERE recipient=?)", email))
        .as("no confirmation e-mail for an address Google confirmed")
        .isFalse();

    // the next time it is the same account, terms or not
    var again = external.google("g-nova", null, "JUnit", false);
    assertThat(again.userId()).isEqualTo(credentials.userId());
    assertThat(again.created()).isFalse();
  }

  @Test
  void twoPeopleWithTheSameNameGetDifferentUsernames() {
    google("um", mail("um"), true, "Gêmeo " + tag);
    google("dois", mail("dois"), true, "Gêmeo " + tag);
    var first = account(external.google("g-um", null, "JUnit", true).userId());
    var second = account(external.google("g-dois", null, "JUnit", true).userId());
    assertThat((String) first.get("username")).startsWith("gemeo" + tag);
    assertThat(first.get("username")).isNotEqualTo(second.get("username"));
  }

  @Test
  void googleSignsIntoTheAccountThatAlreadyHasThatConfirmedEmail() {
    var before = register("ja");
    db.jdbc.update("UPDATE app_user SET email_verified=true WHERE id=?", before.userId());
    google("ja", mail("ja").toUpperCase(Locale.ROOT), true, "Ana no Google");
    var credentials = external.google("g-ja", null, "JUnit", false);
    assertThat(credentials.userId()).isEqualTo(before.userId());
    var row = account(before.userId());
    // the account stays the student's as it was: same name, same password, same sessions
    assertThat(row.get("name")).isEqualTo("Ana Souza");
    assertThat(row.get("passwordSet")).isEqualTo(true);
    assertThat(auth.login(mail("ja"), "test-password-long", "JUnit").userId())
        .isEqualTo(before.userId());
    assertThat(auth.authenticate(before.accessToken())).isPresent();
  }

  @Test
  void anAccountNobodyConfirmedPassesToWhoeverGoogleSaysOwnsTheEmail() {
    // someone registered the address without ever proving it was theirs, and tied a GitHub to it
    var squatter = register("alvo");
    github("intruso", "intruso");
    external.connectGithub(actor(squatter.accessToken()), "h-intruso", null);

    google("alvo", mail("alvo"), true, "Dona do e-mail");
    var credentials = external.google("g-alvo", null, "JUnit", true);
    assertThat(credentials.userId()).isEqualTo(squatter.userId());
    var row = account(squatter.userId());
    assertThat(row.get("emailVerified")).isEqualTo(true);
    assertThat(row.get("passwordSet")).isEqualTo(false);
    // the old password, the old sessions and the old connections are gone
    assertThat(auth.authenticate(squatter.accessToken())).isEmpty();
    assertThatThrownBy(() -> auth.login(mail("alvo"), "test-password-long", "JUnit"))
        .isInstanceOf(ApiException.class);
    assertThat(external.identities(actor(credentials.accessToken())).toString())
        .contains("GOOGLE")
        .doesNotContain("GITHUB");
  }

  @Test
  void googleMustHaveConfirmedTheEmail() {
    google("fraco", mail("fraco"), false, "Sem confirmação");
    assertThatThrownBy(() -> external.google("g-fraco", null, "JUnit", true))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("GOOGLE_EMAIL_UNVERIFIED"));
  }

  @Test
  void aStudentLinksGoogleAndCanDropItWhileAPasswordRemains() {
    Actor me = registered("eu", true);
    google("meu", "pessoal" + tag + "@gmail.test", true, "Eu");
    external.linkGoogle(me, "g-meu", null);
    assertThat(external.identities(me).toString()).contains("GOOGLE").contains("pessoal" + tag);
    // signing in with that Google account now opens this account, whatever its e-mail
    assertThat(external.google("g-meu", null, "JUnit", false).userId()).isEqualTo(me.id());

    // another student cannot take the same Google account
    Actor other = registered("outro", true);
    assertThatThrownBy(() -> external.linkGoogle(other, "g-meu", null))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("IDENTITY_IN_USE"));

    external.unlink(me, "GOOGLE");
    assertThat(external.identities(me).toString()).doesNotContain("GOOGLE");
  }

  @Test
  void anAccountMadeWithGoogleKeepsGoogleUntilItHasAPassword() {
    google("so", mail("so"), true, "Só Google");
    Actor only = actor(external.google("g-so", null, "JUnit", true).accessToken());
    assertThatThrownBy(() -> external.unlink(only, "GOOGLE"))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("PASSWORD_NEEDED"));

    // "forgot my password" gives it one
    auth.recover(mail("so"));
    String body =
        (String)
            db.one(
                    "SELECT body FROM email_outbox WHERE recipient=? ORDER BY created_at DESC LIMIT 1",
                    mail("so"))
                .get("body");
    auth.consume(body.substring(body.indexOf("#token=") + 7), "RESET", "another-long-password");
    assertThat(account(only.id()).get("passwordSet")).isEqualTo(true);
    external.unlink(new Actor(only.id(), null, "USER"), "GOOGLE");
    assertThat(auth.login(mail("so"), "another-long-password", "JUnit").userId())
        .isEqualTo(only.id());
  }

  @Test
  void anUnconfirmedAccountOnlyLinksTheGoogleOfItsOwnEmail() {
    Actor me = registered("pend", false);
    google("alheio", "alheio" + tag + "@gmail.test", true, "Outra conta");
    assertThatThrownBy(() -> external.linkGoogle(me, "g-alheio", null))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("EMAIL_UNVERIFIED"));

    google("mesmo", mail("pend"), true, "Mesma pessoa");
    external.linkGoogle(me, "g-mesmo", null);
    assertThat(account(me.id()).get("emailVerified")).isEqualTo(true);
  }

  @Test
  void aStudentConnectsGithubAndOnlyOneProfileHoldsEachAccount() {
    Actor me = registered("dev", true);
    assertThat(portfolioGithub.status(me.id())).isNull();
    github("dev", "ana-dev");
    external.connectGithub(me, "h-dev", null);
    assertThat(portfolioGithub.status(me.id()))
        .containsEntry("login", "ana-dev")
        .containsEntry("auto", false);

    Actor other = registered("dev2", true);
    assertThatThrownBy(() -> external.connectGithub(other, "h-dev", null))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("IDENTITY_IN_USE"));

    // connecting another GitHub account replaces the first
    github("novo", "ana-novo");
    external.connectGithub(me, "h-novo", null);
    assertThat(portfolioGithub.status(me.id())).containsEntry("login", "ana-novo");

    external.unlink(me, "GITHUB");
    assertThat(portfolioGithub.status(me.id())).isNull();
  }

  @Test
  void automaticImportBringsEachPublicRepositoryOnce() {
    Actor me = registered("auto", true);
    github("auto", "ana-auto");
    external.connectGithub(me, "h-auto", null);
    when(gateway.repositories("ana-auto"))
        .thenReturn(
            List.of(
                repo("ana-auto/site", false, false),
                repo("ana-auto/copia", true, false),
                repo("ana-auto/antigo", false, true)));

    // nothing is brought before the student asks for it
    assertThat(projectNames(me)).isEmpty();
    verify(gateway, never()).repositories(anyString());

    var result = portfolioGithub.auto(me, new PortfolioGithub.Auto(true));
    assertThat(result)
        .containsEntry("auto", true)
        .containsEntry("added", 1)
        .containsEntry("reached", true);
    // forks and archived repositories stay out
    assertThat(projectNames(me)).containsExactly("site");
    var saved =
        db.one("SELECT projects::text projects FROM portfolio_profile WHERE user_id=?", me.id())
            .get("projects")
            .toString();
    assertThat(saved)
        .contains("https://github.com/ana-auto/site")
        .contains("TypeScript")
        .contains("\"fullName\": \"ana-auto/site\"");

    // the student removes it; a later check brings only what is new
    db.jdbc.update("UPDATE portfolio_profile SET projects='[]',github_synced_at=NULL WHERE user_id=?", me.id());
    when(gateway.repositories("ana-auto"))
        .thenReturn(
            List.of(repo("ana-auto/jogo", false, false), repo("ana-auto/site", false, false)));
    assertThat(projectNames(me)).containsExactly("jogo");

    // within the hour GitHub is not asked again
    clearInvocations(gateway);
    assertThat(projectNames(me)).containsExactly("jogo");
    verify(gateway, never()).repositories(anyString());
  }

  @Test
  void theEditorStillOpensWhenGithubDoesNotAnswer() {
    Actor me = registered("fora", true);
    github("fora", "ana-fora");
    external.connectGithub(me, "h-fora", null);
    when(gateway.repositories("ana-fora"))
        .thenThrow(new ApiException(502, "PROVIDER_FAILED", "fora do ar"));
    // the choice is kept, and the student is told GitHub was not reached
    assertThat(portfolioGithub.auto(me, new PortfolioGithub.Auto(true)))
        .containsEntry("auto", true)
        .containsEntry("added", 0)
        .containsEntry("reached", false);
    assertThat(projectNames(me)).isEmpty();
    // an outage is not asked about again on every visit…
    verify(gateway, times(1)).repositories("ana-fora");

    // …but is tried again well before the usual hour
    db.jdbc.update(
        "UPDATE portfolio_profile SET github_synced_at=github_synced_at-interval '11 minutes'"
            + " WHERE user_id=?",
        me.id());
    doReturn(List.of(repo("ana-fora/voltou", false, false))).when(gateway).repositories("ana-fora");
    assertThat(projectNames(me)).containsExactly("voltou");
  }

  private PortfolioController.Portfolio with(String name, String fullName) {
    var project =
        new PortfolioController.Project(
            UUID.randomUUID(), name, "", "", List.of(), "PERSONAL", null, null, null, null, null,
            null, "https://github.com/" + fullName, null, null,
            new PortfolioController.GithubSource(fullName, 1, false, null), null, null, null);
    return new PortfolioController.Portfolio(false, "", "", List.of(), List.of(project), null, null);
  }

  @Test
  void aRepositoryOnlyEntersThePortfolioOfWhoeverConnectedThatGithubAccount() throws Exception {
    Actor me = registered("dono", true);
    // without a connected account nothing comes in as a GitHub project
    assertThatThrownBy(() -> portfolio.save(me, with("site", "ana-dona/site")))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("GITHUB_NOT_CONNECTED"));

    github("dono", "Ana-Dona");
    external.connectGithub(me, "h-dono", null);
    // someone else's repository is not this student's work to import
    assertThatThrownBy(() -> portfolio.save(me, with("alheio", "outra-pessoa/alheio")))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("GITHUB_NOT_YOURS"));
    portfolio.save(me, with("site", "ana-dona/site"));
    assertThat(projectNames(me)).containsExactly("site");

    // what was imported stays where it is after disconnecting; nothing new comes in
    external.unlink(me, "GITHUB");
    portfolio.save(me, with("site renomeado", "ana-dona/site"));
    assertThat(projectNames(me)).containsExactly("site renomeado");
    assertThatThrownBy(() -> portfolio.save(me, with("novo", "ana-dona/novo")))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void automaticImportNeedsAConnectedAccount() {
    Actor me = registered("sem", true);
    assertThatThrownBy(() -> portfolioGithub.auto(me, new PortfolioGithub.Auto(true)))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("GITHUB_NOT_CONNECTED"));
  }

  @Test
  void aProviderThatIsNotConfiguredIsRefused() {
    when(gateway.enabled("GOOGLE")).thenReturn(false);
    assertThatThrownBy(() -> external.google("g-x", null, "JUnit", true))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("PROVIDER_UNAVAILABLE"));
  }
}

package br.com.enturma.academics;

import br.com.enturma.auth.Actor;
import br.com.enturma.auth.Tokens;
import br.com.enturma.common.*;
import br.com.enturma.notifications.AppChanged;
import java.net.IDN;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AcademicIdentityService {
  private final Db db;
  private final CatalogService catalog;
  private final ApplicationEventPublisher events;
  private final String appUrl;
  private final boolean mailEnabled;

  public AcademicIdentityService(Db db, CatalogService catalog, ApplicationEventPublisher events,
      @Value("${enturma.app-url}") String appUrl,
      @Value("${enturma.mail-enabled:false}") boolean mailEnabled) {
    this.db = db;
    this.catalog = catalog;
    this.events = events;
    this.appUrl = appUrl;
    this.mailEnabled = mailEnabled;
  }

  public Map<String, Object> status(Actor actor) {
    var row = db.one("SELECT a.*,i.name institution_name,c.name campus_name,"
        + " a.status IN ('LEGACY_APPROVED','STUDENT_VERIFIED') access_allowed,"
        + " t.expires_at token_expires_at,(SELECT CASE WHEN e.sent_at IS NOT NULL THEN 'SENT'"
        + " WHEN e.attempts>=10 THEN 'FAILED' ELSE 'QUEUED' END FROM email_outbox e"
        + " WHERE e.academic_verification_user=a.user_id ORDER BY e.created_at DESC LIMIT 1) delivery,"
        + " d.request_id,d.expires_at document_expires_at FROM academic_identity a"
        + " LEFT JOIN academic_institution i ON i.id=a.institution_id"
        + " LEFT JOIN academic_campus c ON c.id=a.campus_id"
        + " LEFT JOIN academic_verification_token t ON t.user_id=a.user_id"
        + " LEFT JOIN academic_verification_document d ON d.user_id=a.user_id WHERE a.user_id=?", actor.id());
    return row;
  }

  public Object institutions(String search, int page) {
    var rows = catalog.list("INSTITUTION", null, search, page, false);
    for (var row : rows) {
      row.put("domains", domains((UUID) row.get("id")));
    }
    return Map.of("items", rows, "page", Math.max(0, page), "hasMore", rows.size() == 30);
  }

  public List<Map<String, Object>> domains(UUID institution) {
    return db.list("SELECT domain,shared,allow_subdomains,source_url,verified_at FROM academic_email_domain"
        + " WHERE institution_id=? AND status='APPROVED' ORDER BY domain", institution);
  }

  private Map<String, Object> pending(Actor actor) {
    var row = db.one("SELECT * FROM academic_identity WHERE user_id=? FOR UPDATE", actor.id());
    if (Set.of("LEGACY_APPROVED", "STUDENT_VERIFIED").contains(row.get("status")))
      throw ApiException.invalid("Sua conta já possui acesso aprovado. Não é necessário repetir a verificação.");
    return row;
  }

  private void selection(UUID institution, UUID campus) {
    catalog.verified(institution, "INSTITUTION");
    if (campus != null) {
      var c = catalog.verified(campus, "CAMPUS");
      if (!institution.equals(c.get("parentId")))
        throw ApiException.invalid("O campus não pertence à instituição selecionada.");
    }
  }

  public static String domain(String input) {
    try {
      String d = IDN.toASCII(input.strip().toLowerCase(Locale.ROOT), IDN.USE_STD3_ASCII_RULES);
      if (d.length() > 253 || !d.contains(".") || d.endsWith(".") || d.startsWith(".")
          || d.contains("..") || d.contains("@") || d.contains("*") || d.contains(":"))
        throw new IllegalArgumentException();
      return d;
    } catch (RuntimeException ex) {
      throw ApiException.invalid("Informe um domínio completo válido, sem @ ou curingas.");
    }
  }

  public static boolean matchesDomain(String emailDomain, String allowed, boolean subdomains) {
    return emailDomain.equals(allowed) || (subdomains && emailDomain.endsWith("." + allowed));
  }

  private String email(String input) {
    String value = input.strip().toLowerCase(Locale.ROOT);
    int at = value.indexOf('@');
    if (at <= 0 || at != value.lastIndexOf('@') || value.length() > 254
        || !value.substring(0, at).matches("[a-z0-9.!#$%&'*+/=?^_`{|}~-]+"))
      throw ApiException.invalid("Confira o endereço de e-mail acadêmico.");
    return value.substring(0, at + 1) + domain(value.substring(at + 1));
  }

  private void changed(UUID user) {
    events.publishEvent(new AppChanged("academic_identity_changed", Set.of(user)));
  }

  private void audit(UUID user, UUID actor, String action, String reason) {
    db.jdbc.update("INSERT INTO academic_verification_audit(id,user_id,actor_id,action,reason) VALUES (?,?,?,?,?)",
        UUID.randomUUID(), user, actor, action, reason);
  }

  private void cancelPending(UUID user) {
    db.jdbc.update("DELETE FROM academic_verification_token WHERE user_id=?", user);
    db.jdbc.update("DELETE FROM academic_verification_document WHERE user_id=?", user);
    db.jdbc.update("DELETE FROM email_outbox WHERE academic_verification_user=? AND sent_at IS NULL", user);
  }

  @Transactional
  public Object choose(Actor actor, UUID institution, UUID campus) {
    pending(actor);
    selection(institution, campus);
    cancelPending(actor.id());
    db.jdbc.update("UPDATE academic_identity SET institution_id=?,campus_id=?,status='PENDING',"
        + " academic_email=NULL,method=NULL,confidence=NULL,review_reason=NULL,revision=revision+1,updated_at=now() WHERE user_id=?",
        institution, campus, actor.id());
    audit(actor.id(), actor.id(), "INSTITUTION_SELECTED", null);
    changed(actor.id());
    return status(actor);
  }

  private void checkRate(UUID user, String action, int limit, int seconds) {
    int hits = db.jdbc.queryForObject("INSERT INTO rate_limit(bucket,hits,resets_at) VALUES (?,1,now()+(? * interval '1 second'))"
        + " ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN rate_limit.resets_at<now() THEN 1 ELSE rate_limit.hits+1 END,"
        + " resets_at=CASE WHEN rate_limit.resets_at<now() THEN now()+(? * interval '1 second') ELSE rate_limit.resets_at END RETURNING hits",
        Integer.class, "academic:" + action + ":" + user, seconds, seconds);
    if (hits > limit) throw new ApiException(429, "ACADEMIC_RATE_LIMITED", "Aguarde um pouco antes de enviar uma nova solicitação.");
  }

  @Transactional
  public Object sendEmail(Actor actor, String address) {
    var identity = pending(actor);
    UUID institution = (UUID) identity.get("institutionId");
    if (institution == null) throw ApiException.invalid("Selecione sua instituição primeiro.");
    selection(institution, (UUID) identity.get("campusId"));
    String normalized = email(address);
    String emailDomain = normalized.substring(normalized.lastIndexOf('@') + 1);
    var approved = db.list("SELECT * FROM academic_email_domain WHERE institution_id=? AND status='APPROVED' ORDER BY length(domain) DESC", institution)
        .stream().filter(d -> matchesDomain(emailDomain, (String) d.get("domain"), Boolean.TRUE.equals(d.get("allowSubdomains")))).findFirst()
        .orElseThrow(() -> new ApiException(422, "ACADEMIC_DOMAIN_NOT_ALLOWED", "Esse domínio não está autorizado para a instituição. Confira o endereço ou envie um comprovante."));
    if (db.exists("SELECT EXISTS(SELECT 1 FROM academic_identity WHERE lower(academic_email)=? AND status='STUDENT_VERIFIED' AND user_id<>?)", normalized, actor.id()))
      throw new ApiException(409, "ACADEMIC_EMAIL_IN_USE", "Esse endereço acadêmico já está vinculado a uma conta verificada.");
    if (!mailEnabled) throw new ApiException(503, "ACADEMIC_EMAIL_UNAVAILABLE", "O envio de e-mails está temporariamente indisponível. Tente novamente ou use a análise de matrícula.");
    if (db.exists("SELECT EXISTS(SELECT 1 FROM academic_verification_token WHERE user_id=? AND created_at>now()-interval '60 seconds')", actor.id()))
      throw new ApiException(429, "ACADEMIC_RESEND_WAIT", "Aguarde 60 segundos antes de reenviar.");
    checkRate(actor.id(), "email", 5, 3600);
    cancelPending(actor.id());
    String token = Tokens.create();
    db.jdbc.update("INSERT INTO academic_verification_token(token_hash,user_id,institution_id,domain_id,email,expires_at) VALUES (?,?,?,?,?,now()+interval '30 minutes')",
        Tokens.hash(token), actor.id(), institution, approved.get("id"), normalized);
    db.jdbc.update("UPDATE academic_identity SET status='EMAIL_PENDING',academic_email=?,method='ACADEMIC_EMAIL',confidence=NULL,review_reason=NULL,revision=revision+1,updated_at=now() WHERE user_id=?", normalized, actor.id());
    db.jdbc.update("INSERT INTO email_outbox(id,recipient,subject,body,academic_verification_user,delivery_expires_at) VALUES (?,?,?,?,?,now()+interval '30 minutes')",
        UUID.randomUUID(), normalized, "Enturma — Confirme seu endereço acadêmico",
        "Confirme em até 30 minutos: " + appUrl + "/verify-academic#token=" + token
            + "\nSe não solicitou, ignore este e-mail. O link comprova o controle deste endereço, não uma matrícula ativa.", actor.id());
    audit(actor.id(), actor.id(), "EMAIL_QUEUED", null);
    changed(actor.id());
    return status(actor);
  }

  @Transactional
  public void confirm(String raw) {
    var lookup = db.list("SELECT user_id FROM academic_verification_token WHERE token_hash=?", Tokens.hash(raw));
    if (lookup.isEmpty()) throw new ApiException(422, "ACADEMIC_TOKEN_INVALID", "Link inválido, já utilizado ou substituído. Solicite outro link no Enturma.");
    UUID user = (UUID) lookup.getFirst().get("userId");
    var identity = db.one("SELECT * FROM academic_identity WHERE user_id=? FOR UPDATE", user);
    var tokens = db.list("SELECT t.*,d.domain,d.allow_subdomains FROM academic_verification_token t"
        + " JOIN academic_email_domain d ON d.id=t.domain_id AND d.institution_id=t.institution_id AND d.status='APPROVED'"
        + " JOIN academic_institution i ON i.id=t.institution_id AND i.active AND i.status='VERIFIED'"
        + " WHERE t.token_hash=? AND t.expires_at>now()", Tokens.hash(raw));
    if (tokens.isEmpty() || !"EMAIL_PENDING".equals(identity.get("status")))
      throw new ApiException(422, "ACADEMIC_TOKEN_EXPIRED", "Esse link expirou ou foi substituído. Solicite outro link no Enturma.");
    var token = tokens.getFirst();
    String address = (String) token.get("email");
    if (!Objects.equals(token.get("institutionId"), identity.get("institutionId"))
        || !Objects.equals(address, identity.get("academicEmail"))
        || !matchesDomain(address.substring(address.lastIndexOf('@') + 1), (String) token.get("domain"), Boolean.TRUE.equals(token.get("allowSubdomains"))))
      throw ApiException.invalid("A instituição ou o endereço mudou. Solicite uma nova confirmação.");
    // Serialize competing claims to the same mailbox; the unique index is a second defense.
    db.list("SELECT pg_advisory_xact_lock(hashtext(?))", "academic-email:" + address);
    if (db.exists("SELECT EXISTS(SELECT 1 FROM academic_identity WHERE lower(academic_email)=? AND status='STUDENT_VERIFIED' AND user_id<>?)", address, user))
      throw new ApiException(409, "ACADEMIC_EMAIL_IN_USE", "Esse endereço acadêmico já foi vinculado a outra conta.");
    db.jdbc.update("UPDATE academic_identity SET status='STUDENT_VERIFIED',method='ACADEMIC_EMAIL',confidence='AUTHORIZED_EMAIL_CONTROL',verified_at=now(),revision=revision+1,updated_at=now() WHERE user_id=?", user);
    cancelPending(user);
    audit(user, user, "EMAIL_CONFIRMED", "Posse de endereço autorizado; matrícula ativa não atestada.");
    changed(user);
  }

  @Transactional
  public Object submitDocument(Actor actor, String mime, byte[] bytes) {
    var identity = pending(actor);
    if (identity.get("institutionId") == null) throw ApiException.invalid("Selecione sua instituição primeiro.");
    selection((UUID) identity.get("institutionId"), (UUID) identity.get("campusId"));
    if ("PENDING_REVIEW".equals(identity.get("status")))
      throw ApiException.invalid("Seu comprovante já está em análise. Aguarde a resposta ou altere a instituição para iniciar novamente.");
    validateDocument(mime, bytes);
    checkRate(actor.id(), "document", 3, 86400);
    cancelPending(actor.id());
    UUID request = UUID.randomUUID();
    db.jdbc.update("INSERT INTO academic_verification_document(user_id,request_id,mime,content) VALUES (?,?,?,?)", actor.id(), request, mime, bytes);
    db.jdbc.update("UPDATE academic_identity SET status='PENDING_REVIEW',academic_email=NULL,method='DOCUMENT_REVIEW',confidence=NULL,review_reason=NULL,revision=revision+1,updated_at=now() WHERE user_id=?", actor.id());
    audit(actor.id(), actor.id(), "DOCUMENT_SUBMITTED", "Solicitação " + request);
    changed(actor.id());
    return status(actor);
  }

  private static void validateDocument(String mime, byte[] bytes) {
    if (bytes == null || bytes.length < 12 || bytes.length > 2 * 1024 * 1024)
      throw ApiException.invalid("Envie um comprovante PDF, PNG ou JPEG de até 2 MB.");
    boolean valid = switch (mime) {
      case "application/pdf" -> new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-");
      case "image/png" -> Arrays.equals(Arrays.copyOf(bytes, 8), new byte[]{(byte)137,80,78,71,13,10,26,10});
      case "image/jpeg" -> bytes[0] == (byte)255 && bytes[1] == (byte)216 && bytes[2] == (byte)255;
      default -> false;
    };
    if (!valid) throw ApiException.invalid("O conteúdo não corresponde a um PDF, PNG ou JPEG válido.");
  }

  private void admin(Actor actor) { if (!actor.admin()) throw ApiException.forbidden(); }

  public Object support(Actor actor) {
    return db.list("SELECT id,message,response,created_at,resolved_at FROM academic_verification_support WHERE user_id=? ORDER BY created_at DESC LIMIT 20", actor.id());
  }

  @Transactional
  public Object askSupport(Actor actor, String message) {
    db.one("SELECT user_id FROM academic_identity WHERE user_id=? FOR UPDATE", actor.id());
    if (message == null || message.strip().length() < 10 || message.length() > 2000)
      throw ApiException.invalid("Descreva a dúvida em 10 a 2000 caracteres.");
    checkRate(actor.id(), "support", 3, 86400);
    db.jdbc.update("INSERT INTO academic_verification_support(id,user_id,message) VALUES (?,?,?)", UUID.randomUUID(), actor.id(), message.strip());
    return support(actor);
  }

  @Transactional
  public void answerSupport(Actor actor, UUID request, String response) {
    admin(actor);
    if (response == null || response.strip().length() < 5 || response.length() > 2000)
      throw ApiException.invalid("Responda em 5 a 2000 caracteres.");
    var row = db.one("UPDATE academic_verification_support SET response=?,resolved_at=now(),resolved_by=? WHERE id=? AND resolved_at IS NULL RETURNING user_id", response.strip(), actor.id(), request);
    UUID user = (UUID) row.get("userId");
    audit(user, actor.id(), "SUPPORT_ANSWERED", "Solicitação " + request);
    changed(user);
  }

  public Object administration(Actor actor, int page) {
    admin(actor);
    return Map.of("domains", db.list("SELECT d.*,i.name institution_name FROM academic_email_domain d JOIN academic_institution i ON i.id=d.institution_id ORDER BY i.name,d.domain LIMIT 30 OFFSET ?", Db.offset(page)),
        "reviews", db.list("SELECT a.user_id,u.name,i.name institution_name,a.updated_at,d.request_id,d.expires_at FROM academic_identity a JOIN app_user u ON u.id=a.user_id JOIN academic_institution i ON i.id=a.institution_id JOIN academic_verification_document d ON d.user_id=a.user_id WHERE a.status='PENDING_REVIEW' ORDER BY a.updated_at LIMIT 30 OFFSET ?", Db.offset(page)),
        "audit", db.list("SELECT * FROM academic_verification_audit ORDER BY created_at DESC LIMIT 30 OFFSET ?", Db.offset(page)),
        "support", db.list("SELECT s.*,u.name FROM academic_verification_support s JOIN app_user u ON u.id=s.user_id WHERE s.resolved_at IS NULL ORDER BY s.created_at LIMIT 30 OFFSET ?", Db.offset(page)));
  }

  @Transactional
  public Object saveDomain(Actor actor, UUID institution, String name, String state,
      boolean shared, boolean subdomains, String source) {
    admin(actor);
    catalog.verified(institution, "INSTITUTION");
    String normalized = domain(name);
    if (!Set.of("APPROVED","DISABLED","PENDING").contains(state)) throw ApiException.invalid("Estado inválido.");
    try {
      URI uri = URI.create(source);
      if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null)
        throw new IllegalArgumentException();
    } catch (RuntimeException ex) { throw ApiException.invalid("Informe a URL HTTPS da fonte oficial que confirma o domínio."); }
    db.list("SELECT pg_advisory_xact_lock(hashtext(?))", "academic-domain:" + normalized);
    if (db.exists("SELECT EXISTS(SELECT 1 FROM academic_email_domain WHERE domain=? AND institution_id<>? AND (NOT shared OR NOT ?))", normalized, institution, shared))
      throw ApiException.invalid("O domínio já está associado a outra instituição. Confirme o compartilhamento nas duas associações.");
    var result = db.one("INSERT INTO academic_email_domain(id,institution_id,domain,status,shared,allow_subdomains,source_url,verified_at) VALUES (?,?,?,?,?,?,?,CASE WHEN ?='APPROVED' THEN now() END)"
        + " ON CONFLICT(institution_id,domain) DO UPDATE SET status=EXCLUDED.status,shared=EXCLUDED.shared,allow_subdomains=EXCLUDED.allow_subdomains,source_url=EXCLUDED.source_url,verified_at=EXCLUDED.verified_at,updated_at=now() RETURNING *",
        UUID.randomUUID(), institution, normalized, state, shared, subdomains, source, state);
    audit(null, actor.id(), "DOMAIN_" + state, institution + " / " + normalized + " / registro " + result.get("id"));
    return result;
  }

  @Transactional
  public Map<String, Object> document(Actor actor, UUID user, UUID request) {
    admin(actor);
    var row = db.one("SELECT mime,content FROM academic_verification_document WHERE user_id=? AND request_id=? AND expires_at>now()", user, request);
    audit(user, actor.id(), "DOCUMENT_ACCESSED", "Solicitação " + request);
    return row;
  }

  @Transactional
  public void review(Actor actor, UUID user, UUID request, boolean approve, String reason) {
    admin(actor);
    if (actor.id().equals(user)) throw ApiException.forbidden();
    var identity = db.one("SELECT * FROM academic_identity WHERE user_id=? FOR UPDATE", user);
    if (!"PENDING_REVIEW".equals(identity.get("status")) || !db.exists("SELECT EXISTS(SELECT 1 FROM academic_verification_document WHERE user_id=? AND request_id=? AND expires_at>now())", user, request))
      throw new ApiException(409, "ACADEMIC_REVIEW_CHANGED", "Essa solicitação já foi analisada, substituída ou expirou. Atualize a fila.");
    if (reason == null || reason.strip().length() < 5 || reason.length() > 1000) throw ApiException.invalid("Informe uma justificativa de 5 a 1000 caracteres.");
    db.jdbc.update("UPDATE academic_identity SET status=?,confidence=?,verified_at=CASE WHEN ? THEN now() ELSE NULL END,review_reason=?,revision=revision+1,updated_at=now() WHERE user_id=?",
        approve ? "STUDENT_VERIFIED" : "REJECTED", approve ? "ENROLLMENT_DOCUMENT_REVIEWED" : null, approve, reason.strip(), user);
    cancelPending(user);
    audit(user, actor.id(), approve ? "DOCUMENT_APPROVED" : "DOCUMENT_REJECTED", reason.strip());
    changed(user);
  }

  @Scheduled(fixedDelay = 3600000, initialDelay = 60000)
  @Transactional
  public void purgeExpiredDocuments() {
    // Lock identity first, matching submission/review ordering.
    for (var row : db.list("SELECT a.user_id FROM academic_identity a JOIN academic_verification_document d ON d.user_id=a.user_id WHERE d.expires_at<=now() FOR UPDATE OF a SKIP LOCKED")) {
      UUID user = (UUID) row.get("userId");
      db.jdbc.update("DELETE FROM academic_verification_document WHERE user_id=?", user);
      db.jdbc.update("UPDATE academic_identity SET status='REJECTED',review_reason='Prazo de análise expirado. Envie um comprovante atualizado.',updated_at=now(),revision=revision+1 WHERE user_id=? AND status='PENDING_REVIEW'", user);
      audit(user, null, "DOCUMENT_PURGED", "Retenção máxima de 14 dias encerrada.");
      changed(user);
    }
    db.jdbc.update("DELETE FROM academic_verification_token WHERE expires_at<now()-interval '1 day'");
    db.jdbc.update("UPDATE email_outbox SET body='',attempts=10 WHERE delivery_expires_at<=now() AND sent_at IS NULL AND body<>''");
  }
}

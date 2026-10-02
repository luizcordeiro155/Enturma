package br.com.enturma.academics;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import com.fasterxml.jackson.databind.*;
import jakarta.validation.Validator;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogImports {
  static final List<String> KINDS =
      List.of("INSTITUTION", "CAMPUS", "COURSE", "CURRICULUM", "PERIOD", "SUBJECT", "TOPIC");
  static final Set<String> STATUSES =
      Set.of("VERIFIED", "PENDING_VERIFICATION", "OUTDATED", "ARCHIVED", "REJECTED");
  private final Db db;
  private final ObjectMapper json;
  private final Validator validator;
  private final io.micrometer.core.instrument.MeterRegistry metrics;

  public CatalogImports(
      Db db,
      ObjectMapper json,
      Validator validator,
      io.micrometer.core.instrument.MeterRegistry metrics) {
    this.db = db;
    this.json = json;
    this.validator = validator;
    this.metrics = metrics;
  }

  public static UUID identity(String provider, String kind, String external) {
    return UUID.nameUUIDFromBytes(
        ("enturma:catalog:" + provider + ":" + kind + ":" + external)
            .getBytes(StandardCharsets.UTF_8));
  }

  String encode(Object value) {
    try {
      return json.writeValueAsString(value);
    } catch (Exception e) {
      throw ApiException.invalid("Documento inválido.");
    }
  }

  public static String hash(String value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private static Timestamp timestamp(Instant value) {
    return value == null ? null : Timestamp.from(value);
  }

  private static void admin(Actor actor) {
    if (actor == null || !actor.admin()) throw ApiException.forbidden();
  }

  @Transactional
  public UUID submit(Actor actor, CatalogRecord.Document document, String requestId) {
    admin(actor);
    return enqueue(document, actor.id(), requestId, null);
  }

  @Transactional
  public UUID seed(CatalogRecord.Document document, String key) {
    return enqueue(document, null, "bundled-catalog", key);
  }

  private UUID enqueue(
      CatalogRecord.Document document, UUID actor, String requestId, String seedKey) {
    if (!validator.validate(document).isEmpty())
      throw ApiException.invalid("Confira o schema e os campos obrigatórios do catálogo.");
    if (seedKey != null) {
      db.jdbc.queryForObject(
          "SELECT pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, seedKey);
      var old = db.list("SELECT id FROM academic_import_job WHERE seed_key=?", seedKey);
      if (!old.isEmpty()) return (UUID) old.getFirst().get("id");
    }
    var entries = new ArrayList<>(document.entries());
    var identities = new HashSet<String>();
    for (var e : entries) {
      validate(e);
      if (!identities.add(e.kind() + ":" + e.externalId()))
        throw ApiException.invalid("Identificador externo repetido no arquivo.");
    }
    entries.sort(Comparator.comparingInt(e -> KINDS.indexOf(e.kind())));
    UUID job = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO"
            + " academic_import_job(id,provider,type,status,total_items,requested_by,request_id,seed_key)"
            + " VALUES (?,?,'CATALOG','PENDING',?,?,?,?)",
        job,
        document.provider(),
        entries.size(),
        actor,
        requestId,
        seedKey);
    var batch = new ArrayList<Object[]>();
    int ordinal = 0;
    for (var e : entries) {
      String payload = encode(e);
      batch.add(
          new Object[] {
            UUID.randomUUID(),
            job,
            ordinal++,
            e.kind(),
            e.externalId(),
            e.source().url(),
            hash(payload),
            payload
          });
    }
    db.jdbc.batchUpdate(
        "INSERT INTO"
            + " academic_import_item(id,job_id,ordinal,entity_type,external_id,source_url,content_hash,payload)"
            + " VALUES (?,?,?,?,?,?,?,?::jsonb)",
        batch);
    return job;
  }

  void validate(CatalogRecord e) {
    if (!validator.validate(e).isEmpty()
        || !KINDS.contains(e.kind())
        || !STATUSES.contains(e.status()))
      throw ApiException.invalid("Registro acadêmico inválido.");
    URI uri;
    try {
      uri = URI.create(e.source().url());
    } catch (Exception ex) {
      throw ApiException.invalid("Fonte inválida.");
    }
    if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null)
      throw ApiException.invalid("Use uma fonte oficial HTTPS.");
    if (!Set.of(
            "EMEC",
            "OFFICIAL_WEBPAGE",
            "OFFICIAL_PDF",
            "OFFICIAL_API",
            "MANUAL_VERIFIED",
            "CSV_IMPORT",
            "JSON_IMPORT",
            "OTHER")
        .contains(e.source().type())) throw ApiException.invalid("Tipo de fonte inválido.");
    if (e.source().retrievedAt().isAfter(Instant.now().plusSeconds(60)))
      throw ApiException.invalid("Data de coleta futura.");
    if (e.status().equals("VERIFIED")
        && (e.source().verifiedAt() == null
            || e.source().verifiedAt().isAfter(Instant.now().plusSeconds(60))
            || e.source().contentHash() == null))
      throw ApiException.invalid(
          "Um registro verificado exige data de verificação e SHA-256 da fonte.");
    if (e.kind().equals("INSTITUTION")
        ? (e.parentExternalId() != null)
        : (e.parentExternalId() == null || e.parentExternalId().isBlank()))
      throw ApiException.invalid("Hierarquia incompleta.");
    if (e.kind().equals("CURRICULUM")
        && (e.curriculumVersion() == null || e.curriculumVersion().isBlank()))
      throw ApiException.invalid("Informe uma versão para a grade.");
    if (e.kind().equals("PERIOD")
        && e.periodNumber() == null
        && !(e.attributes() != null
            && "ELECTIVES".equals(e.attributes().path("organization").asText())))
      throw ApiException.invalid("Informe o número do período.");
    JsonNode a = e.attributes();
    if (a == null || a.isNull()) return;
    if (!a.isObject() || encode(a).length() > 12000)
      throw ApiException.invalid("Metadados inválidos.");
    for (String field :
        List.of(
            "workloadHours",
            "totalWorkloadHours",
            "minimumPeriods",
            "durationPeriods",
            "durationMonths",
            "effectiveYear"))
      if (a.has(field)
          && (!a.get(field).isIntegralNumber()
              || a.get(field).asInt() <= 0
              || a.get(field).asInt() > 100000))
        throw ApiException.invalid("Carga horária ou duração inválida.");
    for (String field : List.of("subjectId", "courseId"))
      if (a.has(field)) {
        try {
          UUID.fromString(a.get(field).asText());
        } catch (Exception ex) {
          throw ApiException.invalid("Associação conceitual inválida.");
        }
      }
    if (a.has("learningArea") && !Set.of("IT", "OTHER").contains(a.get("learningArea").asText()))
      throw ApiException.invalid("Área de aprendizagem inválida.");
    if (a.has("required") && !a.get("required").isBoolean())
      throw ApiException.invalid("Obrigatoriedade inválida.");
    if (a.has("prerequisites")
        && (!a.get("prerequisites").isArray() || a.get("prerequisites").size() > 30))
      throw ApiException.invalid("Pré-requisitos inválidos.");
  }

  CatalogRecord decode(Object payload) {
    try {
      return json.readValue(payload.toString(), CatalogRecord.class);
    } catch (Exception e) {
      throw ApiException.invalid("Documento inválido.");
    }
  }

  @Scheduled(fixedDelayString = "${enturma.catalog.worker-delay:1500}")
  @Transactional
  public void processBatch() {
    var jobs =
        db.list(
            "SELECT * FROM academic_import_job WHERE status IN ('PENDING','RUNNING') ORDER BY"
                + " created_at LIMIT 1 FOR UPDATE SKIP LOCKED");
    if (jobs.isEmpty()) return;
    var job = jobs.getFirst();
    UUID jobId = (UUID) job.get("id");
    db.jdbc.update(
        "UPDATE academic_import_job SET"
            + " status='RUNNING',started_at=coalesce(started_at,now()),updated_at=now() WHERE id=?",
        jobId);
    var items =
        db.list(
            "SELECT * FROM academic_import_item WHERE job_id=? AND status='PENDING' ORDER BY"
                + " ordinal LIMIT 100",
            jobId);
    db.jdbc.execute(
        (ConnectionCallback<Void>)
            connection -> {
              for (var item : items) {
                var savepoint = connection.setSavepoint();
                try {
                  apply(job, item, false);
                  metrics.counter("enturma.catalog.items", "outcome", "processed").increment();
                  connection.releaseSavepoint(savepoint);
                } catch (Exception ex) {
                  metrics.counter("enturma.catalog.items", "outcome", "failed").increment();
                  connection.rollback(savepoint);
                  connection.releaseSavepoint(savepoint);
                  String message =
                      ex instanceof ApiException
                          ? ex.getMessage()
                          : "Registro inconsistente com o schema ou com as relações do catálogo.";
                  db.jdbc.update(
                      "UPDATE academic_import_item SET"
                          + " status='FAILED',error_code=?,error_message=?,processed_at=now() WHERE"
                          + " id=?",
                      ex instanceof ApiException ? "VALIDATION" : "CONSTRAINT",
                      message,
                      item.get("id"));
                }
              }
              return null;
            });
    refresh(jobId);
  }

  void refresh(UUID job) {
    String previous =
        (String) db.one("SELECT status FROM academic_import_job WHERE id=?", job).get("status");
    db.jdbc.update(
        "UPDATE academic_import_job j SET"
            + " processed_items=s.processed,success_items=s.success,failed_items=s.failed,skipped_items=s.skipped,status=CASE"
            + " WHEN j.status IN ('PAUSED','CANCELLED') THEN j.status WHEN s.pending>0 THEN"
            + " 'RUNNING' WHEN s.failed>0 THEN 'COMPLETED_WITH_ERRORS' ELSE 'COMPLETED'"
            + " END,completed_at=CASE WHEN s.pending=0 THEN now() ELSE NULL END,updated_at=now()"
            + " FROM (SELECT count(*) FILTER(WHERE status<>'PENDING') processed,count(*)"
            + " FILTER(WHERE status='IMPORTED') success,count(*) FILTER(WHERE status IN"
            + " ('FAILED','PENDING_VERIFICATION')) failed,count(*) FILTER(WHERE status IN"
            + " ('SKIPPED_UNCHANGED','REJECTED','ARCHIVED')) skipped,count(*) FILTER(WHERE"
            + " status='PENDING') pending FROM academic_import_item WHERE job_id=?) s WHERE j.id=?",
        job,
        job);
    var current =
        db.one(
            "SELECT status,provider,success_items,failed_items FROM academic_import_job WHERE id=?",
            job);
    if (!Objects.equals(previous, current.get("status"))
        && current.get("status").toString().startsWith("COMPLETED")) {
      db.jdbc.update(
          "INSERT INTO academic_domain_event(id,type,job_id,provider,payload) VALUES"
              + " (?,?,?,?,?::jsonb)",
          UUID.randomUUID(),
          current.get("status").equals("COMPLETED") ? "IMPORT_COMPLETED" : "IMPORT_REQUIRES_REVIEW",
          job,
          current.get("provider"),
          encode(current));
      db.jdbc.update(
          "UPDATE academic_catalog_request r SET status='AVAILABLE' WHERE status IN"
              + " ('OPEN','IN_REVIEW') AND EXISTS(SELECT 1 FROM academic_curriculum c WHERE"
              + " c.course_offering_id=r.course_offering_id AND c.verification_status='VERIFIED')");
      org.slf4j.LoggerFactory.getLogger(CatalogImports.class)
          .info(
              "catalog_import job={} provider={} status={} success={} failed={}",
              job,
              current.get("provider"),
              current.get("status"),
              current.get("successItems"),
              current.get("failedItems"));
      db.jdbc.update(
          "INSERT INTO notification(id,user_id,message) SELECT gen_random_uuid(),id,? FROM app_user"
              + " WHERE role IN ('ADMIN','SUPER_ADMIN') AND status='ACTIVE'",
          "Importação acadêmica "
              + current.get("provider")
              + ": "
              + current.get("status")
              + ". Confira /admin/catalog/imports.");
    }
  }

  private void apply(Map<String, Object> job, Map<String, Object> item, boolean approved) {
    var e = decode(item.get("payload"));
    validate(e);
    String provider = (String) job.get("provider");
    UUID id = identity(provider, e.kind(), e.externalId());
    db.jdbc.queryForObject(
        "SELECT pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, id.toString());
    var existing =
        db.list(
            "SELECT * FROM academic_entry WHERE provider=? AND kind=? AND external_id=?",
            provider,
            e.kind(),
            e.externalId());
    if (!existing.isEmpty()
        && Objects.equals(existing.getFirst().get("contentHash"), item.get("contentHash"))) {
      itemStatus(item, "SKIPPED_UNCHANGED", id, null);
      return;
    }
    if (!approved && (!existing.isEmpty() || !e.status().equals("VERIFIED"))) {
      itemStatus(
          item, "PENDING_VERIFICATION", id, "Revise a fonte e as alterações antes de publicar.");
      return;
    }
    UUID parent = null;
    if (!e.kind().equals("INSTITUTION")) {
      String parentKind = KINDS.get(KINDS.indexOf(e.kind()) - 1);
      var parents =
          db.list(
              "SELECT id,status FROM academic_entry WHERE provider=? AND kind=? AND external_id=?",
              provider,
              parentKind,
              e.parentExternalId());
      if (parents.isEmpty())
        throw ApiException.invalid("Registro pai ausente. Importe ou aprove os pais primeiro.");
      parent = (UUID) parents.getFirst().get("id");
      if (e.status().equals("VERIFIED") && !parents.getFirst().get("status").equals("VERIFIED"))
        throw ApiException.invalid("O registro pai precisa estar verificado.");
    }
    if (!existing.isEmpty()) {
      var old = existing.getFirst();
      id = (UUID) old.get("id");
      if (!Objects.equals(parent, old.get("parentId"))
          || !Objects.equals(e.curriculumVersion(), old.get("curriculumVersion"))
          || !Objects.equals(e.periodNumber(), old.get("periodNumber")))
        throw ApiException.invalid(
            "Não altere a estrutura de uma grade publicada: use novos identificadores e uma nova"
                + " versão.");
      if (Set.of("CURRICULUM", "PERIOD", "SUBJECT").contains(e.kind())
          && !Objects.equals(old.get("name"), e.name()))
        throw ApiException.invalid(
            "Preserve a grade publicada. Crie nova versão para alterações curriculares.");
      if (Set.of("CURRICULUM", "PERIOD", "SUBJECT").contains(e.kind())) {
        JsonNode oldAttributes = json.valueToTree(old.get("attributes"));
        for (String field :
            List.of(
                "workloadHours",
                "totalWorkloadHours",
                "minimumPeriods",
                "prerequisites",
                "semesterFrom",
                "semesterTo",
                "subjectId",
                "required"))
          if (!Objects.equals(
              oldAttributes.get(field), e.attributes() == null ? null : e.attributes().get(field)))
            throw ApiException.invalid(
                "Mudança curricular exige nova versão. Preserve cargas horárias e pré-requisitos já"
                    + " publicados.");
      }
    }
    var a = e.attributes() == null ? json.createObjectNode() : e.attributes();
    for (String field : List.of("subjectId", "courseId"))
      if (a.has(field)
          && !db.exists(
              "SELECT EXISTS(SELECT 1 FROM "
                  + (field.equals("subjectId") ? "academic_subject" : "academic_course")
                  + " WHERE id=?)",
              UUID.fromString(a.get(field).asText())))
        throw ApiException.invalid("O conceito associado não existe.");
    UUID source = identity(provider, "SOURCE", e.source().url() + ":" + e.source().contentHash());
    db.jdbc.update(
        "INSERT INTO"
            + " academic_source(id,provider,source_type,source_name,source_url,retrieved_at,verified_at,content_hash,status)"
            + " VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING",
        source,
        provider,
        e.source().type(),
        e.source().name(),
        e.source().url(),
        timestamp(e.source().retrievedAt()),
        timestamp(e.source().verifiedAt()),
        e.source().contentHash(),
        e.status());
    db.jdbc.update(
        "INSERT INTO"
            + " academic_entry(id,kind,parent_id,name,code,curriculum_version,period_number,source_url,source_name,verified_at,valid_from,status,provider,external_id,source_id,content_hash,attributes)"
            + " VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_DATE,?,?,?,?,?,?::jsonb) ON CONFLICT(id) DO"
            + " UPDATE SET"
            + " name=EXCLUDED.name,code=EXCLUDED.code,source_url=EXCLUDED.source_url,source_name=EXCLUDED.source_name,verified_at=EXCLUDED.verified_at,status=EXCLUDED.status,source_id=EXCLUDED.source_id,content_hash=EXCLUDED.content_hash,attributes=EXCLUDED.attributes,updated_at=now()",
        id,
        e.kind(),
        parent,
        e.name(),
        e.code(),
        e.curriculumVersion(),
        e.periodNumber(),
        e.source().url(),
        e.source().name(),
        timestamp(e.source().verifiedAt()),
        e.status(),
        provider,
        e.externalId(),
        source,
        item.get("contentHash"),
        encode(a));
    if (e.kind().equals("SUBJECT") && a.has("prerequisites")) {
      UUID curriculum =
          (UUID)
              db.one("SELECT curriculum_id FROM academic_curriculum_subject WHERE id=?", id)
                  .get("curriculumId");
      for (var prerequisite : a.get("prerequisites")) {
        var target =
            db.one(
                "SELECT id FROM academic_entry WHERE provider=? AND kind='SUBJECT' AND"
                    + " external_id=?",
                provider,
                prerequisite.asText());
        if (db.exists(
            "SELECT EXISTS(WITH RECURSIVE chain AS(SELECT prerequisite_id FROM"
                + " academic_subject_prerequisite WHERE curriculum_subject_id=? UNION SELECT"
                + " p.prerequisite_id FROM academic_subject_prerequisite p JOIN chain c ON"
                + " p.curriculum_subject_id=c.prerequisite_id) SELECT 1 FROM chain WHERE"
                + " prerequisite_id=?)",
            target.get("id"),
            id)) throw ApiException.invalid("Pré-requisito circular.");
        db.jdbc.update(
            "INSERT INTO"
                + " academic_subject_prerequisite(curriculum_subject_id,prerequisite_id,curriculum_id,source_id)"
                + " VALUES (?,?,?,?) ON CONFLICT DO NOTHING",
            id,
            target.get("id"),
            curriculum,
            source);
      }
    }
    audit(
        (UUID) job.get("requestedBy"),
        existing.isEmpty() ? "IMPORT_CREATE" : "IMPORT_UPDATE",
        e.kind(),
        id,
        source,
        existing,
        e,
        (String) job.get("requestId"));
    itemStatus(item, "IMPORTED", id, null);
  }

  private void itemStatus(Map<String, Object> item, String status, UUID entity, String message) {
    db.jdbc.update(
        "UPDATE academic_import_item SET"
            + " status=?,entity_id=?,error_code=NULL,error_message=?,processed_at=now() WHERE id=?",
        status,
        entity,
        message,
        item.get("id"));
  }

  void audit(
      UUID actor,
      String action,
      String kind,
      UUID entity,
      UUID source,
      Object before,
      Object after,
      String request) {
    db.jdbc.update(
        "INSERT INTO"
            + " academic_catalog_audit(id,actor_id,action,entity_type,entity_id,source_id,before_value,after_value,request_id)"
            + " VALUES (?,?,?,?,?,?,?::jsonb,?::jsonb,?)",
        UUID.randomUUID(),
        actor,
        action,
        kind,
        entity,
        source,
        encode(before),
        encode(after),
        request);
  }

  @Transactional
  public void control(Actor actor, UUID id, String action) {
    admin(actor);
    var job = db.one("SELECT * FROM academic_import_job WHERE id=? FOR UPDATE", id);
    String status = (String) job.get("status");
    switch (action) {
      case "pause" -> {
        if (!Set.of("PENDING", "RUNNING").contains(status))
          throw ApiException.invalid("Este job não está em execução.");
        db.jdbc.update(
            "UPDATE academic_import_job SET status='PAUSED',updated_at=now() WHERE id=?", id);
      }
      case "resume" -> {
        if (!status.equals("PAUSED")) throw ApiException.invalid("Este job não está pausado.");
        db.jdbc.update(
            "UPDATE academic_import_job SET status='PENDING',updated_at=now() WHERE id=?", id);
      }
      case "cancel" -> {
        if (!Set.of("PENDING", "RUNNING", "PAUSED").contains(status))
          throw ApiException.invalid("Este job já foi encerrado.");
        db.jdbc.update(
            "UPDATE academic_import_job SET status='CANCELLED',completed_at=now(),updated_at=now()"
                + " WHERE id=?",
            id);
      }
      case "retry" -> {
        if (!Set.of("COMPLETED_WITH_ERRORS", "FAILED").contains(status))
          throw ApiException.invalid("Não há falhas encerradas para retomar.");
        db.jdbc.update(
            "UPDATE academic_import_item SET status='PENDING',error_message=NULL,error_code=NULL"
                + " WHERE job_id=? AND status='FAILED'",
            id);
        db.jdbc.update(
            "UPDATE academic_import_job SET status='PENDING',completed_at=NULL,updated_at=now()"
                + " WHERE id=?",
            id);
      }
      default -> throw ApiException.invalid("Ação inválida.");
    }
    audit(
        actor.id(),
        "JOB_" + action.toUpperCase(Locale.ROOT),
        "JOB",
        id,
        null,
        job,
        Map.of("action", action),
        null);
  }

  @Transactional
  public void review(Actor actor, UUID itemId, String action, CatalogRecord correction) {
    admin(actor);
    var item = db.one("SELECT * FROM academic_import_item WHERE id=?", itemId);
    var job = db.one("SELECT * FROM academic_import_job WHERE id=? FOR UPDATE", item.get("jobId"));
    item = db.one("SELECT * FROM academic_import_item WHERE id=? FOR UPDATE", itemId);
    if (!Set.of("PENDING_VERIFICATION", "FAILED").contains(item.get("status")))
      throw ApiException.invalid("Este item não aguarda revisão.");
    if (action.equals("approve")) {
      var value = correction == null ? decode(item.get("payload")) : correction;
      validate(value);
      if (!value.kind().equals(item.get("entityType"))
          || !value.externalId().equals(item.get("externalId")))
        throw ApiException.invalid("Preserve o identificador e o tipo do item.");
      if (!value.status().equals("VERIFIED"))
        throw ApiException.invalid(
            "Informe status VERIFIED, fonte e data de verificação para aprovar.");
      String payload = encode(value);
      db.jdbc.update(
          "UPDATE academic_import_item SET payload=?::jsonb,content_hash=?,source_url=? WHERE id=?",
          payload,
          hash(payload),
          value.source().url(),
          itemId);
      item.put("payload", payload);
      item.put("contentHash", hash(payload));
      job.put("requestedBy", actor.id());
      apply(job, item, true);
    } else if (action.equals("reject") || action.equals("archive")) {
      itemStatus(
          item,
          action.equals("reject") ? "REJECTED" : "ARCHIVED",
          (UUID) item.get("entityId"),
          null);
    } else throw ApiException.invalid("Ação de revisão inválida.");
    audit(
        actor.id(),
        "REVIEW_" + action.toUpperCase(Locale.ROOT),
        "IMPORT_ITEM",
        itemId,
        null,
        null,
        correction,
        null);
    refresh((UUID) item.get("jobId"));
  }
}

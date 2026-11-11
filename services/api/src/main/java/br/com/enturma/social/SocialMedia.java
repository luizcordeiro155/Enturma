package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.materials.ObjectStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/social/media")
public class SocialMedia {
  public static final int PART_BYTES = 2 * 1024 * 1024;
  private final Db db;
  private final SocialAccess access;
  private final ObjectStorageService storage;
  private final SocialTranscoder transcoder;
  private final ObjectMapper json;
  private final TransactionTemplate tx;
  private final boolean mediaEnabled;
  private final ExecutorService worker =
      Executors.newSingleThreadExecutor(
          r -> {
            Thread t = new Thread(r, "social-media");
            t.setDaemon(true);
            return t;
          });
  private final AtomicBoolean working = new AtomicBoolean();

  public SocialMedia(
      Db db,
      SocialAccess access,
      @org.springframework.beans.factory.annotation.Qualifier("socialObjectStorage")
          ObjectStorageService storage,
      SocialTranscoder transcoder,
      ObjectMapper json,
      org.springframework.transaction.PlatformTransactionManager manager,
      @Value("${SOCIAL_MEDIA_ENABLED:false}") boolean enabled) {
    this.db = db;
    this.access = access;
    this.storage = storage;
    this.transcoder = transcoder;
    this.json = json;
    this.tx = new TransactionTemplate(manager);
    this.mediaEnabled = enabled;
  }

  public boolean enabled() {
    return access.enabled() && mediaEnabled && storage.enabled() && transcoder.available();
  }

  private void ready() {
    access.require();
    if (!enabled())
      throw new ApiException(
          503,
          "SOCIAL_MEDIA_UNAVAILABLE",
          "Publicação de mídia ainda não habilitada. Seu rascunho continua disponível.");
  }

  public record Upload(
      @NotNull UUID id,
      @Pattern(regexp = "IMAGE|VIDEO") @NotNull String kind,
      @Min(1) @Max(134217728) long size) {}

  @PostMapping
  public Object create(@AuthenticationPrincipal Actor a, @Valid @RequestBody Upload upload) {
    ready();
    return tx.execute(
        status -> {
          access.profile(a.id());
          db.one("SELECT user_id FROM social_profile WHERE user_id=? FOR UPDATE", a.id());
          var existing =
              db.list(
                  "SELECT id,owner_id,kind,expected_bytes FROM social_media WHERE id=?",
                  upload.id());
          if (!existing.isEmpty()) {
            var m = existing.getFirst();
            if (!a.id().equals(m.get("ownerId"))
                || !upload.kind().equals(m.get("kind"))
                || upload.size() != ((Number) m.get("expectedBytes")).longValue())
              throw ApiException.forbidden();
            return status(a, upload.id());
          }
          // A fixed beta quota bounds processing and storage before a broader rollout.
          long bytes =
              db.jdbc.queryForObject(
                  "SELECT coalesce(sum(expected_bytes),0) FROM social_media WHERE owner_id=? AND"
                      + " state<>'DELETING'",
                  Long.class,
                  a.id());
          if (bytes + upload.size() > 512L * 1024 * 1024)
            throw new ApiException(
                413,
                "SOCIAL_QUOTA",
                "Limite de 512 MB de mídia por conta atingido. Remova mídias antigas antes de"
                    + " enviar.");
          db.jdbc.update(
              "INSERT INTO social_media(id,owner_id,kind,expected_bytes) VALUES (?,?,?,?)",
              upload.id(),
              a.id(),
              upload.kind(),
              upload.size());
          return status(a, upload.id());
        });
  }

  @GetMapping("/{id}")
  public Map<String, Object> status(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    access.require();
    var row =
        db.one(
            "SELECT"
                + " id,kind,state,expected_bytes,received_bytes,part_count,recipe,duration_ms,width,height,error,updated_at"
                + " FROM social_media WHERE id=? AND owner_id=? AND state<>'DELETING'",
            id,
            a.id());
    row.put("chunkBytes", PART_BYTES);
    return row;
  }

  @PutMapping(value = "/{id}/parts/{part}", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
  public Object part(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @PathVariable int part,
      HttpServletRequest request)
      throws IOException {
    ready();
    if (part < 0 || part >= 64 || request.getContentLengthLong() > PART_BYTES)
      throw ApiException.invalid("Parte de upload inválida.");
    byte[] bytes = request.getInputStream().readNBytes(PART_BYTES + 1);
    if (bytes.length == 0 || bytes.length > PART_BYTES)
      throw ApiException.invalid("Parte de upload inválida.");
    String hash;
    try {
      hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
    return tx.execute(
        s -> {
          var media =
              db.one(
                  "SELECT * FROM social_media WHERE id=? AND owner_id=? AND state='UPLOADING' FOR"
                      + " UPDATE",
                  id,
                  a.id());
          var prior =
              db.list(
                  "SELECT sha256 FROM social_media_part WHERE media_id=? AND ordinal=?", id, part);
          if (!prior.isEmpty()) {
            if (!hash.equals(prior.getFirst().get("sha256")))
              throw new ApiException(
                  409, "UPLOAD_CONFLICT", "O arquivo mudou. Inicie um novo envio.");
            return status(a, id);
          }
          long expected = ((Number) media.get("expectedBytes")).longValue(),
              received = ((Number) media.get("receivedBytes")).longValue();
          if (part != ((Number) media.get("partCount")).intValue()
              || bytes.length != Math.min(PART_BYTES, expected - received))
            throw ApiException.invalid("Envie as partes na ordem informada.");
          storage.put(key(id) + "part-" + part, bytes, "application/octet-stream");
          db.jdbc.update(
              "INSERT INTO social_media_part(media_id,ordinal,size,sha256) VALUES (?,?,?,?)",
              id,
              part,
              bytes.length,
              hash);
          db.jdbc.update(
              "UPDATE social_media SET"
                  + " part_count=part_count+1,received_bytes=received_bytes+?,updated_at=now()"
                  + " WHERE id=?",
              bytes.length,
              id);
          return status(a, id);
        });
  }

  public record Export(VideoRecipe recipe) {}

  @PostMapping("/{id}/export")
  public Object export(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Export body) {
    ready();
    return tx.execute(
        s -> {
          var row =
              db.one("SELECT * FROM social_media WHERE id=? AND owner_id=? FOR UPDATE", id, a.id());
          if (Set.of("QUEUED", "PROCESSING").contains(row.get("state"))) return status(a, id);
          if (!Set.of("UPLOADING", "FAILED").contains(row.get("state")))
            throw ApiException.invalid(
                "Esta mídia já foi finalizada. Envie outra cópia para editar.");
          if (((Number) row.get("attempts")).intValue() >= 3)
            throw ApiException.invalid(
                "O limite de três exportações deste arquivo foi atingido. Remova-o e escolha um"
                    + " novo arquivo.");
          if (!row.get("expectedBytes").equals(row.get("receivedBytes")))
            throw ApiException.invalid("Conclua o upload antes de exportar.");
          if ("VIDEO".equals(row.get("kind"))) {
            if (body.recipe() == null) throw ApiException.invalid("Revise os cortes do vídeo.");
            body.recipe().validated(3600);
          }
          try {
            db.jdbc.update(
                "UPDATE social_media SET recipe=?::jsonb,state='QUEUED',error=NULL,updated_at=now()"
                    + " WHERE id=?",
                json.writeValueAsString(body.recipe()),
                id);
          } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw ApiException.invalid("Edição inválida.");
          }
          return status(a, id);
        });
  }

  @DeleteMapping("/{id}")
  public void remove(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    access.require();
    tx.executeWithoutResult(
        status -> {
          // Same lock order as draft assignment. Publication owns the post lock, so its
          // committed state must be checked before marking any attached media for deletion.
          access.profile(a.id());
          db.one("SELECT user_id FROM social_profile WHERE user_id=? FOR UPDATE", a.id());
          var media =
              db.list("SELECT post_id FROM social_media WHERE id=? AND owner_id=?", id, a.id());
          if (media.isEmpty()) return;
          Object post = media.getFirst().get("postId");
          if (post != null) {
            var parent = db.one("SELECT state FROM social_post WHERE id=? FOR UPDATE", post);
            if (!"DRAFT".equals(parent.get("state"))) return;
          }
          db.jdbc.update(
              "UPDATE social_media SET state='DELETING',updated_at=now() WHERE id=? AND owner_id=?",
              id,
              a.id());
        });
  }

  @GetMapping("/{id}/content")
  public void content(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "false") boolean thumbnail,
      HttpServletRequest request,
      HttpServletResponse response)
      throws IOException {
    access.require();
    // Same authorization predicates as the feed, evaluated atomically with the media lookup.
    var row =
        db.one(
            "SELECT m.* FROM social_media m LEFT JOIN social_post p ON p.id=m.post_id WHERE m.id=?"
                + " AND m.state='READY' AND (m.owner_id=? OR ("
                + SocialAccess.published("p")
                + " AND "
                + SocialAccess.visible("p")
                + "))",
            id,
            a.id(),
            a.id(),
            a.id(),
            a.id(),
            a.id());
    long size = ((Number) row.get(thumbnail ? "thumbnailBytes" : "outputBytes")).longValue();
    long start = 0, end = size - 1;
    String range = request.getHeader("Range");
    if (range != null) {
      try {
        if (!range.matches("bytes=\\d*-\\d*")) throw new IllegalArgumentException();
        String[] parts = range.substring(6).split("-", -1);
        if (parts[0].isEmpty()) start = Math.max(0, size - Long.parseLong(parts[1]));
        else {
          start = Long.parseLong(parts[0]);
          if (!parts[1].isEmpty()) end = Math.min(end, Long.parseLong(parts[1]));
        }
        if (start > end || start >= size) throw new IllegalArgumentException();
      } catch (RuntimeException e) {
        response.setStatus(416);
        response.setHeader("Content-Range", "bytes */" + size);
        return;
      }
      response.setStatus(206);
      response.setHeader("Content-Range", "bytes " + start + "-" + end + "/" + size);
    }
    response.setHeader("Cache-Control", "private,no-store");
    response.setHeader("Accept-Ranges", "bytes");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setContentType(thumbnail ? "image/jpeg" : row.get("mime").toString());
    response.setContentLengthLong(end - start + 1);
    try (var in =
        storage.open(row.get(thumbnail ? "thumbnailKey" : "outputKey").toString(), start, end)) {
      in.transferTo(response.getOutputStream());
    }
  }

  static String key(UUID id) {
    return "social/" + id + "/";
  }

  @Scheduled(fixedDelay = 2000)
  public void process() {
    if (!enabled()) return;
    submit(this::processOne);
  }

  private void submit(Runnable action) {
    if (!working.compareAndSet(false, true)) return;
    try {
      worker.execute(
          () -> {
            try {
              action.run();
            } finally {
              working.set(false);
            }
          });
    } catch (RejectedExecutionException e) {
      working.set(false);
    }
  }

  @PreDestroy
  public void stop() {
    worker.shutdownNow();
  }

  // Media work must never hold the scheduler used by calls, rooms and notifications.
  void processOne() {
    var job =
        tx.execute(
            s -> {
              var rows =
                  db.list(
                      "SELECT * FROM social_media WHERE state='QUEUED' OR (state='PROCESSING' AND"
                          + " lease_until<now()) ORDER BY created_at LIMIT 1 FOR UPDATE SKIP"
                          + " LOCKED");
              if (rows.isEmpty()) return null;
              var row = rows.getFirst();
              if (((Number) row.get("attempts")).intValue() >= 3) {
                db.jdbc.update(
                    "UPDATE social_media SET state='FAILED',error='Não foi possível exportar. Tente"
                        + " um novo arquivo.' WHERE id=?",
                    row.get("id"));
                return null;
              }
              db.jdbc.update(
                  "UPDATE social_media SET"
                      + " state='PROCESSING',attempts=attempts+1,lease_until=now()+interval '20"
                      + " minutes',updated_at=now() WHERE id=?",
                  row.get("id"));
              return row;
            });
    if (job == null) return;
    UUID id = (UUID) job.get("id");
    Path dir = null;
    try {
      dir = Files.createTempDirectory("enturma-social-");
      try (var out = Files.newOutputStream(dir.resolve("source"))) {
        long total = 0;
        for (int part = 0; part < ((Number) job.get("partCount")).intValue(); part++)
          try (var in = storage.open(key(id) + "part-" + part, null, null)) {
            byte[] bytes = in.readNBytes(PART_BYTES + 1);
            total += bytes.length;
            if (bytes.length > PART_BYTES
                || total > ((Number) job.get("expectedBytes")).longValue())
              throw ApiException.invalid("Upload inconsistente.");
            out.write(bytes);
          }
        if (total != ((Number) job.get("expectedBytes")).longValue())
          throw ApiException.invalid("Upload incompleto.");
      }
      var recipe =
          json.treeToValue(
              (com.fasterxml.jackson.databind.JsonNode) job.get("recipe"), VideoRecipe.class);
      var result = transcoder.render(dir, job.get("kind").toString(), recipe);
      String output = key(id) + (result.mime().equals("video/mp4") ? "video.mp4" : "image.jpg"),
          thumb = key(id) + "cover.jpg";
      storage.putFile(output, result.file(), result.mime());
      storage.putFile(thumb, result.thumbnail(), "image/jpeg");
      db.jdbc.update(
          "UPDATE social_media SET"
              + " state='READY',output_key=?,thumbnail_key=?,output_bytes=?,thumbnail_bytes=?,mime=?,duration_ms=?,width=?,height=?,lease_until=NULL,updated_at=now()"
              + " WHERE id=? AND state='PROCESSING'",
          output,
          thumb,
          Files.size(result.file()),
          Files.size(result.thumbnail()),
          result.mime(),
          result.durationMs(),
          result.width(),
          result.height(),
          id);
    } catch (Exception e) {
      if (e instanceof InterruptedException) Thread.currentThread().interrupt();
      db.jdbc.update(
          "UPDATE social_media SET state='FAILED',error=?,lease_until=NULL,updated_at=now() WHERE"
              + " id=? AND state='PROCESSING'",
          e instanceof ApiException
              ? e.getMessage()
              : "Não foi possível processar a mídia. Seu rascunho foi preservado; tente novamente.",
          id);
    } finally {
      if (dir != null)
        try (var files = Files.walk(dir)) {
          files
              .sorted(Comparator.reverseOrder())
              .forEach(
                  p -> {
                    try {
                      Files.deleteIfExists(p);
                    } catch (IOException ignored) {
                    }
                  });
        } catch (IOException ignored) {
        }
    }
  }

  @Scheduled(fixedDelay = 60000)
  public void cleanup() {
    if (!storage.enabled()) return;
    submit(this::cleanupFiles);
  }

  void cleanupFiles() {
    for (var row :
        db.list(
            "SELECT id FROM social_media WHERE state='DELETING' AND (lease_until IS NULL OR"
                + " lease_until<now()) LIMIT 10")) {
      UUID id = (UUID) row.get("id");
      try {
        for (int i = 0; i < 64; i++) storage.delete(key(id) + "part-" + i);
        for (String file : List.of("image.jpg", "video.mp4", "cover.jpg"))
          storage.delete(key(id) + file);
        db.jdbc.update("DELETE FROM social_media WHERE id=? AND state='DELETING'", id);
      } catch (RuntimeException ignored) {
        /* Durable tombstone remains for a later retry. */
      }
    }
  }
}

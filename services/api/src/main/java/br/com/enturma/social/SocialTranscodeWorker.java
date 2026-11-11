package br.com.enturma.social;

import br.com.enturma.common.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Comparator;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Independent Railway FFmpeg process. No database, S3 credentials or public media storage.
 * Requests are authenticated and processed in one bounded directory at a time.
 */
public final class SocialTranscodeWorker {
  private static final long MAX_SOURCE_BYTES = 134217728L;
  private static final ObjectMapper JSON = new ObjectMapper();
  private static final AtomicBoolean BUSY = new AtomicBoolean(false);

  private SocialTranscodeWorker() {}

  public static void main(String[] args) throws Exception {
    String token = System.getenv("SOCIAL_FFMPEG_WORKER_TOKEN");
    if (token == null || token.length() < 32)
      throw new IllegalStateException("SOCIAL_FFMPEG_WORKER_TOKEN must contain at least 32 characters.");
    int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "3000"));
    HttpServer server = createServer(port, token, new SocialTranscoder(JSON, "ffmpeg", "ffprobe"));
    server.start();
    System.out.println("[Enturma Media Worker] Listening on port " + port);
  }

  static HttpServer createServer(int port, String token, SocialTranscoder transcoder)
      throws IOException {
    HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 16);
    server.setExecutor(
        Executors.newFixedThreadPool(
            4,
            runnable -> {
              Thread t = new Thread(runnable, "enturma-media-worker");
              t.setDaemon(true);
              return t;
            }));
    server.createContext(
        "/health",
        exchange -> {
          if (!"GET".equals(exchange.getRequestMethod())) {
            respond(exchange, 405, "Method not allowed");
            return;
          }
          boolean ready = transcoder.available();
          exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
          respond(exchange, ready ? 200 : 503, "{\"ready\":" + ready + "}");
        });
    server.createContext("/render", exchange -> handleRender(exchange, token, transcoder));
    return server;
  }

  private static void handleRender(HttpExchange exchange, String token, SocialTranscoder transcoder)
      throws IOException {
    Path dir = null;
    boolean locked = false;
    try {
      if (!"POST".equals(exchange.getRequestMethod())) {
        respond(exchange, 405, "Method not allowed");
        return;
      }
      String auth = exchange.getRequestHeaders().getFirst("Authorization");
      String presented = auth == null || !auth.startsWith("Bearer ") ? "" : auth.substring(7);
      if (!MessageDigest.isEqual(
          token.getBytes(StandardCharsets.UTF_8), presented.getBytes(StandardCharsets.UTF_8))) {
        respond(exchange, 401, "Unauthorized");
        return;
      }
      if (!transcoder.available()) {
        respond(exchange, 503, "FFmpeg unavailable");
        return;
      }
      String kind = exchange.getRequestHeaders().getFirst("X-Media-Kind");
      if (!"IMAGE".equals(kind) && !"VIDEO".equals(kind)) {
        respond(exchange, 422, "Invalid media kind");
        return;
      }
      String recipeHeader = exchange.getRequestHeaders().getFirst("X-Media-Recipe");
      if (recipeHeader == null || recipeHeader.length() > 32768) {
        respond(exchange, 422, "Invalid media recipe");
        return;
      }
      VideoRecipe recipe;
      try {
        byte[] encoded = Base64.getUrlDecoder().decode(recipeHeader);
        if (encoded.length > 24576) throw new IllegalArgumentException("Recipe too large");
        recipe = JSON.readValue(encoded, VideoRecipe.class);
      } catch (Exception e) {
        respond(exchange, 422, "Invalid media recipe");
        return;
      }
      if ("VIDEO".equals(kind) && recipe == null) {
        respond(exchange, 422, "Video recipe required");
        return;
      }
      if (!BUSY.compareAndSet(false, true)) {
        exchange.getResponseHeaders().set("Retry-After", "10");
        respond(exchange, 429, "Worker is processing another media file");
        return;
      }
      locked = true;
      long declared = -1;
      try {
        declared = Long.parseLong(
            exchange.getRequestHeaders().getFirst("Content-Length"));
      } catch (NumberFormatException | NullPointerException ignored) {}
      if (declared > MAX_SOURCE_BYTES) {
        respond(exchange, 413, "Media file exceeds 128 MB");
        return;
      }
      dir = Files.createTempDirectory("enturma-ffmpeg-worker-");
      try (var input = exchange.getRequestBody();
          var output = Files.newOutputStream(dir.resolve("source"))) {
        byte[] buffer = new byte[65536];
        long count = 0;
        int n;
        while ((n = input.read(buffer)) != -1) {
          count += n;
          if (count > MAX_SOURCE_BYTES) {
            respond(exchange, 413, "Media file exceeds 128 MB");
            return;
          }
          output.write(buffer, 0, n);
        }
        if (count == 0) {
          respond(exchange, 422, "Empty media");
          return;
        }
      }
      SocialTranscoder.Result result = transcoder.render(dir, kind, recipe);
      if (Files.size(result.file()) > MAX_SOURCE_BYTES) {
        respond(exchange, 422, "Rendered file exceeds size limit");
        return;
      }
      byte[] metadata =
          JSON.writeValueAsBytes(
              new Metadata(result.mime(), result.durationMs(), result.width(), result.height()));
      exchange.getResponseHeaders().set("Content-Type", "application/zip");
      exchange.getResponseHeaders().set("Cache-Control", "no-store");
      exchange.sendResponseHeaders(200, 0);
      try (ZipOutputStream zip = new ZipOutputStream(exchange.getResponseBody())) {
        add(zip, "media", result.file());
        add(zip, "thumbnail", result.thumbnail());
        zip.putNextEntry(new ZipEntry("metadata.json"));
        zip.write(metadata);
        zip.closeEntry();
      }
    } catch (ApiException e) {
      respondIfPossible(exchange, 422, "A mídia não passou na validação: " + e.getMessage());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      respondIfPossible(exchange, 503, "Transcoding interrupted");
    } catch (Exception e) {
      System.err.println("[Enturma Media Worker] Render failed: " + e.getClass().getSimpleName());
      respondIfPossible(exchange, 500, "Processing failed");
    } finally {
      if (dir != null) {
        try (var files = Files.walk(dir)) {
          files.sorted(Comparator.reverseOrder()).forEach(path -> {
            try { Files.deleteIfExists(path); } catch (IOException ignored) {}
          });
        } catch (IOException ignored) {}
      }
      if (locked) BUSY.set(false);
      exchange.close();
    }
  }

  private static void add(ZipOutputStream zip, String entry, Path file) throws IOException {
    zip.putNextEntry(new ZipEntry(entry));
    Files.copy(file, zip);
    zip.closeEntry();
  }

  private static void respondIfPossible(HttpExchange exchange, int status, String message) {
    try {
      respond(exchange, status, message);
    } catch (IOException ignored) {
      // Headers may already be sent; the caller detects a truncated ZIP.
    }
  }

  private static void respond(HttpExchange exchange, int status, String message) throws IOException {
    byte[] bytes = message.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Cache-Control", "no-store");
    exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
    exchange.sendResponseHeaders(status, bytes.length);
    try (var out = exchange.getResponseBody()) {
      out.write(bytes);
    }
  }

  private record Metadata(String mime, int durationMs, int width, int height) {}
}

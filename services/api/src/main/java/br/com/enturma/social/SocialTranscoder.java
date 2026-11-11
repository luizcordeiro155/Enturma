package br.com.enturma.social;

import br.com.enturma.common.ApiException;
import com.fasterxml.jackson.databind.*;
import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Base64;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * One bounded worker per API instance; generated local filenames only, no shell or network inputs.
 */
@Component
public class SocialTranscoder {
  private final ObjectMapper json;
  private final String ffmpeg, ffprobe, workerUrl, workerToken;
  private final HttpClient client = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(5)).build();
  private Boolean available;
  private static final String FORMATS =
      "mov,matroska,webm,avi,png_pipe,jpeg_pipe,webp_pipe,gif,image2";

  public record Result(
      Path file, Path thumbnail, String mime, int durationMs, int width, int height) {}

  @Autowired
  public SocialTranscoder(
      ObjectMapper json,
      @Value("${SOCIAL_FFMPEG:ffmpeg}") String ffmpeg,
      @Value("${SOCIAL_FFPROBE:ffprobe}") String ffprobe,
      @Value("${SOCIAL_FFMPEG_WORKER_URL:}") String workerUrl,
      @Value("${SOCIAL_FFMPEG_WORKER_TOKEN:}") String workerToken) {
    this.json = json;
    this.ffmpeg = ffmpeg;
    this.ffprobe = ffprobe;
    this.workerUrl = workerUrl.strip().replaceAll("/+$", "");
    this.workerToken = workerToken;
  }

  public SocialTranscoder(ObjectMapper json, String ffmpeg, String ffprobe) {
    this(json, ffmpeg, ffprobe, "", "");
  }

  /** Probe only once when media is enabled; never advertise uploads without the runtime. */
  public synchronized boolean available() {
    if (!workerUrl.isBlank()) {
      if (workerToken.length() < 32 || !workerUrl.startsWith("https://")) return false;
      try {
        var request = HttpRequest.newBuilder(URI.create(workerUrl + "/health"))
            .timeout(Duration.ofSeconds(6)).GET().build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.statusCode() == 200 && json.readTree(response.body()).path("ready").asBoolean(false);
      } catch (Exception ignored) {
        return false;
      }
    }
    if (available != null) return available;
    for (String command : List.of(ffmpeg, ffprobe)) {
      Process process = null;
      try {
        process =
            new ProcessBuilder(command, "-version")
                .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                .redirectError(ProcessBuilder.Redirect.DISCARD)
                .start();
        if (!process.waitFor(3, TimeUnit.SECONDS) || process.exitValue() != 0)
          return available = false;
      } catch (IOException e) {
        return available = false;
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return false;
      } finally {
        if (process != null && process.isAlive()) process.destroyForcibly();
      }
    }
    return available = true;
  }

  private JsonNode probe(Path dir, String file) throws IOException, InterruptedException {
    Path report = dir.resolve("probe.json");
    Process p =
        new ProcessBuilder(
                ffprobe,
                "-v",
                "error",
                "-protocol_whitelist",
                "file,pipe",
                "-format_whitelist",
                FORMATS,
                "-show_streams",
                "-show_format",
                "-of",
                "json",
                file)
            .directory(dir.toFile())
            .redirectOutput(report.toFile())
            .redirectError(dir.resolve("probe.log").toFile())
            .start();
    await(p, Duration.ofSeconds(20));
    if (Files.size(report) > 1024 * 1024)
      throw ApiException.invalid("Metadados de mídia inválidos.");
    return json.readTree(report.toFile());
  }

  public Result render(Path dir, String kind, VideoRecipe recipe)
      throws IOException, InterruptedException {
    if (!workerUrl.isBlank()) return renderRemote(dir, kind, recipe);
    JsonNode input = probe(dir, "source");
    JsonNode stream = null;
    boolean audio = false;
    for (var s : input.path("streams")) {
      if (s.path("codec_type").asText().equals("video") && stream == null) stream = s;
      if (s.path("codec_type").asText().equals("audio")) audio = true;
    }
    if (stream == null
        || stream.path("width").asInt() < 1
        || stream.path("height").asInt() < 1
        || (long) stream.path("width").asInt() * stream.path("height").asInt() > 33000000)
      throw ApiException.invalid("Não foi possível validar esta mídia.");
    String source = "source";
    double seconds = input.path("format").path("duration").asDouble(0);
    if (kind.equals("VIDEO") && (!Double.isFinite(seconds) || seconds <= 0)) {
      // MediaRecorder's live WebM does not necessarily contain Duration/Cues.
      // A bounded, lossless remux measures timestamps and makes the input seekable.
      // Never trust a client-supplied recording duration.
      run(
          dir,
          List.of(
              ffmpeg,
              "-nostdin",
              "-y",
              "-loglevel",
              "error",
              "-protocol_whitelist",
              "file,pipe",
              "-format_whitelist",
              FORMATS,
              "-i",
              "source",
              "-map",
              "0:v:0",
              "-map",
              "0:a:0?",
              "-c",
              "copy",
              "-t",
              "3601",
              "-fs",
              "150994944",
              "-avoid_negative_ts",
              "make_zero",
              "-f",
              "matroska",
              "measured.mkv"),
          Duration.ofSeconds(30));
      source = "measured.mkv";
      seconds = probe(dir, source).path("format").path("duration").asDouble(0);
      if (Files.size(dir.resolve(source)) >= 150994944)
        throw ApiException.invalid("Não foi possível validar a duração desta mídia.");
    }
    var args =
        new ArrayList<>(
            List.of(
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-nostdin",
                "-y",
                "-threads",
                "2",
                "-protocol_whitelist",
                "file,pipe",
                "-format_whitelist",
                FORMATS,
                "-i",
                source));
    if (kind.equals("IMAGE")) {
      args.addAll(
          List.of(
              "-map",
              "0:v:0",
              "-frames:v",
              "1",
              "-vf",
              "scale=1600:1600:force_original_aspect_ratio=decrease",
              "-map_metadata",
              "-1",
              "-q:v",
              "3",
              "image.jpg"));
      run(dir, args);
      var image = probe(dir, "image.jpg").path("streams").get(0);
      return new Result(
          dir.resolve("image.jpg"),
          dir.resolve("image.jpg"),
          "image/jpeg",
          0,
          image.path("width").asInt(),
          image.path("height").asInt());
    }
    if (!Double.isFinite(seconds) || seconds <= 0 || seconds > 3600 || recipe == null)
      throw ApiException.invalid("Importe um vídeo de até uma hora e selecione até 90 segundos.");
    recipe.validated(seconds);
    StringBuilder graph = new StringBuilder();
    int count = recipe.segments().size();
    for (int i = 0; i < count; i++) {
      var s = recipe.segments().get(i);
      graph
          .append("[0:v:0]trim=start=")
          .append(n(s.start()))
          .append(":end=")
          .append(n(s.end()))
          .append(",setpts=PTS-STARTPTS[v")
          .append(i)
          .append("];");
      if (audio && !recipe.mute())
        graph
            .append("[0:a:0]atrim=start=")
            .append(n(s.start()))
            .append(":end=")
            .append(n(s.end()))
            .append(",asetpts=PTS-STARTPTS[a")
            .append(i)
            .append("];");
    }
    for (int i = 0; i < count; i++) {
      graph.append("[v").append(i).append("]");
      if (audio && !recipe.mute()) graph.append("[a").append(i).append("]");
    }
    boolean sound = audio && !recipe.mute();
    graph
        .append("concat=n=")
        .append(count)
        .append(":v=1:a=")
        .append(sound ? 1 : 0)
        .append("[joined]")
        .append(sound ? "[sound];" : ";");
    graph.append("[joined]");
    if (recipe.rotation() == 90) graph.append("transpose=1,");
    if (recipe.rotation() == 270) graph.append("transpose=2,");
    if (recipe.rotation() == 180) graph.append("hflip,vflip,");
    int w = ((int) (720 * recipe.zoom()) / 2) * 2, h = ((int) (1280 * recipe.zoom()) / 2) * 2;
    graph
        .append("scale=")
        .append(w)
        .append(":")
        .append(h)
        .append(":force_original_aspect_ratio=increase,crop=720:1280:(iw-720)*")
        .append(n(recipe.x()))
        .append(":(ih-1280)*")
        .append(n(recipe.y()))
        .append(",setsar=1,fps=30");
    for (int i = 0; i < recipe.captions().size(); i++) {
      var c = recipe.captions().get(i);
      Files.writeString(dir.resolve("caption" + i + ".txt"), c.text());
      graph
          .append(",drawtext=textfile=caption")
          .append(i)
          .append(
              ".txt:expansion=none:fontcolor=white:fontsize=36:box=1:boxcolor=black@0.65:boxborderw=12:x=(w-text_w)/2:y=(h-text_h)*")
          .append(n(c.y()))
          .append(":enable='between(t,")
          .append(n(c.start()))
          .append(',')
          .append(n(c.end()))
          .append(")'");
    }
    graph.append("[out]");
    if (sound) graph.append(";[sound]volume=").append(n(recipe.volume())).append("[aout]");
    args.addAll(
        List.of(
            "-filter_complex_threads", "1", "-filter_complex", graph.toString(), "-map", "[out]"));
    if (sound) args.addAll(List.of("-map", "[aout]", "-c:a", "aac", "-b:a", "128k"));
    args.addAll(
        List.of(
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "25",
            "-pix_fmt",
            "yuv420p",
            "-threads",
            "2",
            "-map_metadata",
            "-1",
            "-t",
            "90",
            "-movflags",
            "+faststart",
            "-fs",
            "134217728",
            "video.mp4"));
    run(dir, args);
    var output = probe(dir, "video.mp4");
    int ms = (int) Math.round(output.path("format").path("duration").asDouble() * 1000);
    // Never accept an incomplete/truncated output as a successful export.
    if (ms <= 0 || ms > 90000 || Math.abs(ms - Math.round(recipe.duration() * 1000)) > 120)
      throw ApiException.invalid("O vídeo exportado não passou pela validação de duração.");
    run(
        dir,
        List.of(
            ffmpeg,
            "-nostdin",
            "-y",
            "-loglevel",
            "error",
            "-ss",
            n(recipe.cover()),
            "-i",
            "video.mp4",
            "-frames:v",
            "1",
            "-vf",
            "scale=360:640",
            "-q:v",
            "3",
            "cover.jpg"));
    return new Result(
        dir.resolve("video.mp4"), dir.resolve("cover.jpg"), "video/mp4", ms, 720, 1280);
  }


  private Result renderRemote(Path dir, String kind, VideoRecipe recipe)
      throws IOException, InterruptedException {
    if (workerToken.length() < 32 || !workerUrl.startsWith("https://"))
      throw new IOException("Remote FFmpeg worker is not configured.");
    byte[] recipeBytes = json.writeValueAsBytes(recipe);
    String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(recipeBytes);
    var request = HttpRequest.newBuilder(URI.create(workerUrl + "/render"))
        .timeout(Duration.ofMinutes(12))
        .header("Authorization", "Bearer " + workerToken)
        .header("X-Media-Kind", kind)
        .header("X-Media-Recipe", encoded)
        .header("Content-Type", "application/octet-stream")
        .POST(HttpRequest.BodyPublishers.ofFile(dir.resolve("source")))
        .build();
    var response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
    try (var body = response.body()) {
      if (response.statusCode() != 200) {
        String reason = new String(body.readNBytes(512), StandardCharsets.UTF_8);
        if (response.statusCode() == 422)
          throw ApiException.invalid("Mídia inválida: " + reason);
        throw new IOException("Remote media worker returned HTTP " + response.statusCode());
      }
      byte[] metadata = null;
      boolean hasMedia = false, hasThumbnail = false;
      try (var zip = new ZipInputStream(body)) {
        ZipEntry entry;
        while ((entry = zip.getNextEntry()) != null) {
          String name = entry.getName();
          if (!Set.of("media", "thumbnail", "metadata.json").contains(name) || entry.isDirectory())
            throw new IOException("Unexpected file in worker response");
          if ("metadata.json".equals(name)) {
            if (metadata != null) throw new IOException("Duplicate metadata");
            metadata = zip.readNBytes(4097);
            if (metadata.length > 4096) throw new IOException("Metadata size exceeded");
          } else {
            if (("media".equals(name) && hasMedia) || ("thumbnail".equals(name) && hasThumbnail))
              throw new IOException("Duplicate media");
            Path target = dir.resolve(name);
            try (var out = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW)) {
              byte[] buffer = new byte[65536];
              long count = 0;
              int read;
              while ((read = zip.read(buffer)) != -1) {
                count += read;
                if (count > 134217728L) throw new IOException("Media size exceeded");
                out.write(buffer, 0, read);
              }
            }
            if ("media".equals(name)) hasMedia = true;
            if ("thumbnail".equals(name)) hasThumbnail = true;
          }
          zip.closeEntry();
        }
      }
      if (!hasMedia || !hasThumbnail || metadata == null)
        throw new IOException("Worker returned incomplete media");
      JsonNode result = json.readTree(metadata);
      String mime = result.path("mime").asText();
      if ((!kind.equals("IMAGE") && !mime.equals("video/mp4")) ||
          (!kind.equals("VIDEO") && !mime.equals("image/jpeg")))
        throw new IOException("Unexpected media type from worker");
      int duration = result.path("durationMs").asInt(-1);
      int width = result.path("width").asInt(-1), height = result.path("height").asInt(-1);
      if (duration < 0 || duration > 90000 || width < 1 || height < 1)
        throw new IOException("Invalid transcode metadata");
      return new Result(dir.resolve("media"), dir.resolve("thumbnail"), mime,
          duration, width, height);
    }
  }

  private static String n(double value) {
    return String.format(Locale.ROOT, "%.5f", value);
  }

  private void run(Path dir, List<String> args) throws IOException, InterruptedException {
    run(dir, args, Duration.ofMinutes(8));
  }

  private void run(Path dir, List<String> args, Duration timeout)
      throws IOException, InterruptedException {
    Process p =
        new ProcessBuilder(args)
            .directory(dir.toFile())
            .redirectOutput(ProcessBuilder.Redirect.DISCARD)
            .redirectError(dir.resolve("render.log").toFile())
            .start();
    await(p, timeout);
  }

  private static void await(Process p, Duration timeout) throws InterruptedException {
    try {
      if (!p.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS))
        throw ApiException.invalid(
            "O processamento excedeu o tempo permitido. Tente um vídeo menor.");
      if (p.exitValue() != 0)
        throw ApiException.invalid("Formato de mídia não suportado ou arquivo danificado.");
    } finally {
      if (p.isAlive()) p.destroyForcibly();
    }
  }
}

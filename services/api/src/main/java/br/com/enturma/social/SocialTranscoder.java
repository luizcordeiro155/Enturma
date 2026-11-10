package br.com.enturma.social;

import br.com.enturma.common.ApiException;
import com.fasterxml.jackson.databind.*;
import java.io.*;
import java.nio.file.*;
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
  private final String ffmpeg, ffprobe;
  private static final String FORMATS =
      "mov,matroska,webm,avi,png_pipe,jpeg_pipe,webp_pipe,gif,image2";

  public record Result(
      Path file, Path thumbnail, String mime, int durationMs, int width, int height) {}

  public SocialTranscoder(
      ObjectMapper json,
      @Value("${SOCIAL_FFMPEG:ffmpeg}") String ffmpeg,
      @Value("${SOCIAL_FFPROBE:ffprobe}") String ffprobe) {
    this.json = json;
    this.ffmpeg = ffmpeg;
    this.ffprobe = ffprobe;
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
                "source"));
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
    double seconds = input.path("format").path("duration").asDouble(0);
    if (seconds <= 0 || seconds > 3600 || recipe == null)
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

  private static String n(double value) {
    return String.format(Locale.ROOT, "%.5f", value);
  }

  private void run(Path dir, List<String> args) throws IOException, InterruptedException {
    Process p =
        new ProcessBuilder(args)
            .directory(dir.toFile())
            .redirectOutput(ProcessBuilder.Redirect.DISCARD)
            .redirectError(dir.resolve("render.log").toFile())
            .start();
    await(p, Duration.ofMinutes(8));
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

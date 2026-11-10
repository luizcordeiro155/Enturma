package br.com.enturma.social;

import static org.assertj.core.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;

class SocialTranscoderTest {
  @TempDir Path dir;

  @Test
  void acceptsExactlyNinetySecondsIncludingAudioWithoutExceedingTheLimit() throws Exception {
    Assumptions.assumeTrue("true".equals(System.getenv("SOCIAL_TEST_FFMPEG")));
    var process =
        new ProcessBuilder(
                "ffmpeg",
                "-nostdin",
                "-y",
                "-loglevel",
                "error",
                "-f",
                "lavfi",
                "-i",
                "color=c=green:size=320x240:rate=30",
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=440:sample_rate=48000",
                "-t",
                "91",
                "-c:v",
                "libx264",
                "-c:a",
                "aac",
                "-f",
                "mp4",
                "source")
            .directory(dir.toFile())
            .redirectError(ProcessBuilder.Redirect.INHERIT)
            .start();
    assertThat(process.waitFor(45, TimeUnit.SECONDS)).isTrue();
    assertThat(process.exitValue()).isZero();
    var recipe =
        new VideoRecipe(
            List.of(new VideoRecipe.Segment(1, 91)), 1, .5, .5, 0, 1, false, 89, List.of());
    var result =
        new SocialTranscoder(new ObjectMapper(), "ffmpeg", "ffprobe").render(dir, "VIDEO", recipe);
    assertThat(result.durationMs()).isBetween(89900, 90000);
    assertThat(Files.size(result.thumbnail())).isGreaterThan(1000);
  }

  @Test
  void exportsReorderedCroppedCaptionedMutedVideoAndCover() throws Exception {
    Assumptions.assumeTrue(
        "true".equals(System.getenv("SOCIAL_TEST_FFMPEG")),
        "Enable SOCiAL_TEST_FFMPEG with the installed media runtime");
    var p =
        new ProcessBuilder(
                "ffmpeg",
                "-nostdin",
                "-y",
                "-loglevel",
                "error",
                "-f",
                "lavfi",
                "-i",
                "testsrc2=size=320x240:rate=30",
                "-t",
                "3",
                "-c:v",
                "libx264",
                "-f",
                "mp4",
                "source")
            .directory(dir.toFile())
            .redirectError(ProcessBuilder.Redirect.INHERIT)
            .start();
    assertThat(p.waitFor(30, TimeUnit.SECONDS)).isTrue();
    assertThat(p.exitValue()).isZero();
    var recipe =
        new VideoRecipe(
            List.of(new VideoRecipe.Segment(2, 3), new VideoRecipe.Segment(0, 1)),
            1.2,
            .7,
            .2,
            90,
            1,
            true,
            .5,
            List.of(new VideoRecipe.Caption("Olá Enturma: 100% 'texto'", 0, 2, .8)));
    var result =
        new SocialTranscoder(new ObjectMapper(), "ffmpeg", "ffprobe").render(dir, "VIDEO", recipe);
    assertThat(result.durationMs()).isBetween(1950, 2050);
    assertThat(result.width()).isEqualTo(720);
    assertThat(result.height()).isEqualTo(1280);
    assertThat(Files.size(result.file())).isGreaterThan(1000);
    assertThat(Files.size(result.thumbnail())).isGreaterThan(1000);
  }
}

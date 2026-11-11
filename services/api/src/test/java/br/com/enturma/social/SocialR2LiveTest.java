package br.com.enturma.social;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.materials.S3Storage;
import java.nio.file.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.env.StandardEnvironment;

/** Opt-in cloud contract test: only creates/deletes its own random fixture object. */
@EnabledIfEnvironmentVariable(named = "SOCIAL_R2_SMOKE", matches = "true")
class SocialR2LiveTest {
  @TempDir Path dir;

  @Test
  void streamsFileAndServesExactByteRangesFromPrivateR2() throws Exception {
    byte[] bytes = new byte[131072];
    for (int i = 0; i < bytes.length; i++) bytes[i] = (byte) (i % 251);
    Path source = dir.resolve("fixture.bin");
    Files.write(source, bytes);
    String key = "social/smoke/" + UUID.randomUUID() + "/fixture.bin";
    try (var storage = new S3Storage(new StandardEnvironment(), "SOCIAL_STORAGE_")) {
      assertThat(storage.enabled()).isTrue();
      try {
        storage.putFile(key, source, "application/octet-stream");
        try (var stream = storage.open(key, 1021L, 5097L)) {
          assertThat(stream.readAllBytes())
              .isEqualTo(java.util.Arrays.copyOfRange(bytes, 1021, 5098));
        }
        assertThat(storage.get(key)).isEqualTo(bytes);
      } finally {
        storage.delete(key);
      }
    }
  }
}

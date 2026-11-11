package br.com.enturma.social;

import br.com.enturma.materials.ObjectStorageService;
import br.com.enturma.materials.S3Storage;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/** A dedicated private R2/S3 bucket. Room materials and chat keep their existing store. */
@Configuration
public class SocialStorageConfiguration {
  @Bean
  public ObjectStorageService socialObjectStorage(Environment env) {
    return new S3Storage(env, "SOCIAL_STORAGE_");
  }
}

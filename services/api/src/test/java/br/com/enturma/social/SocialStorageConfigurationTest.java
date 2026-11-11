package br.com.enturma.social;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.materials.ObjectStorageService;
import br.com.enturma.materials.S3Storage;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class SocialStorageConfigurationTest {
  private final ApplicationContextRunner context =
      new ApplicationContextRunner()
          .withUserConfiguration(S3Storage.class, SocialStorageConfiguration.class);

  @Test
  void existingMaterialsCredentialsNeverEnableSocialStorage() {
    context
        .withPropertyValues(
            "OBJECT_STORAGE_BUCKET=materials",
            "OBJECT_STORAGE_ACCESS_KEY=test",
            "OBJECT_STORAGE_SECRET_KEY=test")
        .run(
            app -> {
              assertThat(app).hasNotFailed();
              assertThat(app.getBean(ObjectStorageService.class).enabled()).isTrue();
              assertThat(app.getBean("socialObjectStorage", ObjectStorageService.class).enabled())
                  .isFalse();
            });
  }

  @Test
  void socialCredentialsNeverReplaceTheExistingMaterialsStore() {
    context
        .withPropertyValues(
            "SOCIAL_STORAGE_BUCKET=social",
            "SOCIAL_STORAGE_ACCESS_KEY=test",
            "SOCIAL_STORAGE_SECRET_KEY=test",
            "SOCIAL_STORAGE_REGION=auto")
        .run(
            app -> {
              assertThat(app).hasNotFailed();
              assertThat(app.getBean(ObjectStorageService.class).enabled()).isFalse();
              assertThat(app.getBean("socialObjectStorage", ObjectStorageService.class).enabled())
                  .isTrue();
            });
  }
}

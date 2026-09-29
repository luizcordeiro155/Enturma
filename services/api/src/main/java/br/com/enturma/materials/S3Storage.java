package br.com.enturma.materials;

import br.com.enturma.common.ApiException;
import java.net.URI;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.*;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Service
public class S3Storage implements ObjectStorageService {
  private final S3Client client;
  private final String bucket;

  public S3Storage(Environment env) {
    bucket = env.getProperty("OBJECT_STORAGE_BUCKET", "");
    String key = env.getProperty("OBJECT_STORAGE_ACCESS_KEY", "");
    String secret = env.getProperty("OBJECT_STORAGE_SECRET_KEY", "");
    if (key.isBlank() || secret.isBlank() || bucket.isBlank()) {
      client = null;
      return;
    }
    var builder =
        S3Client.builder()
            .region(Region.of(env.getProperty("OBJECT_STORAGE_REGION", "us-east-1")))
            .credentialsProvider(
                StaticCredentialsProvider.create(AwsBasicCredentials.create(key, secret)))
            .forcePathStyle(true)
            .overrideConfiguration(c -> c.apiCallTimeout(java.time.Duration.ofSeconds(20)));
    String endpoint = env.getProperty("OBJECT_STORAGE_ENDPOINT", "");
    if (!endpoint.isBlank()) builder.endpointOverride(URI.create(endpoint));
    client = builder.build();
  }

  public boolean enabled() {
    return client != null;
  }

  private void ready() {
    if (!enabled())
      throw new ApiException(
          503, "STORAGE_UNAVAILABLE", "O envio de materiais ainda não está disponível.");
  }

  public void put(String key, byte[] bytes, String mime) {
    ready();
    client.putObject(
        r -> r.bucket(bucket).key(key).contentType(mime), RequestBody.fromBytes(bytes));
  }

  public byte[] get(String key) {
    ready();
    return client.getObjectAsBytes(r -> r.bucket(bucket).key(key)).asByteArray();
  }

  public void delete(String key) {
    ready();
    client.deleteObject(r -> r.bucket(bucket).key(key));
  }
}

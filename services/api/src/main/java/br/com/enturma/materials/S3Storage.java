package br.com.enturma.materials;

import br.com.enturma.common.ApiException;
import java.net.URI;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.*;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Service
@Primary
public class S3Storage implements ObjectStorageService, AutoCloseable {
  private final S3Client client;
  private final String bucket;

  @Autowired
  public S3Storage(Environment env) {
    this(env, "OBJECT_STORAGE_");
  }

  public S3Storage(Environment env, String prefix) {
    bucket = env.getProperty(prefix + "BUCKET", "");
    String key = env.getProperty(prefix + "ACCESS_KEY", "");
    String secret = env.getProperty(prefix + "SECRET_KEY", "");
    if (key.isBlank() || secret.isBlank() || bucket.isBlank()) {
      client = null;
      return;
    }
    var builder =
        S3Client.builder()
            .region(
                Region.of(
                    env.getProperty(
                        prefix + "REGION",
                        prefix.equals("SOCIAL_STORAGE_") ? "auto" : "us-east-1")))
            .credentialsProvider(
                StaticCredentialsProvider.create(AwsBasicCredentials.create(key, secret)))
            .forcePathStyle(true)
            // R2 requires a known content length, not AWS's streaming checksum trailer.
            .serviceConfiguration(S3Configuration.builder().chunkedEncodingEnabled(false).build())
            .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
            .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
            .overrideConfiguration(c -> c.apiCallTimeout(java.time.Duration.ofSeconds(20)));
    String endpoint = env.getProperty(prefix + "ENDPOINT", "");
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

  public void putFile(String key, java.nio.file.Path file, String mime) {
    ready();
    client.putObject(
        r ->
            r.bucket(bucket)
                .key(key)
                .contentType(mime)
                .overrideConfiguration(c -> c.apiCallTimeout(java.time.Duration.ofMinutes(3))),
        RequestBody.fromFile(file));
  }

  public java.io.InputStream open(String key, Long start, Long end) {
    ready();
    return client.getObject(
        r -> {
          r.bucket(bucket).key(key);
          if (start != null) r.range("bytes=" + start + "-" + end);
        });
  }

  public void delete(String key) {
    ready();
    client.deleteObject(r -> r.bucket(bucket).key(key));
  }

  @Override
  public void close() {
    if (client != null) client.close();
  }
}

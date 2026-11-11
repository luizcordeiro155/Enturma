package br.com.enturma.materials;

public interface ObjectStorageService {
  void put(String key, byte[] bytes, String mime);

  byte[] get(String key);

  void putFile(String key, java.nio.file.Path file, String mime);

  java.io.InputStream open(String key, Long start, Long end);

  void delete(String key);

  boolean enabled();
}

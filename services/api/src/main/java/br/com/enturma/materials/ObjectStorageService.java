package br.com.enturma.materials;

public interface ObjectStorageService {
  void put(String key, byte[] bytes, String mime);

  byte[] get(String key);

  void delete(String key);

  boolean enabled();
}

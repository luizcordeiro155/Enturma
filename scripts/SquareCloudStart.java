import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.zip.*;

/** Native Git deployment: bootstrap Maven using only the installed JDK. */
class SquareCloudStart {
  static final Path ROOT = Path.of("").toAbsolutePath().normalize();
  static final Path CACHE = ROOT.resolve(".squarecloud-build");
  static final String VERSION = "3.9.11";
  static final String SHA512 = "03e2d65d4483a3396980629f260e25cac0d8b6f7f2791e4dc20bc83f9514db8d0f05b0479e699a5f34679250c49c8e52e961262ded468a20de0be254d8207076";
  static final String JAVA = Path.of(System.getProperty("java.home"), "bin", "java").toString();

  public static void main(String[] args) throws Exception {
    Files.createDirectories(CACHE);
    String source = fingerprint();
    Path jar = ROOT.resolve("app.jar");
    Path marker = CACHE.resolve("build.sha256");
    String expected = Files.exists(marker) ? Files.readString(marker) : "";
    if (!Files.exists(jar) || !expected.equals(source + "\n" + digest(jar, "SHA-256"))) {
      System.out.println("[Enturma Git] Compilando API sincronizada: " + source.substring(0, 12));
      Path maven = maven();
      List<String> command = new ArrayList<>(List.of(JAVA, "-Xmx384m",
          "-Dmaven.home=" + maven, "-Dclassworlds.conf=" + maven.resolve("bin/m2.conf"),
          "-Dmaven.multiModuleProjectDirectory=" + ROOT.resolve("services/api"),
          "-cp", maven.resolve("boot") + File.separator + "*",
          "org.codehaus.plexus.classworlds.launcher.Launcher", "-B", "-ntp",
          "-f", ROOT.resolve("services/api/pom.xml").toString(),
          "-Dmaven.repo.local=" + CACHE.resolve("repository"),
          "-Dmaven.test.skip=true", "clean", "package"));
      int result = run(command);
      if (result != 0) throw new IOException("Build falhou; o JAR antigo não será iniciado. Código " + result);
      Path built = ROOT.resolve("services/api/target/enturma-api-0.1.0.jar");
      try (ZipFile zip = new ZipFile(built.toFile())) {
        if (zip.getEntry("BOOT-INF/classes/br/com/enturma/EnturmaApplication.class") == null)
          throw new IOException("Artefato não é o JAR executável do Enturma");
      }
      Path pending = ROOT.resolve("app.jar.pending");
      Files.copy(built, pending, StandardCopyOption.REPLACE_EXISTING);
      Files.move(pending, jar, StandardCopyOption.REPLACE_EXISTING);
      Files.writeString(marker, source + "\n" + digest(jar, "SHA-256"));
    }
    System.out.println("[Enturma Git] API atualizada: " + source.substring(0, 12));
    if (Arrays.asList(args).contains("--build-only")) return;
    System.exit(run(List.of(JAVA, "-XX:MaxRAMPercentage=60", "-XX:+ExitOnOutOfMemoryError",
        "-jar", jar.toString(), "--spring.profiles.active=squarecloud")));
  }

  static int run(List<String> command) throws Exception {
    Process child = new ProcessBuilder(command).directory(ROOT.toFile()).inheritIO().start();
    Thread shutdown = new Thread(() -> {
      child.destroy();
      try { if (!child.waitFor(25, java.util.concurrent.TimeUnit.SECONDS)) child.destroyForcibly(); }
      catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
    });
    Runtime.getRuntime().addShutdownHook(shutdown);
    try { return child.waitFor(); }
    finally { Runtime.getRuntime().removeShutdownHook(shutdown); }
  }

  static Path maven() throws Exception {
    Path home = CACHE.resolve("apache-maven-" + VERSION);
    if (Files.isRegularFile(home.resolve(".verified"))) return home;
    Path zip = CACHE.resolve("maven.zip");
    URI uri = URI.create("https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/"
        + VERSION + "/apache-maven-" + VERSION + "-bin.zip");
    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
    var response = client.send(HttpRequest.newBuilder(uri).timeout(Duration.ofMinutes(3)).GET().build(),
        HttpResponse.BodyHandlers.ofFile(zip, StandardOpenOption.CREATE,
            StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING));
    if (response.statusCode() != 200 || !SHA512.equals(digest(zip, "SHA-512")))
      throw new IOException("Download Maven inválido (HTTP/checksum).");
    try (ZipInputStream input = new ZipInputStream(Files.newInputStream(zip))) {
      for (ZipEntry entry; (entry = input.getNextEntry()) != null;) {
        Path dest = CACHE.resolve(entry.getName()).normalize();
        if (!dest.startsWith(home)) throw new IOException("Caminho inseguro no ZIP Maven");
        if (entry.isDirectory()) Files.createDirectories(dest);
        else {
          Files.createDirectories(dest.getParent());
          Files.copy(input, dest, StandardCopyOption.REPLACE_EXISTING);
        }
      }
    }
    Files.writeString(home.resolve(".verified"), SHA512);
    Files.delete(zip);
    return home;
  }

  static String fingerprint() throws Exception {
    List<Path> paths = new ArrayList<>(List.of(ROOT.resolve("services/api/pom.xml"),
        ROOT.resolve("scripts/SquareCloudStart.java")));
    try (var walk = Files.walk(ROOT.resolve("services/api/src/main"))) {
      walk.filter(Files::isRegularFile).forEach(paths::add);
    }
    paths.sort(Comparator.naturalOrder());
    MessageDigest hash = MessageDigest.getInstance("SHA-256");
    for (Path path : paths) {
      hash.update(ROOT.relativize(path).toString().replace('\\', '/').getBytes(java.nio.charset.StandardCharsets.UTF_8));
      hash.update((byte) 0);
      hash.update(Files.readAllBytes(path));
    }
    hash.update(System.getProperty("java.version").getBytes(java.nio.charset.StandardCharsets.UTF_8));
    return HexFormat.of().formatHex(hash.digest());
  }

  static String digest(Path file, String algorithm) throws Exception {
    MessageDigest hash = MessageDigest.getInstance(algorithm);
    try (InputStream input = Files.newInputStream(file)) {
      byte[] buffer = new byte[65536];
      for (int count; (count = input.read(buffer)) != -1;) hash.update(buffer, 0, count);
    }
    return HexFormat.of().formatHex(hash.digest());
  }
}

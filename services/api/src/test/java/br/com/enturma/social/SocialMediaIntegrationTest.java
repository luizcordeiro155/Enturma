package br.com.enturma.social;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.materials.ObjectStorageService;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

/** Real PostgreSQL and FFmpeg; only the paid object-store boundary is replaced. */
@SpringBootTest(properties = {"SOCIAL_ENABLED=true", "SOCIAL_MEDIA_ENABLED=true"})
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
@Transactional
class SocialMediaIntegrationTest {
  @Autowired SocialMedia media;
  @Autowired SocialPosts posts;
  @Autowired AuthService auth;
  @Autowired Db db;
  @Autowired org.springframework.transaction.PlatformTransactionManager transactions;

  @MockitoBean(name = "socialObjectStorage")
  ObjectStorageService storage;

  @TempDir Path dir;
  final Map<String, byte[]> objects = new ConcurrentHashMap<>();
  Actor owner, viewer;

  Actor user() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    return auth.authenticate(
            auth.register(
                    "Criador", "media_" + tag, tag + "@example.test", "password-12345", "JUnit")
                .accessToken())
        .orElseThrow();
  }

  @BeforeEach
  void setup() throws Exception {
    Assumptions.assumeTrue("true".equals(System.getenv("SOCIAL_TEST_FFMPEG")));
    owner = user();
    viewer = user();
    when(storage.enabled()).thenReturn(true);
    doAnswer(
            i -> {
              objects.put(i.getArgument(0), i.getArgument(1));
              return null;
            })
        .when(storage)
        .put(anyString(), any(byte[].class), anyString());
    doAnswer(
            i -> {
              objects.put(i.getArgument(0), Files.readAllBytes(i.getArgument(1, Path.class)));
              return null;
            })
        .when(storage)
        .putFile(anyString(), any(Path.class), anyString());
    when(storage.open(anyString(), nullable(Long.class), nullable(Long.class)))
        .thenAnswer(
            i -> {
              byte[] data = Objects.requireNonNull(objects.get(i.getArgument(0)));
              Long start = i.getArgument(1), end = i.getArgument(2);
              return new ByteArrayInputStream(
                  Arrays.copyOfRange(
                      data,
                      start == null ? 0 : start.intValue(),
                      end == null ? data.length : end.intValue() + 1));
            });
    doAnswer(
            i -> {
              objects.remove(i.getArgument(0));
              return null;
            })
        .when(storage)
        .delete(anyString());
  }

  MockHttpServletRequest body(byte[] bytes) {
    var req = new MockHttpServletRequest();
    req.setContent(bytes);
    return req;
  }

  @Test
  void interruptedUploadResumesAndExportsWithPrivateRangesThenDeletes() throws Exception {
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
                "testsrc2=size=320x240:rate=30",
                "-t",
                "3",
                "-c:v",
                "libx264",
                dir.resolve("source.mp4").toString())
            .redirectError(ProcessBuilder.Redirect.INHERIT)
            .start();
    assertThat(process.waitFor(30, TimeUnit.SECONDS)).isTrue();
    assertThat(process.exitValue()).isZero();
    byte[] bytes = Files.readAllBytes(dir.resolve("source.mp4"));
    UUID id = UUID.randomUUID();
    media.create(owner, new SocialMedia.Upload(id, "VIDEO", bytes.length));
    assertThatThrownBy(() -> media.status(viewer, id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> media.part(owner, id, 1, body(bytes)))
        .isInstanceOf(ApiException.class);
    media.part(owner, id, 0, body(bytes));
    media.part(owner, id, 0, body(bytes));
    assertThat(media.status(owner, id))
        .containsEntry("partCount", 1)
        .containsEntry("receivedBytes", (long) bytes.length);
    byte[] changed = bytes.clone();
    changed[0] ^= 1;
    assertThatThrownBy(() -> media.part(owner, id, 0, body(changed)))
        .isInstanceOf(ApiException.class);
    var recipe =
        new VideoRecipe(
            List.of(new VideoRecipe.Segment(.5, 2.5)),
            1.2,
            .5,
            .5,
            0,
            1,
            true,
            .5,
            List.of(new VideoRecipe.Caption("Enturma", 0, 2, .8)));
    media.export(owner, id, new SocialMedia.Export(recipe));
    media.export(owner, id, new SocialMedia.Export(recipe));
    media.processOne();
    assertThat(media.status(owner, id)).containsEntry("state", "READY");
    assertThat(((Number) media.status(owner, id).get("durationMs")).longValue())
        .isBetween(1950L, 2050L);
    var req = new MockHttpServletRequest();
    req.addHeader("Range", "bytes=0-99");
    var response = new MockHttpServletResponse();
    media.content(owner, id, false, req, response);
    assertThat(response.getStatus()).isEqualTo(206);
    assertThat(response.getContentAsByteArray()).hasSize(100);
    assertThat(response.getHeader("Cache-Control")).isEqualTo("private,no-store");
    assertThatThrownBy(() -> media.content(viewer, id, false, req, new MockHttpServletResponse()))
        .isInstanceOf(ApiException.class);
    UUID post = UUID.randomUUID();
    var draft =
        posts.draft(
            owner,
            new SocialPosts.Draft(
                post, "CLIP", "Resultado exportado", "PUBLIC", null, 0, List.of(id)));
    posts.publish(owner, post, ((Number) draft.get("version")).intValue());
    media.remove(owner, id);
    assertThat(media.status(owner, id)).containsEntry("state", "READY");
    media.content(viewer, id, true, new MockHttpServletRequest(), new MockHttpServletResponse());
    db.jdbc.update(
        "INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)", owner.id(), viewer.id());
    assertThatThrownBy(() -> media.content(viewer, id, false, req, new MockHttpServletResponse()))
        .isInstanceOf(ApiException.class);
    posts.remove(owner, post);
    media.cleanupFiles();
    assertThat(objects).isEmpty();
    assertThat(
            db.jdbc.queryForObject("SELECT count(*) FROM social_media WHERE id=?", Long.class, id))
        .isZero();
  }

  @Test
  void reclaimedExportCannotWriteOrFailTheNewWorkersJob() throws Exception {
    var bytes = new ByteArrayOutputStream();
    javax.imageio.ImageIO.write(
        new java.awt.image.BufferedImage(16, 16, java.awt.image.BufferedImage.TYPE_INT_RGB),
        "png",
        bytes);
    UUID id = UUID.randomUUID();
    media.create(owner, new SocialMedia.Upload(id, "IMAGE", bytes.size()));
    media.part(owner, id, 0, body(bytes.toByteArray()));
    media.export(owner, id, new SocialMedia.Export(null));
    when(storage.open(eq(SocialMedia.key(id) + "part-0"), isNull(), isNull()))
        .thenAnswer(
            i -> {
              // A slow original read returns after another instance has reclaimed the lease.
              db.jdbc.update(
                  "UPDATE social_media SET attempts=attempts+1,"
                      + " lease_until=now()+interval '20 minutes' WHERE id=?",
                  id);
              return new ByteArrayInputStream(bytes.toByteArray());
            });
    media.processOne();
    assertThat(media.status(owner, id)).containsEntry("state", "PROCESSING");
    assertThat(db.one("SELECT attempts FROM social_media WHERE id=?", id).get("attempts"))
        .isEqualTo(2);
    verify(storage, never()).putFile(anyString(), any(Path.class), anyString());
    assertThat(objects.keySet()).containsExactly(SocialMedia.key(id) + "part-0");
  }

  @Test
  void malformedMediaKeepsDraftAndFailureIsReal() throws Exception {
    UUID id = UUID.randomUUID(), post = UUID.randomUUID();
    byte[] bytes = "not a video".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    media.create(owner, new SocialMedia.Upload(id, "VIDEO", bytes.length));
    media.part(owner, id, 0, body(bytes));
    var recipe =
        new VideoRecipe(
            List.of(new VideoRecipe.Segment(0, 1)), 1, .5, .5, 0, 1, true, 0, List.of());
    media.export(owner, id, new SocialMedia.Export(recipe));
    posts.draft(
        owner,
        new SocialPosts.Draft(post, "CLIP", "Rascunho preservado", "PUBLIC", null, 0, List.of(id)));
    media.processOne();
    assertThat(media.status(owner, id)).containsEntry("state", "FAILED");
    assertThat(posts.ownDraft(owner, post)).containsEntry("body", "Rascunho preservado");
    assertThatThrownBy(() -> posts.publish(owner, post, 2)).isInstanceOf(ApiException.class);
  }

  @Test
  void deletingMediaWaitsForPublicationAndKeepsTheCommittedPostIntact() throws Exception {
    var bytes = new ByteArrayOutputStream();
    javax.imageio.ImageIO.write(
        new java.awt.image.BufferedImage(16, 16, java.awt.image.BufferedImage.TYPE_INT_RGB),
        "png",
        bytes);
    UUID id = UUID.randomUUID(), post = UUID.randomUUID();
    media.create(owner, new SocialMedia.Upload(id, "IMAGE", bytes.size()));
    media.part(owner, id, 0, body(bytes.toByteArray()));
    media.export(owner, id, new SocialMedia.Export(null));
    media.processOne();
    assertThat(media.status(owner, id)).containsEntry("state", "READY");
    posts.draft(
        owner,
        new SocialPosts.Draft(
            post, "POST", "Publicação concorrente", "PUBLIC", null, 0, List.of(id)));
    // Commit only synthetic fixtures so the two real database transactions can race.
    org.springframework.test.context.transaction.TestTransaction.flagForCommit();
    org.springframework.test.context.transaction.TestTransaction.end();
    var tx = new org.springframework.transaction.support.TransactionTemplate(transactions);
    var published = new CountDownLatch(1);
    var commit = new CountDownLatch(1);
    var deletionPid = new CompletableFuture<Integer>();
    try (var executor = Executors.newFixedThreadPool(2)) {
      try {
        var publisher =
            executor.submit(
                () ->
                    tx.executeWithoutResult(
                        status -> {
                          posts.publish(owner, post, 2);
                          published.countDown();
                          try {
                            assertThat(commit.await(15, TimeUnit.SECONDS)).isTrue();
                          } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            throw new IllegalStateException(e);
                          }
                        }));
        assertThat(published.await(10, TimeUnit.SECONDS)).isTrue();
        var deletion =
            executor.submit(
                () ->
                    tx.executeWithoutResult(
                        status -> {
                          deletionPid.complete(
                              db.jdbc.queryForObject("SELECT pg_backend_pid()", Integer.class));
                          media.remove(owner, id);
                        }));
        int pid = deletionPid.get(5, TimeUnit.SECONDS);
        org.awaitility.Awaitility.await()
            .atMost(java.time.Duration.ofSeconds(5))
            .until(
                () ->
                    db.exists(
                        "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=? AND"
                            + " wait_event_type='Lock')",
                        pid));
        commit.countDown();
        publisher.get(10, TimeUnit.SECONDS);
        deletion.get(10, TimeUnit.SECONDS);
        assertThat(media.status(owner, id)).containsEntry("state", "READY");
        assertThat(posts.detail(viewer, post)).containsEntry("id", post);
        media.content(
            viewer, id, false, new MockHttpServletRequest(), new MockHttpServletResponse());
      } finally {
        commit.countDown();
      }
    } finally {
      posts.remove(owner, post);
      media.cleanupFiles();
    }
  }

  @Test
  void customCoverRequiresOwnershipReadyVideoAndDraftAndStripsMetadata() throws Exception {
    UUID id=UUID.randomUUID();
    media.create(owner,new SocialMedia.Upload(id,"VIDEO",100));
    db.jdbc.update("UPDATE social_media SET state='READY',output_key=?,thumbnail_key=?,output_bytes=100,thumbnail_bytes=1,mime='video/mp4',duration_ms=1000,width=720,height=1280 WHERE id=?",SocialMedia.key(id)+"video.mp4",SocialMedia.key(id)+"old.jpg",id);
    objects.put(SocialMedia.key(id)+"video.mp4",new byte[100]);objects.put(SocialMedia.key(id)+"old.jpg",new byte[]{0});
    var bytes=new ByteArrayOutputStream();
    javax.imageio.ImageIO.write(new java.awt.image.BufferedImage(40,60,java.awt.image.BufferedImage.TYPE_INT_RGB),"jpeg",bytes);
    assertThatThrownBy(()->media.cover(viewer,id,body(bytes.toByteArray()))).isInstanceOf(ApiException.class);
    media.cover(owner,id,body(bytes.toByteArray()));
    var response=new MockHttpServletResponse();media.content(owner,id,true,new MockHttpServletRequest(),response);
    assertThat(response.getContentType()).isEqualTo("image/jpeg");assertThat(response.getContentAsByteArray().length).isGreaterThan(100);
    assertThat(objects).doesNotContainKey(SocialMedia.key(id)+"old.jpg");
    assertThatThrownBy(()->media.cover(owner,id,body("not a jpeg".getBytes()))).isInstanceOf(ApiException.class);
    UUID post=UUID.randomUUID();var draft=posts.draft(owner,new SocialPosts.Draft(post,"CLIP","Capa escolhida","PUBLIC",null,0,List.of(id)));
    posts.publish(owner,post,((Number)draft.get("version")).intValue());
    assertThatThrownBy(()->media.cover(owner,id,body(bytes.toByteArray()))).isInstanceOf(ApiException.class);
  }
}

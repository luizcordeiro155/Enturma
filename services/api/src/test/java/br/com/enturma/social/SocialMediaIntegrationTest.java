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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.mock.web.*;
import org.springframework.transaction.annotation.Transactional;

/** Real PostgreSQL and FFmpeg; only the paid object-store boundary is replaced. */
@SpringBootTest(properties={"SOCIAL_ENABLED=true","SOCIAL_MEDIA_ENABLED=true"})
@Transactional
class SocialMediaIntegrationTest {
  @Autowired SocialMedia media; @Autowired SocialPosts posts; @Autowired AuthService auth; @Autowired Db db;
  @MockitoBean ObjectStorageService storage;
  @TempDir Path dir;
  final Map<String,byte[]> objects=new ConcurrentHashMap<>();
  Actor owner,viewer;
  Actor user() {String tag=UUID.randomUUID().toString().substring(0,8);return auth.authenticate(auth.register("Criador","media_"+tag,tag+"@example.test","password-12345","JUnit").accessToken()).orElseThrow();}
  @BeforeEach void setup() throws Exception {
    Assumptions.assumeTrue("true".equals(System.getenv("SOCIAL_TEST_FFMPEG")));
    owner=user();viewer=user();
    when(storage.enabled()).thenReturn(true);
    doAnswer(i->{objects.put(i.getArgument(0),i.getArgument(1));return null;}).when(storage).put(anyString(),any(byte[].class),anyString());
    doAnswer(i->{objects.put(i.getArgument(0),Files.readAllBytes(i.getArgument(1,Path.class)));return null;}).when(storage).putFile(anyString(),any(Path.class),anyString());
    when(storage.open(anyString(),nullable(Long.class),nullable(Long.class))).thenAnswer(i->{
      byte[] data=Objects.requireNonNull(objects.get(i.getArgument(0))); Long start=i.getArgument(1),end=i.getArgument(2);
      return new ByteArrayInputStream(Arrays.copyOfRange(data,start==null?0:start.intValue(),end==null?data.length:end.intValue()+1));
    });
    doAnswer(i->{objects.remove(i.getArgument(0));return null;}).when(storage).delete(anyString());
  }
  MockHttpServletRequest body(byte[] bytes) {var req=new MockHttpServletRequest();req.setContent(bytes);return req;}
  @Test void interruptedUploadResumesAndExportsWithPrivateRangesThenDeletes() throws Exception {
    var process=new ProcessBuilder("ffmpeg","-nostdin","-y","-loglevel","error","-f","lavfi","-i","testsrc2=size=320x240:rate=30","-t","3","-c:v","libx264",dir.resolve("source.mp4").toString()).redirectError(ProcessBuilder.Redirect.INHERIT).start();
    assertThat(process.waitFor(30,TimeUnit.SECONDS)).isTrue();assertThat(process.exitValue()).isZero();
    byte[] bytes=Files.readAllBytes(dir.resolve("source.mp4"));UUID id=UUID.randomUUID();
    media.create(owner,new SocialMedia.Upload(id,"VIDEO",bytes.length));
    assertThatThrownBy(()->media.status(viewer,id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(()->media.part(owner,id,1,body(bytes))).isInstanceOf(ApiException.class);
    media.part(owner,id,0,body(bytes));media.part(owner,id,0,body(bytes));
    assertThat(media.status(owner,id)).containsEntry("partCount",1).containsEntry("receivedBytes",(long)bytes.length);
    byte[] changed=bytes.clone();changed[0]^=1;
    assertThatThrownBy(()->media.part(owner,id,0,body(changed))).isInstanceOf(ApiException.class);
    var recipe=new VideoRecipe(List.of(new VideoRecipe.Segment(.5,2.5)),1.2,.5,.5,0,1,true,.5,List.of(new VideoRecipe.Caption("Enturma",0,2,.8)));
    media.export(owner,id,new SocialMedia.Export(recipe));media.export(owner,id,new SocialMedia.Export(recipe));
    media.processOne();assertThat(media.status(owner,id)).containsEntry("state","READY");
    assertThat(((Number)media.status(owner,id).get("durationMs")).longValue()).isBetween(1950L,2050L);
    var req=new MockHttpServletRequest();req.addHeader("Range","bytes=0-99");var response=new MockHttpServletResponse();
    media.content(owner,id,false,req,response);assertThat(response.getStatus()).isEqualTo(206);assertThat(response.getContentAsByteArray()).hasSize(100);assertThat(response.getHeader("Cache-Control")).isEqualTo("private,no-store");
    assertThatThrownBy(()->media.content(viewer,id,false,req,new MockHttpServletResponse())).isInstanceOf(ApiException.class);
    UUID post=UUID.randomUUID();var draft=posts.draft(owner,new SocialPosts.Draft(post,"CLIP","Resultado exportado","PUBLIC",null,0,List.of(id)));
    posts.publish(owner,post,((Number)draft.get("version")).intValue());
    media.content(viewer,id,true,new MockHttpServletRequest(),new MockHttpServletResponse());
    db.jdbc.update("INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)",owner.id(),viewer.id());
    assertThatThrownBy(()->media.content(viewer,id,false,req,new MockHttpServletResponse())).isInstanceOf(ApiException.class);
    posts.remove(owner,post);media.cleanupFiles();assertThat(objects).isEmpty();
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_media WHERE id=?",Long.class,id)).isZero();
  }
  @Test void malformedMediaKeepsDraftAndFailureIsReal() throws Exception {
    UUID id=UUID.randomUUID(),post=UUID.randomUUID();byte[] bytes="not a video".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    media.create(owner,new SocialMedia.Upload(id,"VIDEO",bytes.length));media.part(owner,id,0,body(bytes));
    var recipe=new VideoRecipe(List.of(new VideoRecipe.Segment(0,1)),1,.5,.5,0,1,true,0,List.of());
    media.export(owner,id,new SocialMedia.Export(recipe));
    posts.draft(owner,new SocialPosts.Draft(post,"CLIP","Rascunho preservado","PUBLIC",null,0,List.of(id)));
    media.processOne();assertThat(media.status(owner,id)).containsEntry("state","FAILED");
    assertThat(posts.ownDraft(owner,post)).containsEntry("body","Rascunho preservado");
    assertThatThrownBy(()->posts.publish(owner,post,2)).isInstanceOf(ApiException.class);
  }
}

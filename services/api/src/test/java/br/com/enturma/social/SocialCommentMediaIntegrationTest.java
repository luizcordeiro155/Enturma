package br.com.enturma.social;

import static org.assertj.core.api.Assertions.*;
import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "SOCIAL_ENABLED=true")
@Transactional
class SocialCommentMediaIntegrationTest {
  @Autowired SocialPosts posts;
  @Autowired SocialCommentMedia media;
  @Autowired AuthService auth;
  @Autowired Db db;
  Actor author, viewer;
  Actor user() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    return auth.authenticate(auth.register("Estudante", "cm_" + tag, tag + "@example.test", "password-12345", "JUnit").accessToken()).orElseThrow();
  }
  @BeforeEach void setup() { author=user();viewer=user(); }
  UUID publish() {
    UUID id=UUID.randomUUID();
    var draft=posts.draft(author,new SocialPosts.Draft(id,"POST","Post","PUBLIC",null,0,List.of()));
    posts.publish(author,id,((Number)draft.get("version")).intValue());
    return id;
  }
  MockMultipartFile gif() {
    return new MockMultipartFile("file","sticker.gif","image/gif",Base64.getDecoder().decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"));
  }
  @Test void anAttachmentCanBeUsedOnlyByItsOwnerInItsPostAndCannotBeReused() throws Exception {
    UUID post=publish();UUID attachment=(UUID)media.upload(author,post,gif()).get("id");
    assertThatThrownBy(()->posts.comment(viewer,post,UUID.randomUUID(),"",null,attachment)).isInstanceOf(ApiException.class);
    UUID comment=UUID.randomUUID();posts.comment(author,post,comment,"",null,attachment);
    posts.comment(author,post,comment,"",null,attachment);
    assertThat(media.file(viewer,post,comment).getBody()).isEqualTo(gif().getBytes());
    assertThatThrownBy(()->posts.comment(author,post,UUID.randomUUID(),"",null,attachment)).isInstanceOf(ApiException.class);
    assertThatThrownBy(()->posts.comment(author,publish(),UUID.randomUUID(),"",null,attachment)).isInstanceOf(ApiException.class);
  }
  @Test void attachmentReadsAndLikesRespectBlocksPrivatePostsAndDeletedComments() throws Exception {
    UUID post=publish(),attachment=(UUID)media.upload(author,post,gif()).get("id"),comment=UUID.randomUUID();
    posts.comment(author,post,comment,"Oi",null,attachment);
    media.like(viewer,post,comment,new SocialCommentMedia.Like(true));
    media.like(viewer,post,comment,new SocialCommentMedia.Like(true));
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_comment_like WHERE comment_id=?",Long.class,comment)).isEqualTo(1);
    db.jdbc.update("INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)",author.id(),viewer.id());
    assertThatThrownBy(()->media.file(viewer,post,comment)).isInstanceOf(ApiException.class);
    assertThatThrownBy(()->media.like(viewer,post,comment,new SocialCommentMedia.Like(true))).isInstanceOf(ApiException.class);
    posts.deleteComment(author,post,comment);
    assertThatThrownBy(()->media.file(author,post,comment)).isInstanceOf(ApiException.class);
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_comment_media WHERE id=?",Long.class,attachment)).isZero();
  }
  @Test void rejectsEmptyCommentAndNonImageUploads() {
    UUID post=publish();
    assertThatThrownBy(()->posts.comment(author,post,UUID.randomUUID(),"",null,null)).isInstanceOf(ApiException.class);
    assertThatThrownBy(()->media.upload(author,post,new MockMultipartFile("file","fake.svg","image/gif","<svg/>".getBytes()))).isInstanceOf(ApiException.class);
  }
}

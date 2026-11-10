package br.com.enturma;
import static org.assertj.core.api.Assertions.*;
import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.social.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties="SOCIAL_ENABLED=true")
@Transactional
class SocialIntegrationTest {
  @Autowired Db db; @Autowired AuthService auth; @Autowired SocialPosts posts; @Autowired SocialPeople people; @Autowired SocialAccess access; @Autowired SocialReview review;
  Actor a,b,c;
  Actor user() { String tag=UUID.randomUUID().toString().substring(0,8);return auth.authenticate(auth.register("Social estudante","soc_"+tag,tag+"@example.test","password-12345","JUnit").accessToken()).orElseThrow(); }
  @BeforeEach void setup() { a=user();b=user();c=user(); }
  UUID publish(Actor author,String kind,String body) {
    UUID id=UUID.randomUUID();var draft=posts.draft(author,new SocialPosts.Draft(id,kind,body,"PUBLIC",null,0,List.of()));
    posts.publish(author,id,((Number)draft.get("version")).intValue());return id;
  }
  @Test void draftsArePrivateAndPublishingIsIdempotent() {
    UUID id=UUID.randomUUID();var d=posts.draft(a,new SocialPosts.Draft(id,"POST","#Java @estudante","PUBLIC",null,0,List.of()));
    assertThatThrownBy(()->posts.detail(b,id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(()->posts.ownDraft(b,id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(()->posts.publish(a,id,1)).isInstanceOf(ApiException.class);
    posts.publish(a,id,2);posts.publish(a,id,2);
    assertThat(posts.detail(b,id).get("body")).isEqualTo("#Java @estudante");
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_fanout WHERE post_id=?",Integer.class,id)).isEqualTo(1);
  }
  @Test void privateFollowApprovalRemovalAndBlockingApplyEverywhere() {
    people.preferences(a,true,false,true,List.of("java"),false,List.of("feed","clips","create"));
    UUID id=publish(a,"POST","Meu projeto");people.follow(b,a.id(),true);
    assertThatThrownBy(()->posts.detail(b,id)).isInstanceOf(ApiException.class);
    people.decide(a,b.id(),true);assertThat(posts.detail(b,id).get("id")).isEqualTo(id);
    people.decide(a,b.id(),false);assertThatThrownBy(()->posts.detail(b,id)).isInstanceOf(ApiException.class);
    people.follow(b,a.id(),true);people.decide(a,b.id(),true);
    db.jdbc.update("INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)",a.id(),b.id());
    assertThatThrownBy(()->posts.detail(b,id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(()->people.profile(b,a.id())).isInstanceOf(ApiException.class);
  }
  @Test void storyExpiryIsServerSideAndHighlightsAreExplicit() {
    UUID id=publish(a,"STORY","Estudando");posts.view(b,id,0,false);posts.view(b,id,0,false);
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_story_view WHERE post_id=?",Integer.class,id)).isEqualTo(1);
    db.jdbc.update("UPDATE social_post SET expires_at=now()-interval '1 second' WHERE id=?",id);
    assertThatThrownBy(()->posts.detail(b,id)).isInstanceOf(ApiException.class);
    posts.highlight(a,id,"Aprendizado");assertThat(posts.detail(b,id).get("id")).isEqualTo(id);
    posts.highlight(a,id,null);assertThatThrownBy(()->posts.detail(b,id)).isInstanceOf(ApiException.class);
  }
  @Test void reactionsAndCommentsAreIdempotentAndRecommendationsRequireConsent() {
    UUID id=publish(a,"POST","#programação");posts.react(b,id,"LIKE",true);posts.react(b,id,"LIKE",true);
    assertThat(((Number)posts.detail(b,id).get("likes")).intValue()).isEqualTo(1);
    UUID comment=UUID.randomUUID();posts.comment(b,id,comment,"Muito bom",null);posts.comment(b,id,comment,"Muito bom",null);
    assertThat(((Number)posts.detail(b,id).get("comments")).intValue()).isEqualTo(1);
    posts.view(b,id,5000,false);assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_feedback WHERE user_id=?",Integer.class,b.id())).isZero();
    people.preferences(b,false,true,true,List.of(),false,List.of("clips","feed","create"));posts.view(b,id,5000,false);
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_feedback WHERE user_id=?",Integer.class,b.id())).isEqualTo(1);
    people.preferences(b,false,false,true,List.of(),false,List.of("feed","clips","create"));assertThat(db.jdbc.queryForObject("SELECT count(*) FROM social_feedback WHERE user_id=?",Integer.class,b.id())).isZero();
  }
  @SuppressWarnings("unchecked") @Test void keysetPagesDoNotRepeatAndMuteHidesCandidates() {
    for(int i=0;i<24;i++) publish(a,"POST","BuscaSocialExclusiva "+i);
    var first=(Map<String,Object>)posts.feed(b,"for-you","POST","BuscaSocialExclusiva","",a.id(),"posts");
    var page=(List<Map<String,Object>>)first.get("items");assertThat(page).hasSize(20);
    var second=(Map<String,Object>)posts.feed(b,"for-you","POST","BuscaSocialExclusiva",(String)first.get("nextCursor"),a.id(),"posts");
    assertThat((List<?>)second.get("items")).hasSize(4);
    Set<Object> ids=new HashSet<>();page.forEach(p->ids.add(p.get("id")));((List<Map<String,Object>>)second.get("items")).forEach(p->assertThat(ids.add(p.get("id"))).isTrue());
    people.mute(b,a.id(),true);assertThat((List<?>)((Map<?,?>)posts.feed(b,"for-you","POST","BuscaSocialExclusiva","",a.id(),"posts")).get("items")).isEmpty();
  }
  @Test void verificationRequiresIndependentAdminAndUnprocessedClipCannotPublish() {
    var request=(Map<?,?>)review.request(a,new SocialReview.Reason("Projeto acadêmico e identidade verificáveis"));
    assertThatThrownBy(()->review.decide(b,(UUID)request.get("id"),new SocialReview.Decision("APPROVED","Revisado"))).isInstanceOf(ApiException.class);
    review.decide(new Actor(c.id(),null,"ADMIN"),(UUID)request.get("id"),new SocialReview.Decision("APPROVED","Identidade confirmada manualmente"));
    assertThat(db.one("SELECT verified FROM social_profile WHERE user_id=?",a.id()).get("verified")).isEqualTo(true);
    UUID id=UUID.randomUUID();posts.draft(a,new SocialPosts.Draft(id,"CLIP","Clipe","PUBLIC",null,0,List.of()));
    assertThatThrownBy(()->posts.publish(a,id,2)).isInstanceOf(ApiException.class);
  }
}

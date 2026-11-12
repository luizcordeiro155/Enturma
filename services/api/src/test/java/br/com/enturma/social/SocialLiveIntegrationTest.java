package br.com.enturma.social;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.voice.LiveKitProvider;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
@SpringBootTest(properties={"SOCIAL_ENABLED=true","SOCIAL_LIVE_ENABLED=true"})
@Transactional
@org.springframework.test.annotation.DirtiesContext(classMode=org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class SocialLiveIntegrationTest {
 @Autowired SocialLives lives;@Autowired AuthService auth;@Autowired Db db;
 @MockitoBean LiveKitProvider provider;
 Actor author,viewer;
 Actor user(){String tag=UUID.randomUUID().toString().substring(0,8);return auth.authenticate(auth.register("Live estudante","live_"+tag,tag+"@example.test","password-12345","JUnit").accessToken()).orElseThrow();}
 @BeforeEach void setup(){author=user();viewer=user();when(provider.enabled()).thenReturn(true);when(provider.url()).thenReturn("wss://live.invalid");when(provider.participants(anyString())).thenReturn(List.of());when(provider.liveToken(anyString(),anyString(),anyString(),anyLong(),anyBoolean())).thenAnswer(call->call.getArgument(4,Boolean.class)?"host":"viewer");}
 UUID start(){UUID id=UUID.randomUUID();lives.start(author,new SocialLives.Start(id,"Estudando juntos","PUBLIC"));return id;}
 @Test void onlyConnectedHostAppearsAndSpectatorsNeverReceivePublishPermission(){
   UUID id=start();assertThat(lives.list(viewer)).isEmpty();
   when(provider.participants(lives.room(id))).thenReturn(List.of(author.id().toString()));lives.heartbeat(author,id);
   assertThat(lives.list(viewer)).hasSize(1);assertThat(lives.join(viewer,id)).containsEntry("token","viewer").containsEntry("host",false);
   verify(provider).liveToken(eq(viewer.id().toString()),anyString(),eq(lives.room(id)),anyLong(),eq(false));
   assertThatThrownBy(()->lives.end(viewer,id)).isInstanceOf(ApiException.class);
   lives.end(author,id);assertThat(lives.list(viewer)).isEmpty();verify(provider).deleteRoom(lives.room(id));
 }
 @Test void privateProfilesAndBlocksProtectListingAndCredentials(){
   UUID id=start();when(provider.participants(lives.room(id))).thenReturn(List.of(author.id().toString()));lives.heartbeat(author,id);
   db.jdbc.update("UPDATE social_profile SET private_account=true WHERE user_id=?",author.id());
   assertThat(lives.list(viewer)).isEmpty();assertThatThrownBy(()->lives.join(viewer,id)).isInstanceOf(ApiException.class);
   db.jdbc.update("INSERT INTO social_follow(follower_id,followed_id,status) VALUES (?,?,'ACCEPTED')",viewer.id(),author.id());
   assertThat(lives.list(viewer)).hasSize(1);
   db.jdbc.update("INSERT INTO user_block(user_id,blocked_id) VALUES (?,?)",viewer.id(),author.id());
   assertThat(lives.list(viewer)).isEmpty();assertThatThrownBy(()->lives.join(viewer,id)).isInstanceOf(ApiException.class);
 }
 @Test void disconnectedHostIsEndedAndStartingAnotherLiveIsSerialized(){
   UUID id=start();assertThatThrownBy(()->start()).isInstanceOf(ApiException.class);
   db.jdbc.update("UPDATE social_live SET last_host_seen=now()-interval '70 seconds' WHERE id=?",id);
   lives.reconcile();assertThat(db.one("SELECT state FROM social_live WHERE id=?",id)).containsEntry("state","ENDED");verify(provider).deleteRoom(lives.room(id));
 }
}

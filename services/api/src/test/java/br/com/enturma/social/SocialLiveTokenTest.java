package br.com.enturma.social;
import static org.assertj.core.api.Assertions.*;
import br.com.enturma.voice.LiveKitProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
class SocialLiveTokenTest {
 @Test void viewerCanOnlySubscribeAndSendEphemeralData()throws Exception {
   var environment=new MockEnvironment().withProperty("VOICE_ENABLED","true").withProperty("LIVEKIT_API_KEY","test-key").withProperty("LIVEKIT_API_SECRET","isolated-test-secret-not-a-real-credential").withProperty("LIVEKIT_URL","wss://test.invalid");
   var json=new ObjectMapper();var provider=new LiveKitProvider(environment,json);
   var viewer=json.readTree(Base64.getUrlDecoder().decode(provider.liveToken("viewer","Viewer","room",2000000000L,false).split("\\.")[1])).path("video");
   assertThat(viewer.path("canPublish").asBoolean()).isFalse();assertThat(viewer.path("canSubscribe").asBoolean()).isTrue();assertThat(viewer.path("canPublishData").asBoolean()).isTrue();assertThat(viewer.path("roomAdmin").asBoolean()).isFalse();
   var host=json.readTree(Base64.getUrlDecoder().decode(provider.liveToken("host","Host","room",2000000000L,true).split("\\.")[1])).path("video");assertThat(host.path("canPublish").asBoolean()).isTrue();
 }
}

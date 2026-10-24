package br.com.enturma;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import br.com.enturma.notifications.WebPushNotificationService;
class WebPushEndpointTest {
  @Test void onlyOfficialHttpsPushServicesAreAccepted() {
    for(String endpoint: new String[]{"https://fcm.googleapis.com/fcm/send/opaque","https://updates.push.services.mozilla.com/wpush/v2/opaque","https://web.push.apple.com/Qopaque","https://wns2-bl2p.notify.windows.com/w/?token=opaque"})
      assertThat(WebPushNotificationService.allowedEndpoint(endpoint)).isTrue();
    for(String endpoint: new String[]{"https://127.0.0.1/admin","https://localhost/admin","https://fcm.googleapis.com.evil.test/x","https://fcm.googleapis.com@evil.test/x","https://fcm.googleapis.com:8443/x","http://fcm.googleapis.com/x","https://evil.test/x","https://web.push.apple.com/x#fragment"})
      assertThat(WebPushNotificationService.allowedEndpoint(endpoint)).isFalse();
  }
}

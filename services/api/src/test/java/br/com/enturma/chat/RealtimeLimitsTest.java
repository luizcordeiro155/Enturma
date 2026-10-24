package br.com.enturma.chat;
import br.com.enturma.auth.*;
import br.com.enturma.common.Db;
import br.com.enturma.study.StudyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.socket.*;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

class RealtimeLimitsTest {
  @Test void oneAccountCannotExhaustSocketsAndRevokedQuietSessionsAreClosed() throws Exception {
    var auth=mock(AuthService.class);
    var actor=new Actor(UUID.randomUUID(),UUID.randomUUID(),"STUDENT");
    when(auth.authenticate("test-token")).thenReturn(Optional.of(actor));
    var realtime=new Realtime(auth,mock(Db.class),mock(ChatService.class),mock(StudyService.class),new ObjectMapper(),mock(RealtimePresence.class),"https://app.example");
    WebSocketSession first=null;
    for(int i=0;i<25;i++){
      var socket=mock(WebSocketSession.class);
      when(socket.getId()).thenReturn("socket-"+i);when(socket.isOpen()).thenReturn(true);
      realtime.afterConnectionEstablished(socket);
      realtime.handleTextMessage(socket,new TextMessage("{\"token\":\"test-token\",\"scope\":\"academic\"}"));
      if(i==0) first=socket;
      if(i==24) verify(socket).close(CloseStatus.POLICY_VIOLATION);
      else verify(socket,never()).close(any(CloseStatus.class));
    }
    var connections=(Map<?,?>)ReflectionTestUtils.getField(realtime,"connections");
    assertThat(connections).isNotNull();
    ReflectionTestUtils.setField(connections.get("socket-0"),"lastValidation",0L);
    when(auth.authenticate("test-token")).thenReturn(Optional.empty());
    realtime.publish();
    verify(first).close(CloseStatus.POLICY_VIOLATION);
  }
}

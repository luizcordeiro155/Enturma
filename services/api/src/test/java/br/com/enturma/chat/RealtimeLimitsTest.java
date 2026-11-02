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
  @Test void typingStartStopAndQuickRestartAreImmediateAndStillAuthorizeRecipients() throws Exception {
    var auth = mock(AuthService.class); var db = mock(Db.class); var study = mock(StudyService.class);
    var sender = new Actor(UUID.randomUUID(), UUID.randomUUID(), "STUDENT");
    var viewer = new Actor(UUID.randomUUID(), UUID.randomUUID(), "STUDENT");
    UUID room = UUID.randomUUID();
    when(auth.authenticate("sender")).thenReturn(Optional.of(sender));
    when(auth.authenticate("viewer")).thenReturn(Optional.of(viewer));
    when(auth.studentAccess(any())).thenReturn(true);
    when(db.one(eq("SELECT name FROM app_user WHERE id=?"), any())).thenReturn(Map.of("name", "Ana"));
    var realtime = new Realtime(auth, db, mock(ChatService.class), study, new ObjectMapper(), mock(RealtimePresence.class), "https://app.example");
    var a = mock(WebSocketSession.class); var b = mock(WebSocketSession.class);
    when(a.getId()).thenReturn("a"); when(b.getId()).thenReturn("b");
    when(a.isOpen()).thenReturn(true); when(b.isOpen()).thenReturn(true);
    realtime.afterConnectionEstablished(a); realtime.afterConnectionEstablished(b);
    realtime.handleTextMessage(a, new TextMessage("{\"token\":\"sender\",\"roomId\":\""+room+"\"}"));
    realtime.handleTextMessage(b, new TextMessage("{\"token\":\"viewer\",\"roomId\":\""+room+"\"}"));
    clearInvocations(a,b,study);
    realtime.handleTextMessage(a, new TextMessage("{\"type\":\"typing_started\"}"));
    verify(b).sendMessage(argThat(message -> message.getPayload().toString().contains(sender.id().toString())));
    verify(study).member(viewer,room);
    realtime.handleTextMessage(a, new TextMessage("{\"type\":\"typing_stopped\"}"));
    verify(b).sendMessage(argThat(message -> message.getPayload().toString().contains("\"users\":[]")));
    realtime.handleTextMessage(a, new TextMessage("{\"type\":\"typing_started\"}"));
    verify(b,times(2)).sendMessage(argThat(message -> message.getPayload().toString().contains(sender.id().toString())));
    when(auth.studentAccess(viewer)).thenReturn(false);
    realtime.handleTextMessage(a, new TextMessage("{\"type\":\"typing_stopped\"}"));
    verify(b).close(CloseStatus.POLICY_VIOLATION);
  }
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

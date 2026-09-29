package br.com.enturma.chat;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.study.StudyService;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Compatibility facade for the pre-E2EE REST chat API.
 *
 * <p>Room conversations are now ephemeral and end-to-end encrypted by the Web client. The backend
 * validates membership but intentionally does not persist or expose conversation content.
 */
@Service
public class ChatService {
  private final StudyService study;

  public ChatService(StudyService study) {
    this.study = study;
  }

  public Object messages(Actor actor, UUID room, int page) {
    study.member(actor, room);
    return List.of();
  }

  public Object send(Actor actor, UUID room, String body, UUID reply) {
    study.activeLocked(room);
    study.member(actor, room);
    throw realtimeOnly();
  }

  public void edit(Actor actor, UUID room, UUID id, String body) {
    study.activeLocked(room);
    study.member(actor, room);
    throw realtimeOnly();
  }

  public void delete(Actor actor, UUID room, UUID id) {
    study.member(actor, room);
    throw realtimeOnly();
  }

  public void react(Actor actor, UUID room, UUID id, String emoji) {
    study.activeLocked(room);
    study.member(actor, room);
    throw realtimeOnly();
  }

  public void unreact(Actor actor, UUID room, UUID id, String emoji) {
    study.member(actor, room);
    throw realtimeOnly();
  }

  private ApiException realtimeOnly() {
    return new ApiException(
        410,
        "CHAT_REALTIME_E2EE_ONLY",
        "As mensagens desta sala existem somente no chat criptografado em tempo real.");
  }
}

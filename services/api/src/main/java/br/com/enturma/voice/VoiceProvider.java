package br.com.enturma.voice;

import java.util.*;

public interface VoiceProvider {
  boolean enabled();

  String url();

  String token(String identity, String name, String room, long expires);

  /** Broadcast grants must distinguish the host from read-only spectators. */
  String liveToken(String identity, String name, String room, long expires, boolean host);

  void deleteRoom(String room);

  List<String> participants(String room);

  void remove(String room, String identity);
}

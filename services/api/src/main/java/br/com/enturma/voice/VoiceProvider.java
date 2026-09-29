package br.com.enturma.voice;

import java.util.*;

public interface VoiceProvider {
  boolean enabled();

  String url();

  String token(String identity, String name, String room, long expires);

  void deleteRoom(String room);

  List<String> participants(String room);

  void remove(String room, String identity);
}

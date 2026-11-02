package br.com.enturma.chat;

import br.com.enturma.common.ApiException;
import java.nio.charset.StandardCharsets;

/** Bounded recorder containers; do not accept arbitrary files labelled as audio. */
public final class AudioAttachment {
  private AudioAttachment() {}

  public static void validate(String mime, byte[] bytes) {
    if (bytes.length < 12 || bytes.length > 1433600)
      throw ApiException.invalid("O áudio deve ter no máximo 1,4 MB. Grave até 2 minutos.");
    boolean valid =
        switch (mime) {
          case "audio/webm" ->
              bytes[0] == 0x1a
                  && bytes[1] == 0x45
                  && bytes[2] == (byte) 0xdf
                  && bytes[3] == (byte) 0xa3;
          case "audio/ogg" -> new String(bytes, 0, 4, StandardCharsets.US_ASCII).equals("OggS");
          case "audio/mp4" -> new String(bytes, 4, 4, StandardCharsets.US_ASCII).equals("ftyp");
          default -> false;
        };
    if (!valid) throw ApiException.invalid("Formato de áudio inválido.");
  }
}

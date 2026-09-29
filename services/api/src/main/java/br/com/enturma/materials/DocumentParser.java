package br.com.enturma.materials;

import br.com.enturma.common.ApiException;
import java.nio.*;
import java.nio.charset.*;
import java.util.*;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

@Component
public class DocumentParser {
  public record Chunk(int ordinal, Integer page, String body) {}

  public record Parsed(String mime, List<Chunk> chunks) {}

  public Parsed parse(byte[] bytes, String name) {
    if (bytes.length == 0 || bytes.length > 15 * 1024 * 1024)
      throw ApiException.invalid("Envie um arquivo de até 15 MB.");
    List<Chunk> chunks = new ArrayList<>();
    try {
      if (bytes.length > 5 && new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")) {
        try (var document = Loader.loadPDF(bytes)) {
          if (document.isEncrypted() || document.getNumberOfPages() > 150)
            throw ApiException.invalid("Use PDF sem senha, com até 150 páginas.");
          PDFTextStripper stripper = new PDFTextStripper();
          for (int page = 1; page <= document.getNumberOfPages(); page++) {
            stripper.setStartPage(page);
            stripper.setEndPage(page);
            split(stripper.getText(document), page, chunks);
          }
        }
        return new Parsed("application/pdf", chunks);
      }
      if (!name.toLowerCase(Locale.ROOT).endsWith(".txt"))
        throw ApiException.invalid("Formato não suportado. Envie PDF ou TXT UTF-8.");
      String text =
          StandardCharsets.UTF_8
              .newDecoder()
              .onMalformedInput(CodingErrorAction.REPORT)
              .decode(ByteBuffer.wrap(bytes))
              .toString();
      if (text.indexOf(0) >= 0) throw ApiException.invalid("Arquivo de texto inválido.");
      split(text, null, chunks);
      return new Parsed("text/plain", chunks);
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw ApiException.invalid("Não foi possível extrair o documento. Confira o arquivo.");
    }
  }

  private void split(String text, Integer page, List<Chunk> chunks) {
    String normalized = text.replace("\u0000", "").strip();
    for (int from = 0; from < normalized.length(); from += 1000) {
      if (chunks.size() >= 200)
        throw ApiException.invalid("O documento excede o limite de texto extraído.");
      chunks.add(
          new Chunk(
              chunks.size(),
              page,
              normalized.substring(from, Math.min(normalized.length(), from + 1200))));
    }
  }
}

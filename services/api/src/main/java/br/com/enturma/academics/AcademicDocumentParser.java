package br.com.enturma.academics;

import br.com.enturma.common.ApiException;
import java.util.*;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

@Component
public class AcademicDocumentParser {
  public record Candidate(String name, Integer workloadHours, int page) {}

  public record ParsedCurriculum(
      double confidence,
      List<String> warnings,
      String source,
      String status,
      List<Candidate> candidates,
      String excerpt) {}

  public ParsedCurriculum parse(byte[] bytes, String source) {
    if (bytes.length > 8 * 1024 * 1024
        || bytes.length < 5
        || !new String(bytes, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-"))
      throw new ApiException(400, "ACADEMIC_PARSE_FAILED", "Envie um PDF real de até 8 MB.");
    try (var document = Loader.loadPDF(bytes)) {
      if (document.isEncrypted() || document.getNumberOfPages() > 150)
        throw ApiException.invalid("Use PDF sem senha com até 150 páginas.");
      var stripper = new PDFTextStripper();
      stripper.setSortByPosition(true);
      var candidates = new ArrayList<Candidate>();
      var excerpt = new StringBuilder();
      var pattern =
          Pattern.compile(
              "^([\\p{L}][\\p{L}0-9 ()/.,:–—-]{4,180}?)\\s+(\\d{1,4})\\s*(?:h|horas)?$",
              Pattern.CASE_INSENSITIVE);
      for (int page = 1; page <= document.getNumberOfPages(); page++) {
        stripper.setStartPage(page);
        stripper.setEndPage(page);
        String text = stripper.getText(document);
        if (excerpt.length() + text.length() > 200000)
          throw ApiException.invalid("Documento excede o limite de texto extraído.");
        excerpt.append(text);
        for (String line : text.split("\\R")) {
          var match = pattern.matcher(line.strip());
          if (match.matches()) {
            int hours = Integer.parseInt(match.group(2));
            if (hours > 0 && hours < 2000)
              candidates.add(new Candidate(match.group(1), hours, page));
          }
        }
      }
      return new ParsedCurriculum(
          candidates.isEmpty() ? 0.0 : 0.5,
          List.of(
              "Extração não equivale a verificação. Confira instituição, campus, modalidade,"
                  + " versão, períodos e pré-requisitos na fonte.",
              "O parser não distribui disciplinas em semestres nem publica automaticamente."),
          source,
          "PENDING_VERIFICATION",
          candidates,
          excerpt.substring(0, Math.min(excerpt.length(), 24000)));
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw new ApiException(400, "ACADEMIC_PARSE_FAILED", "Não foi possível interpretar o PDF.");
    }
  }
}

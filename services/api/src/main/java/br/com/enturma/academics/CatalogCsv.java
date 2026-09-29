package br.com.enturma.academics;

import br.com.enturma.common.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

/** RFC 4180 parsing, including quoted commas, escaped quotes and multiline fields. */
public final class CatalogCsv {
  private CatalogCsv() {}

  public static CatalogRecord.Document parse(String provider, String csv, ObjectMapper json) {
    if (csv.length() > 3_500_000)
      throw ApiException.invalid("Divida o CSV em arquivos de até 3,5 MB.");
    List<List<String>> rows = new ArrayList<>();
    List<String> row = new ArrayList<>();
    StringBuilder field = new StringBuilder();
    boolean quoted = false, closed = false;
    csv = csv.replaceFirst("^\uFEFF", "");
    for (int i = 0; i < csv.length(); i++) {
      char c = csv.charAt(i);
      if (quoted) {
        if (c == '"') {
          if (i + 1 < csv.length() && csv.charAt(i + 1) == '"') {
            field.append('"');
            i++;
          } else {
            quoted = false;
            closed = true;
          }
        } else field.append(c);
      } else if (c == '"') {
        if (field.length() != 0 || closed) throw ApiException.invalid("Aspas inválidas no CSV.");
        quoted = true;
      } else if (c == ',' || c == '\n' || c == '\r') {
        row.add(field.toString());
        field.setLength(0);
        closed = false;
        if (c != ',') {
          if (c == '\r' && i + 1 < csv.length() && csv.charAt(i + 1) == '\n') i++;
          if (row.size() > 1 || !row.getFirst().isBlank()) rows.add(row);
          row = new ArrayList<>();
        }
      } else {
        if (closed) throw ApiException.invalid("Texto após aspas de fechamento no CSV.");
        field.append(c);
      }
    }
    if (quoted) throw ApiException.invalid("Aspas sem fechamento no CSV.");
    if (field.length() > 0 || !row.isEmpty()) {
      row.add(field.toString());
      rows.add(row);
    }
    if (rows.size() < 2 || rows.size() > 10001)
      throw ApiException.invalid("O CSV deve conter cabeçalho e de 1 a 10.000 registros.");
    var headers = rows.removeFirst();
    if (new HashSet<>(headers).size() != headers.size())
      throw ApiException.invalid("Colunas repetidas.");
    var allowed =
        Set.of(
            "externalId",
            "kind",
            "parentExternalId",
            "name",
            "code",
            "curriculumVersion",
            "periodNumber",
            "status",
            "sourceUrl",
            "sourceName",
            "sourceType",
            "sourceContentHash",
            "retrievedAt",
            "verifiedAt",
            "attributes");
    if (!allowed.containsAll(headers)) throw ApiException.invalid("Coluna desconhecida no CSV.");
    var entries = new ArrayList<CatalogRecord>();
    try {
      for (var values : rows) {
        if (values.size() != headers.size())
          throw ApiException.invalid("Quantidade de colunas inconsistente.");
        var node = json.createObjectNode();
        var source = node.putObject("source");
        for (int i = 0; i < headers.size(); i++) {
          String key = headers.get(i), value = values.get(i);
          if (value.isBlank()) continue;
          switch (key) {
            case "sourceUrl" -> source.put("url", value);
            case "sourceName" -> source.put("name", value);
            case "sourceType" -> source.put("type", value);
            case "sourceContentHash" -> source.put("contentHash", value);
            case "retrievedAt", "verifiedAt" -> source.put(key, value);
            case "periodNumber" -> node.put(key, Integer.parseInt(value));
            case "attributes" -> node.set(key, json.readTree(value));
            default -> node.put(key, value);
          }
        }
        entries.add(json.treeToValue(node, CatalogRecord.class));
      }
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw ApiException.invalid("Confira números, datas ISO-8601 e metadados JSON do CSV.");
    }
    return new CatalogRecord.Document(provider, entries);
  }
}

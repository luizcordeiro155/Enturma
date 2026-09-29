package br.com.enturma.ai;

import br.com.enturma.common.ApiException;
import br.com.enturma.materials.DocumentParser;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipInputStream;
import javax.swing.text.html.*;
import javax.swing.text.html.parser.ParserDelegator;
import javax.xml.stream.*;
import org.apache.hc.client5.http.SystemDefaultDnsResolver;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.util.Timeout;
import org.springframework.stereotype.Component;

@Component
public class NotebookSources {
  private final DocumentParser parser;

  public NotebookSources(DocumentParser parser) {
    this.parser = parser;
  }

  public static URI validateUrl(String url) {
    try {
      URI uri = URI.create(url);
      if (!"https".equalsIgnoreCase(uri.getScheme())
          || uri.getHost() == null
          || uri.getUserInfo() != null
          || (uri.getPort() != -1 && uri.getPort() != 443)) throw new IllegalArgumentException();
      return uri;
    } catch (Exception e) {
      throw ApiException.invalid("Use um link HTTPS público, sem senha e sem porta personalizada.");
    }
  }

  public static boolean publicAddress(InetAddress address) {
    byte[] b = address.getAddress();
    if (address.isAnyLocalAddress()
        || address.isLoopbackAddress()
        || address.isLinkLocalAddress()
        || address.isSiteLocalAddress()
        || address.isMulticastAddress()) return false;
    if (b.length == 16)
      return (b[0] & 0xe0) == 0x20
          && !(b[0] == 0x20 && b[1] == 0x02)
          && !(b[0] == 0x20 && b[1] == 1 && b[2] == 0);
    int a = b[0] & 255, c = b[1] & 255;
    return a > 0
        && a < 224
        && a != 127
        && a != 10
        && !(a == 100 && c >= 64 && c <= 127)
        && !(a == 169 && c == 254)
        && !(a == 172 && c >= 16 && c <= 31)
        && !(a == 192 && (c == 168 || c == 0))
        && !(a == 198 && (c == 18 || c == 19));
  }

  public String link(String url) {
    URI uri = validateUrl(url);
    var resolver =
        new SystemDefaultDnsResolver() {
          @Override
          public InetAddress[] resolve(String host) throws UnknownHostException {
            var addresses = super.resolve(host);
            for (var address : addresses)
              if (!publicAddress(address))
                throw new UnknownHostException("Endereço privado não permitido");
            return addresses;
          }
        };
    try (var manager =
            PoolingHttpClientConnectionManagerBuilder.create().setDnsResolver(resolver).build();
        var client =
            HttpClients.custom()
                .setConnectionManager(manager)
                .disableRedirectHandling()
                .disableAutomaticRetries()
                .setDefaultRequestConfig(
                    RequestConfig.custom()
                        .setConnectTimeout(Timeout.ofSeconds(5))
                        .setResponseTimeout(Timeout.ofSeconds(8))
                        .build())
                .build()) {
      for (int redirects = 0; redirects < 4; redirects++) {
        for (var address : InetAddress.getAllByName(uri.getHost()))
          if (!publicAddress(address))
            throw ApiException.invalid("Endereço privado não permitido.");
        var request = new HttpGet(uri);
        java.util.concurrent.CompletableFuture.delayedExecutor(
                20, java.util.concurrent.TimeUnit.SECONDS)
            .execute(request::cancel);
        request.setHeader("User-Agent", "EnturmaStudy/1.0");
        request.setHeader("Accept", "text/html,text/plain,application/pdf");
        final URI current = uri;
        var result =
            client.execute(
                request,
                response -> {
                  if (response.getCode() >= 300 && response.getCode() < 400)
                    return new Object[] {
                      validateUrl(
                          current
                              .resolve(response.getFirstHeader("Location").getValue())
                              .toString()),
                      null
                    };
                  if (response.getCode() != 200)
                    throw ApiException.invalid(
                        "Não foi possível ler o link. Envie o documento ou cole o texto da"
                            + " página.");
                  var entity = response.getEntity();
                  if (entity == null || entity.getContentLength() > 3 * 1024 * 1024)
                    throw ApiException.invalid("O link excede 3 MB.");
                  byte[] bytes;
                  try (var stream = entity.getContent()) {
                    bytes = stream.readNBytes(3 * 1024 * 1024 + 1);
                  }
                  if (bytes.length > 3 * 1024 * 1024)
                    throw ApiException.invalid("O link excede 3 MB.");
                  String mime = Optional.ofNullable(entity.getContentType()).orElse("");
                  if (mime.contains("pdf"))
                    return new Object[] {null, document(bytes, "fonte.pdf")};
                  if (!mime.contains("text/html") && !mime.contains("text/plain"))
                    throw ApiException.invalid(
                        "O link precisa conter uma página, PDF ou texto público.");
                  String text = new String(bytes, StandardCharsets.UTF_8);
                  if (mime.contains("html")) text = html(text);
                  return new Object[] {null, checked(text)};
                });
        if (result[0] == null) return (String) result[1];
        uri = (URI) result[0];
      }
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw ApiException.invalid(
          "Não foi possível ler este link público. Baixe o material e envie o arquivo ou cole o"
              + " conteúdo.");
    }
    throw ApiException.invalid("O link redireciona muitas vezes.");
  }

  private static String html(String html) throws IOException {
    var out = new StringBuilder();
    new ParserDelegator()
        .parse(
            new StringReader(html),
            new HTMLEditorKit.ParserCallback() {
              int hidden = 0;

              public void handleStartTag(
                  HTML.Tag t, javax.swing.text.MutableAttributeSet a, int pos) {
                if (t == HTML.Tag.SCRIPT || t == HTML.Tag.STYLE) hidden++;
              }

              public void handleEndTag(HTML.Tag t, int pos) {
                if (t == HTML.Tag.SCRIPT || t == HTML.Tag.STYLE) hidden = Math.max(0, hidden - 1);
                out.append('\n');
              }

              public void handleText(char[] chars, int pos) {
                if (hidden == 0 && out.length() < 100000) out.append(chars).append(' ');
              }
            },
            true);
    return out.toString();
  }

  public String document(byte[] bytes, String name) {
    if (name.toLowerCase(Locale.ROOT).endsWith(".docx")) {
      try (var zip = new ZipInputStream(new ByteArrayInputStream(bytes))) {
        int expanded = 0;
        for (int i = 0; i < 300; i++) {
          var entry = zip.getNextEntry();
          if (entry == null) break;
          var xml = zip.readNBytes(4000001);
          expanded += xml.length;
          if (expanded > 8000000 || xml.length > 4000000)
            throw ApiException.invalid("DOCX excede o limite de extração.");
          if (!entry.getName().equals("word/document.xml")) continue;
          if (xml.length > 1000000) throw ApiException.invalid("DOCX muito extenso.");
          var factory = XMLInputFactory.newFactory();
          factory.setProperty(XMLInputFactory.SUPPORT_DTD, false);
          factory.setProperty("javax.xml.stream.isSupportingExternalEntities", false);
          var reader = factory.createXMLStreamReader(new ByteArrayInputStream(xml));
          var out = new StringBuilder();
          while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.CHARACTERS) out.append(reader.getText());
            if (event == XMLStreamConstants.END_ELEMENT && reader.getLocalName().equals("p"))
              out.append('\n');
          }
          reader.close();
          return checked(out.toString());
        }
      } catch (ApiException e) {
        throw e;
      } catch (Exception e) {
        throw ApiException.invalid("DOCX inválido. Envie PDF ou TXT.");
      }
      throw ApiException.invalid("Este arquivo não contém um documento DOCX.");
    }
    var parsed =
        parser.parse(bytes, name.toLowerCase(Locale.ROOT).endsWith(".md") ? "notas.txt" : name);
    var out = new StringBuilder();
    for (var chunk : parsed.chunks())
      out.append(chunk.page() == null ? "" : "\nPágina " + chunk.page() + "\n")
          .append(chunk.body())
          .append('\n');
    return checked(out.toString());
  }

  public static String checked(String text) {
    text = text.replace("\u0000", "").strip();
    if (text.length() < 20)
      throw ApiException.invalid(
          "Não há texto suficiente. Para PDF digitalizado, envie as páginas como imagens.");
    if (text.length() > 100000)
      throw ApiException.invalid("A fonte excede 100 mil caracteres. Divida o material em partes.");
    return text;
  }

  public static String imageMime(byte[] b) {
    if (b.length > 8 && b[0] == (byte) 137 && b[1] == 80 && b[2] == 78 && b[3] == 71)
      return "image/png";
    if (b.length > 3 && b[0] == (byte) 255 && b[1] == (byte) 216 && b[2] == (byte) 255)
      return "image/jpeg";
    if (b.length > 12
        && new String(b, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
        && new String(b, 8, 4, StandardCharsets.US_ASCII).equals("WEBP")) return "image/webp";
    return null;
  }
}

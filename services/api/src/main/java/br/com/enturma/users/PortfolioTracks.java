package br.com.enturma.users;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * The area a portfolio is shaped for. It follows the name of the course the student is enrolled in,
 * until the student chooses another one.
 */
public final class PortfolioTracks {
  private PortfolioTracks() {}

  public static final String GENERAL = "GENERAL";

  private static final Set<String> KNOWN =
      Set.of(
          "TECH",
          "HEALTH",
          "LAW",
          "BUSINESS",
          "ENGINEERING",
          "DESIGN",
          "COMMUNICATION",
          "EDUCATION",
          "SCIENCE",
          GENERAL);

  private record Rule(String track, List<String> words) {}

  /**
   * Read in order, the first match wins: "Engenharia de Computação" is computing before it is
   * engineering, "Educação Física" is health before it is physics.
   */
  private static final List<Rule> RULES =
      List.of(
          new Rule(
              "TECH",
              List.of(
                  "analise e desenvolvimento de sistemas",
                  "sistemas de informacao",
                  "sistemas para internet",
                  "ciencia da computacao",
                  "ciencias da computacao",
                  "engenharia de software",
                  "engenharia de computacao",
                  "engenharia da computacao",
                  "jogos digitais",
                  "banco de dados",
                  "ciencia de dados",
                  "inteligencia artificial",
                  "redes de computadores",
                  "seguranca da informacao",
                  "defesa cibernetica",
                  "tecnologia da informacao",
                  "desenvolvimento de software",
                  "desenvolvimento de sistemas",
                  "computacao")),
          new Rule(
              "HEALTH",
              List.of(
                  "medicina",
                  "enfermagem",
                  "fisioterapia",
                  "nutricao",
                  "farmacia",
                  "biomedicina",
                  "odontologia",
                  "psicologia",
                  "fonoaudiologia",
                  "educacao fisica",
                  "estetica",
                  "terapia ocupacional",
                  "radiologia",
                  "saude")),
          new Rule("LAW", List.of("direito", "servicos juridicos")),
          new Rule(
              "DESIGN",
              List.of(
                  "design",
                  "arquitetura",
                  "artes",
                  "animacao",
                  "moda",
                  "musica",
                  "danca",
                  "teatro",
                  "fotografia",
                  "restauracao")),
          new Rule(
              "COMMUNICATION",
              List.of(
                  "jornalismo",
                  "publicidade",
                  "comunicacao",
                  "relacoes publicas",
                  "audiovisual",
                  "cinema",
                  "radio")),
          new Rule("ENGINEERING", List.of("engenharia", "manutencao de aeronaves")),
          new Rule(
              "BUSINESS",
              List.of(
                  "administracao",
                  "contabeis",
                  "contabilidade",
                  "economicas",
                  "economia",
                  "atuariais",
                  "gestao",
                  "marketing",
                  "logistica",
                  "comercio exterior",
                  "recursos humanos",
                  "financas",
                  "controladoria",
                  "processos gerenciais",
                  "secretariado",
                  "turismo",
                  "hotelaria")),
          new Rule(
              "SCIENCE",
              List.of(
                  "biologicas",
                  "biologia",
                  "biotecnologia",
                  "quimica",
                  "fisica",
                  "matematica",
                  "estatistica",
                  "geologia",
                  "agronomia",
                  "zootecnia",
                  "aquacultura",
                  "oceanografia",
                  "ciencias da natureza",
                  "ciencias socioambientais")),
          new Rule(
              "EDUCATION",
              List.of(
                  "pedagogia",
                  "licenciatura",
                  "letras",
                  "historia",
                  "geografia",
                  "filosofia",
                  "ciencias sociais",
                  "sociologia",
                  "antropologia",
                  "arqueologia",
                  "servico social",
                  "relacoes internacionais",
                  "teologia",
                  "biblioteconomia",
                  "arquivologia",
                  "museologia",
                  "ciencias do estado",
                  "educacao")));

  public static boolean known(String track) {
    return track != null && KNOWN.contains(track);
  }

  /** The area for a course name, or the general one when the name says nothing. */
  public static String of(String course) {
    if (course == null || course.isBlank()) return GENERAL;
    String name =
        Normalizer.normalize(course, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT);
    for (Rule rule : RULES) for (String word : rule.words()) if (name.contains(word)) return rule.track();
    return GENERAL;
  }
}

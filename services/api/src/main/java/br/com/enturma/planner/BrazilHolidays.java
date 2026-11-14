package br.com.enturma.planner;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.function.Function;

/**
 * Brazilian national holidays (computed, including the Easter-based ones) and the state holidays
 * of the 27 federative units. City holidays are added by each student.
 *
 * <p>State list reviewed on 2026-11-14 against state laws and 2026 public calendars. Only dates
 * that apply to everyone in the state are listed: holidays limited to public servants or a single
 * trade are left out, and Paraná has none since State Law 18.384/2014. Review every year.
 */
public final class BrazilHolidays {
  public record Holiday(LocalDate date, String name, String scope) {}

  private record Rule(String name, Function<Integer, LocalDate> date) {}

  private static Rule fixed(int month, int day, String name) {
    var md = MonthDay.of(month, day);
    return new Rule(name, md::atYear);
  }

  private static Rule easter(int offset, String name) {
    return new Rule(name, year -> easterSunday(year).plusDays(offset));
  }

  private static final List<Rule> NATIONAL =
      List.of(
          fixed(1, 1, "Confraternização Universal"),
          easter(-2, "Sexta-feira Santa"),
          fixed(4, 21, "Tiradentes"),
          fixed(5, 1, "Dia do Trabalho"),
          fixed(9, 7, "Independência do Brasil"),
          fixed(10, 12, "Nossa Senhora Aparecida"),
          fixed(11, 2, "Finados"),
          fixed(11, 15, "Proclamação da República"),
          fixed(11, 20, "Dia Nacional de Zumbi e da Consciência Negra"),
          fixed(12, 25, "Natal"));

  private static final List<Rule> OPTIONAL =
      List.of(
          easter(-48, "Carnaval"),
          easter(-47, "Carnaval"),
          easter(-46, "Quarta-feira de Cinzas"),
          easter(60, "Corpus Christi"));

  private static final Map<String, List<Rule>> STATE = new HashMap<>();

  static {
    STATE.put(
        "AC",
        List.of(
            fixed(1, 20, "Dia do Católico"),
            fixed(1, 23, "Dia do Evangélico"),
            fixed(3, 8, "Dia Internacional da Mulher"),
            fixed(6, 15, "Aniversário do Acre"),
            fixed(9, 5, "Dia da Amazônia"),
            fixed(11, 17, "Tratado de Petrópolis")));
    STATE.put(
        "AL",
        List.of(
            fixed(6, 24, "Dia de São João"),
            fixed(6, 29, "Dia de São Pedro"),
            fixed(9, 16, "Emancipação Política de Alagoas"),
            fixed(11, 30, "Dia do Evangélico")));
    STATE.put(
        "AP",
        List.of(
            fixed(3, 19, "Dia de São José"),
            fixed(9, 13, "Criação do Território Federal do Amapá")));
    STATE.put(
        "AM",
        List.of(
            fixed(9, 5, "Elevação do Amazonas à categoria de província"),
            fixed(12, 8, "Nossa Senhora da Conceição")));
    STATE.put("BA", List.of(fixed(7, 2, "Independência da Bahia")));
    STATE.put(
        "CE", List.of(fixed(3, 19, "Dia de São José"), fixed(3, 25, "Data Magna do Ceará")));
    STATE.put(
        "DF", List.of(fixed(4, 21, "Fundação de Brasília"), fixed(11, 30, "Dia do Evangélico")));
    STATE.put("ES", List.of(easter(8, "Nossa Senhora da Penha")));
    STATE.put("MA", List.of(fixed(7, 28, "Adesão do Maranhão à Independência")));
    STATE.put("MS", List.of(fixed(10, 11, "Criação do Estado de Mato Grosso do Sul")));
    STATE.put("MG", List.of(fixed(4, 21, "Data Magna de Minas Gerais")));
    STATE.put("PA", List.of(fixed(8, 15, "Adesão do Grão-Pará à Independência")));
    STATE.put("PB", List.of(fixed(8, 5, "Fundação do Estado da Paraíba")));
    STATE.put("PE", List.of(fixed(3, 6, "Data Magna de Pernambuco")));
    STATE.put("PI", List.of(fixed(10, 19, "Dia do Piauí")));
    STATE.put("RJ", List.of(fixed(4, 23, "Dia de São Jorge"), easter(-47, "Carnaval")));
    STATE.put("RN", List.of(fixed(10, 3, "Mártires de Cunhaú e Uruaçu")));
    STATE.put("RS", List.of(fixed(9, 20, "Revolução Farroupilha")));
    STATE.put("RO", List.of(fixed(1, 4, "Criação do Estado de Rondônia")));
    STATE.put("RR", List.of(fixed(10, 5, "Criação do Estado de Roraima")));
    // State Law 18.531/2022: on a weekday the holiday moves to the following Sunday.
    STATE.put(
        "SC",
        List.of(
            new Rule(
                "Dia do Estado de Santa Catarina",
                year ->
                    LocalDate.of(year, 8, 11)
                        .with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)))));
    STATE.put("SP", List.of(fixed(7, 9, "Revolução Constitucionalista")));
    STATE.put("SE", List.of(fixed(7, 8, "Emancipação Política de Sergipe")));
    STATE.put(
        "TO",
        List.of(
            fixed(9, 8, "Nossa Senhora da Natividade"),
            fixed(10, 5, "Criação do Estado do Tocantins")));
  }

  private BrazilHolidays() {}

  /** Holidays between {@code from} and {@code to} (inclusive), sorted by date. */
  public static List<Holiday> between(LocalDate from, LocalDate to, String state) {
    var stateRules =
        state == null ? List.<Rule>of() : STATE.getOrDefault(state.toUpperCase(Locale.ROOT), List.of());
    var result = new ArrayList<Holiday>();
    for (int y = from.getYear(); y <= to.getYear(); y++) {
      final int year = y;
      add(result, NATIONAL, year, "NATIONAL", from, to);
      add(result, stateRules, year, "STATE", from, to);
      for (var rule : OPTIONAL) {
        var date = rule.date().apply(year);
        boolean promoted =
            stateRules.stream()
                .anyMatch(s -> s.name().equals(rule.name()) && s.date().apply(year).equals(date));
        if (!promoted && !date.isBefore(from) && !date.isAfter(to))
          result.add(new Holiday(date, rule.name(), "OPTIONAL"));
      }
    }
    result.sort(Comparator.comparing(Holiday::date));
    return result;
  }

  private static void add(
      List<Holiday> out, List<Rule> rules, int year, String scope, LocalDate from, LocalDate to) {
    for (var rule : rules) {
      var date = rule.date().apply(year);
      if (!date.isBefore(from) && !date.isAfter(to)) out.add(new Holiday(date, rule.name(), scope));
    }
  }

  /** Anonymous Gregorian algorithm (Meeus/Jones/Butcher). */
  static LocalDate easterSunday(int year) {
    int a = year % 19, b = year / 100, c = year % 100, d = b / 4, e = b % 4;
    int f = (b + 8) / 25, g = (b - f + 1) / 3, h = (19 * a + b - d - g + 15) % 30;
    int i = c / 4, k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    int m = (a + 11 * h + 22 * l) / 451;
    int month = (h + l - 7 * m + 114) / 31, day = ((h + l - 7 * m + 114) % 31) + 1;
    return LocalDate.of(year, month, day);
  }
}

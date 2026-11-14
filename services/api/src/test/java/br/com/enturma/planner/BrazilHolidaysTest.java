package br.com.enturma.planner;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.planner.BrazilHolidays.Holiday;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class BrazilHolidaysTest {
  static LocalDate d(String iso) {
    return LocalDate.parse(iso);
  }

  @Test
  void easterBasedDates2026() {
    var year = BrazilHolidays.between(d("2026-01-01"), d("2026-12-31"), null);
    assertThat(year)
        .contains(
            new Holiday(d("2026-04-03"), "Sexta-feira Santa", "NATIONAL"),
            new Holiday(d("2026-02-16"), "Carnaval", "OPTIONAL"),
            new Holiday(d("2026-02-17"), "Carnaval", "OPTIONAL"),
            new Holiday(d("2026-06-04"), "Corpus Christi", "OPTIONAL"));
  }

  @Test
  void fixedNational2026() {
    var year = BrazilHolidays.between(d("2026-01-01"), d("2026-12-31"), null);
    assertThat(year)
        .filteredOn(h -> h.scope().equals("NATIONAL"))
        .extracting(Holiday::date)
        .contains(
            d("2026-01-01"),
            d("2026-04-21"),
            d("2026-05-01"),
            d("2026-09-07"),
            d("2026-10-12"),
            d("2026-11-02"),
            d("2026-11-15"),
            d("2026-11-20"),
            d("2026-12-25"));
  }

  @Test
  void stateHolidaysOnlyForThatState() {
    assertThat(BrazilHolidays.between(d("2026-07-01"), d("2026-07-31"), "SP"))
        .contains(new Holiday(d("2026-07-09"), "Revolução Constitucionalista", "STATE"));
    assertThat(BrazilHolidays.between(d("2026-07-01"), d("2026-07-31"), "MG"))
        .extracting(Holiday::name)
        .doesNotContain("Revolução Constitucionalista");
    // Rio de Janeiro makes Carnival Tuesday a state holiday instead of an optional day.
    assertThat(BrazilHolidays.between(d("2026-02-17"), d("2026-02-17"), "rj"))
        .contains(new Holiday(d("2026-02-17"), "Carnaval", "STATE"))
        .doesNotContain(new Holiday(d("2026-02-17"), "Carnaval", "OPTIONAL"));
  }

  @Test
  void movableStateRules() {
    // Espírito Santo: Nossa Senhora da Penha, eight days after Easter (Easter 2026 = 5 April).
    assertThat(BrazilHolidays.between(d("2026-04-13"), d("2026-04-13"), "ES"))
        .contains(new Holiday(d("2026-04-13"), "Nossa Senhora da Penha", "STATE"));
    // Santa Catarina: 11 August moves to the following Sunday (11/08/2026 is a Tuesday).
    assertThat(BrazilHolidays.between(d("2026-08-01"), d("2026-08-31"), "SC"))
        .contains(new Holiday(d("2026-08-16"), "Dia do Estado de Santa Catarina", "STATE"));
  }

  @Test
  void nullOrUnknownStateIsNationalOnly() {
    var none = BrazilHolidays.between(d("2026-01-01"), d("2026-12-31"), null);
    assertThat(none).noneMatch(h -> h.scope().equals("STATE"));
    assertThat(BrazilHolidays.between(d("2026-01-01"), d("2026-12-31"), "XX")).isEqualTo(none);
    assertThat(none).isSortedAccordingTo(java.util.Comparator.comparing(Holiday::date));
  }
}

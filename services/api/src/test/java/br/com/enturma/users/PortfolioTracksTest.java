package br.com.enturma.users;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class PortfolioTracksTest {
  @ParameterizedTest
  @CsvSource({
    "Análise e Desenvolvimento de Sistemas, TECH",
    "Ciência Da Computação, TECH",
    "Engenharia de Software, TECH",
    "Engenharia de Computação, TECH",
    "Jogos Digitais, TECH",
    "Gestão da Tecnologia da Informação, TECH",
    "Ciência de Dados e Inteligência Artificial, TECH",
    "Sistemas de Informação, TECH",
    "Enfermagem, HEALTH",
    "Medicina Veterinária, HEALTH",
    "Educação Física - Licenciatura, HEALTH",
    "Psicologia, HEALTH",
    "Direito, LAW",
    "Administração, BUSINESS",
    "Ciências Contábeis, BUSINESS",
    "Gestão de Recursos Humanos, BUSINESS",
    "Marketing, BUSINESS",
    "Engenharia Civil, ENGINEERING",
    "Engenharia De Controle E Automação, ENGINEERING",
    "Arquitetura e Urbanismo, DESIGN",
    "Design De Moda, DESIGN",
    "Cinema de Animação e Artes Digitais, DESIGN",
    "Jornalismo, COMMUNICATION",
    "Comunicação Social - Publicidade E Propaganda, COMMUNICATION",
    "Cinema e Audiovisual, COMMUNICATION",
    "Pedagogia, EDUCATION",
    "Letras - Licenciatura em Português, EDUCATION",
    "Ciências Sociais - Bacharelado, EDUCATION",
    "História, EDUCATION",
    "Ciências Biológicas - Licenciatura, SCIENCE",
    "Física, SCIENCE",
    "Matemática Computacional, SCIENCE",
    "Agronomia, SCIENCE",
    "TESTE SINTÉTICO — COURSE, GENERAL",
  })
  void theAreaComesFromTheCourseName(String course, String track) {
    assertThat(PortfolioTracks.of(course)).isEqualTo(track);
  }

  @Test
  void aStudentWithoutACourseGetsTheGeneralPortfolio() {
    assertThat(PortfolioTracks.of(null)).isEqualTo("GENERAL");
    assertThat(PortfolioTracks.of("  ")).isEqualTo("GENERAL");
  }

  @Test
  void onlyKnownAreasCanBeChosen() {
    assertThat(PortfolioTracks.known("HEALTH")).isTrue();
    assertThat(PortfolioTracks.known("TECH")).isTrue();
    assertThat(PortfolioTracks.known("health")).isFalse();
    assertThat(PortfolioTracks.known("AUTO")).isFalse();
    assertThat(PortfolioTracks.known(null)).isFalse();
  }
}

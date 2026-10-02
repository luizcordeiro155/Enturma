package br.com.enturma.learning;

import br.com.enturma.common.ApiException;
import java.util.*;

/** Pure, versionable teaching templates. Answers stay on the server. */
final class ChallengeTemplates {
  private ChallengeTemplates() {}

  static boolean matches(String actual, String expected) {
    String left = AcademicGames.normalize(actual), right = AcademicGames.normalize(expected);
    if (left.equals(right)) return true;
    if (left.matches("-?\\d+(\\.\\d+)?") && right.matches("-?\\d+(\\.\\d+)?"))
      return new java.math.BigDecimal(left).compareTo(new java.math.BigDecimal(right)) == 0;
    return false;
  }

  static Map<String, String> generate(String template, int level, Random r) {
    int a = 2 + r.nextInt(8 * level), b = 2 + r.nextInt(6 * level);
    String prompt,
        answer,
        hint,
        explanation,
        context = "Desafio acadêmico de raciocínio. Digite sua resposta; a dica explica o método.",
        source = "";
    switch (template) {
      case "TRACE" -> {
        prompt =
            "let x = " + a + "; for (let i=0; i<" + b + "; i++) x += 2; Qual o valor final de x?";
        answer = "" + (a + 2 * b);
        hint = "Cada repetição acrescenta duas unidades. Conte as repetições antes de somar.";
        explanation = "Você acompanhou o estado da variável ao longo da repetição.";
      }
      case "DOSE" -> {
        int volume = 1 + r.nextInt(5 * level);
        prompt =
            "Simulação com solução fictícia: "
                + (a * b)
                + " unidades estão em "
                + b
                + " mL. Quantos mL contêm "
                + (a * volume)
                + " unidades? Digite somente o número.";
        answer = "" + volume;
        hint = "Divida a quantidade desejada pela concentração em unidades por mL.";
        explanation = "A análise das unidades ajuda a verificar a proporção.";
        context =
            "Exercício exclusivamente matemático. Não é prescrição, cálculo para paciente ou"
                + " orientação clínica.";
      }
      case "CASH" -> {
        prompt =
            "Caixa inicial: R$ "
                + (a * 100)
                + ". Entradas: R$ "
                + (b * 50)
                + ". Saídas: R$ "
                + (a * 30)
                + ". Digite o saldo final, sem símbolo monetário.";
        answer = "" + (a * 70 + b * 50);
        hint = "Some o saldo inicial às entradas e subtraia as saídas.";
        explanation = "O fluxo líquido foi integrado ao saldo inicial.";
      }
      case "CIRCUIT" -> {
        prompt =
            "Circuito ideal com tensão de "
                + (a * b)
                + " V e resistência de "
                + b
                + " Ω. Usando I=V/R, qual a corrente em A?";
        answer = "" + a;
        hint = "Substitua os dados na relação fornecida, verificando as unidades.";
        explanation = "Você aplicou a relação entre tensão, resistência e corrente.";
      }
      case "UNITS" -> {
        prompt = "Converta " + a + " km e " + (b * 10) + " m para metros. Digite apenas o total.";
        answer = "" + (a * 1000 + b * 10);
        hint = "Um quilômetro equivale a mil metros. Converta antes de somar.";
        explanation = "Você unificou as unidades antes da operação.";
      }
      case "FORMULA" -> {
        prompt =
            "Movimento uniforme: v="
                + a
                + " m/s durante "
                + b
                + " s. Usando Δs=v×t, qual o deslocamento em metros?";
        answer = "" + (a * b);
        hint = "Multiplique a velocidade pelo tempo; segundos se cancelam na unidade.";
        explanation = "A unidade final confirma o deslocamento calculado.";
      }
      case "PLAN" -> {
        prompt =
            "Etapa A dura "
                + a
                + " dias e B dura "
                + b
                + " dias. Ambas começam juntas. C só começa após ambas e dura "
                + level
                + " dias. Qual o prazo mínimo total?";
        answer = "" + (Math.max(a, b) + level);
        hint =
            "Etapas paralelas não têm suas durações somadas; considere a que termina por último.";
        explanation = "Você identificou a dependência que limita o cronograma.";
      }
      case "DECISION" -> {
        boolean aCheaper = r.nextBoolean();
        prompt =
            "Duas propostas entregam o mesmo resultado. A custa R$ "
                + (a * 20)
                + " por mês por "
                + b
                + " meses. B custa R$ "
                + (a * b * 20 + (aCheaper ? 1 : -1) * level * 10)
                + " no total. Qual proposta tem menor custo total? Digite A ou B.";
        answer = aCheaper ? "A" : "B";
        hint = "Calcule o custo total da proposta mensal antes de comparar.";
        explanation = "A comparação considerou o mesmo período e resultado.";
      }
      case "COST" -> {
        boolean fixed = r.nextBoolean();
        prompt =
            fixed
                ? "Um contrato define aluguel mensal constante, independentemente do volume"
                    + " produzido. Classifique: fixo ou variável."
                : "Cada unidade fabricada utiliza a mesma quantidade adicional de matéria-prima."
                    + " Classifique esse custo total: fixo ou variável.";
        answer = fixed ? "fixo" : "variável";
        hint = "Observe se o custo total muda quando a quantidade produzida varia.";
        explanation = "A classificação depende do comportamento do custo em relação ao volume.";
      }
      case "ANATOMY" -> {
        String[][] pool = {
          {"célula", "unidade estrutural básica dos seres vivos"},
          {"tecido", "conjunto organizado de células com funções relacionadas"},
          {"órgão", "estrutura composta por diferentes tecidos que cooperam em uma função"}
        };
        var q = pool[r.nextInt(pool.length)];
        prompt = "Qual termo corresponde a: " + q[1] + "?";
        answer = q[0];
        hint = "Compare os níveis de organização biológica do menor para o maior.";
        explanation = "Você relacionou estrutura e nível de organização.";
        source =
            "https://openstax.org/books/anatomy-and-physiology/pages/1-2-structural-organization-of-the-human-body";
        context = "Revisão acadêmica de anatomia; sem diagnóstico ou orientação clínica.";
      }
      case "PROTOCOL" -> {
        var labels = new ArrayList<>(List.of("A", "B", "C"));
        Collections.shuffle(labels, r);
        prompt =
            "Protocolo fictício de laboratório: identificar a amostra ("
                + labels.get(0)
                + "), conferir a identificação ("
                + labels.get(1)
                + "), registrar a conferência ("
                + labels.get(2)
                + "). A conferência depende da identificação e o registro depende da conferência."
                + " Digite a sequência de letras, sem espaços.";
        answer = String.join("", labels);
        hint = "Resolva primeiro a etapa que não depende das demais.";
        explanation = "Você respeitou as dependências do procedimento didático.";
        context = "Simulação de organização, não substitui protocolos clínicos.";
      }
      case "PRIORITY" -> {
        int size = Math.min(6, 3 + level / 3);
        var cards = new ArrayList<int[]>();
        StringBuilder description = new StringBuilder();
        for (int i = 0; i < size; i++) {
          int priority = 1 + r.nextInt(3 + level);
          cards.add(new int[] {i, priority});
          description
              .append((char) ('A' + i))
              .append(" (prioridade ")
              .append(priority)
              .append(", número ")
              .append(i + 1)
              .append("); ");
        }
        cards.sort(
            Comparator.<int[]>comparingInt(c -> c[1]).reversed().thenComparingInt(c -> c[0]));
        StringBuilder ordered = new StringBuilder();
        for (var card : cards) ordered.append((char) ('A' + card[0]));
        prompt =
            "Fila didática, sem pacientes reais: atenda maior prioridade primeiro; no empate, menor"
                + " número. Fichas: "
                + description
                + "Digite a ordem das letras, sem espaços.";
        answer = ordered.toString();
        hint = "Ordene primeiro pela prioridade; depois aplique o desempate.";
        explanation = "A fila seguiu os critérios explícitos do exercício.";
        context = "Não é protocolo de triagem clínica nem avaliação de gravidade de pacientes.";
      }
      case "RECORD" -> {
        prompt =
            "Em uma ficha didática, o valor foi registrado "
                + a
                + " vezes de manhã e "
                + b
                + " à tarde. Quantos registros precisam ser conferidos?";
        answer = "" + (a + b);
        hint = "Some as duas quantidades de registros. Não interprete valores clínicos.";
        explanation = "Você conferiu a completude do registro.";
        context = "Treino de leitura e organização de dados, sem interpretação clínica.";
      }
      case "LAW" -> {
        String[][] pool = {
          {"Legislativo", "legislar"},
          {"Executivo", "executar políticas públicas"},
          {"Judiciário", "julgar conflitos submetidos à Justiça"}
        };
        var q = pool[r.nextInt(pool.length)];
        prompt = "Associação introdutória: qual Poder tem como função típica " + q[1] + "?";
        answer = q[0];
        hint =
            "Considere a divisão de funções entre os três Poderes; o exercício pede a função"
                + " típica.";
        explanation = "A associação é introdutória; a Constituição também prevê funções atípicas.";
        source = "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm";
      }
      case "PRINCIPLE" -> {
        prompt =
            "No estudo da Constituição, o tratamento isonômico perante a lei está associado a qual"
                + " princípio? Digite o nome comum do princípio.";
        answer = "igualdade";
        hint = "Pense no princípio que se opõe ao tratamento arbitrariamente desigual.";
        explanation =
            "A interpretação deve partir do texto constitucional e do contexto acadêmico.";
        source = "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm";
      }
      case "ACCESS" -> {
        prompt =
            "Um formulário mostra apenas caixas vazias. Qual elemento textual visível deve"
                + " identificar o propósito de cada campo? Digite o termo em português.";
        answer = "rótulo";
        hint =
            "É o texto associado ao controle que explica o que deve ser preenchido; placeholder"
                + " sozinho não basta.";
        explanation =
            "Identificação visível e associação programática ajudam diferentes formas de"
                + " navegação.";
        source = "https://www.w3.org/WAI/tutorials/forms/labels/";
      }
      case "FLOW" -> {
        var labels = new ArrayList<>(List.of("A", "B", "C"));
        Collections.shuffle(labels, r);
        prompt =
            "Fluxo de cadastro: preencher dados ("
                + labels.get(0)
                + "), revisar ("
                + labels.get(1)
                + "), confirmar ("
                + labels.get(2)
                + "). Revisar exige dados preenchidos; confirmar exige revisão. Digite a ordem das"
                + " letras.";
        answer = String.join("", labels);
        hint = "Organize as ações pelas suas dependências.";
        explanation = "Você preservou a revisão antes da ação final.";
      }
      case "HEURISTIC" -> {
        prompt =
            "Após enviar um formulário, a interface não informa se está processando ou se concluiu."
                + " Complete a expressão: visibilidade do ___ do sistema.";
        answer = "estado";
        hint = "O usuário precisa saber a situação atual da operação.";
        explanation = "Feedback de progresso e conclusão reduz a incerteza durante uma tarefa.";
      }
      default -> throw ApiException.invalid("Atividade indisponível.");
    }
    return Map.of(
        "template",
        template,
        "prompt",
        prompt,
        "answer",
        answer,
        "hint",
        hint,
        "explanation",
        explanation,
        "context",
        context,
        "source",
        source);
  }
}

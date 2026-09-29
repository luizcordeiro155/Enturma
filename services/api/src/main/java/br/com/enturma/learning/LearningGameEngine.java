package br.com.enturma.learning;

import br.com.enturma.common.ApiException;
import java.time.LocalDate;
import java.util.*;

final class LearningGameEngine {
  private LearningGameEngine() {}

  static final String[][] WORD_BANKS = {
    {"CACHE", "ARRAY", "CLASS", "DEBUG", "QUERY", "STACK", "SCOPE", "PROXY", "TOKEN", "QUEUE"},
    {"STRING", "OBJECT", "THREAD", "BINARY", "STATIC", "RETURN", "IMPORT", "SOCKET", "SCRIPT", "PYTHON", "METHOD", "KOTLIN"},
    {"STRING", "OBJECT", "THREAD", "BINARY", "STATIC", "RETURN", "IMPORT", "SOCKET", "SCRIPT", "PYTHON", "METHOD", "KOTLIN"},
    {"BOOLEAN", "INTEGER", "PACKAGE", "POINTER", "NETWORK", "RUNTIME", "VIRTUAL", "GENERIC", "CLOSURE", "PROMISE", "PROCESS", "ITERATE"}
  };

  static int wordBoards(int level) {
    return switch (level) {
      case 1, 2 -> 1;
      case 3 -> 2;
      case 4 -> 4;
      default -> throw ApiException.invalid("Nível inválido.");
    };
  }

  static int wordLength(int level) {
    return switch (level) {
      case 1 -> 5;
      case 2, 3 -> 6;
      case 4 -> 7;
      default -> throw ApiException.invalid("Nível inválido.");
    };
  }

  static int maxWordGuesses(int level) {
    return switch (level) {
      case 1, 2 -> 6;
      case 3 -> 7;
      case 4 -> 9;
      default -> throw ApiException.invalid("Nível inválido.");
    };
  }

  static List<String> wordTargets(UUID user, int level, LocalDate date) {
    String[] bank = WORD_BANKS[level - 1];
    int count = wordBoards(level);
    int start = Math.floorMod(Objects.hash(user.toString(), date.toString(), level), bank.length);
    List<String> result = new ArrayList<>();
    for (int i = 0; result.size() < count && i < bank.length * 2; i++) {
      String value = bank[(start + i * 3) % bank.length];
      if (!result.contains(value)) result.add(value);
    }
    return result;
  }

  static boolean validProgrammingGuess(String guess, int level) {
    if (guess == null) return false;
    String normalized = guess.strip().toUpperCase(Locale.ROOT);
    if (!normalized.matches("[A-Z]+") || normalized.length() != wordLength(level)) return false;
    return Arrays.asList(WORD_BANKS[level - 1]).contains(normalized);
  }

  static List<Map<String, Object>> feedback(String guess, String target) {
    String g = guess.toUpperCase(Locale.ROOT);
    String t = target.toUpperCase(Locale.ROOT);
    List<Map<String, Object>> result = new ArrayList<>();
    Map<Character, Integer> remaining = new HashMap<>();
    boolean[] exact = new boolean[g.length()];
    for (int i = 0; i < t.length(); i++) {
      if (g.charAt(i) == t.charAt(i)) exact[i] = true;
      else remaining.merge(t.charAt(i), 1, Integer::sum);
    }
    for (int i = 0; i < g.length(); i++) {
      String state = "absent";
      if (exact[i]) state = "exact";
      else if (remaining.getOrDefault(g.charAt(i), 0) > 0) {
        state = "present";
        remaining.compute(g.charAt(i), (k, v) -> v == null ? 0 : Math.max(0, v - 1));
      }
      result.add(Map.of("letter", String.valueOf(g.charAt(i)), "state", state));
    }
    return result;
  }

  static boolean checkRobot(int level, String source) {
    RobotParser parser = new RobotParser(source);
    List<Node> program = parser.parse();
    if (level >= 2 && !contains(program, Repeat.class)) return false;
    if (level >= 3 && !contains(program, IfNode.class) && !contains(program, WhileNode.class))
      return false;
    if (level >= 4
        && (!contains(program, Repeat.class)
            || (!contains(program, IfNode.class) && !contains(program, WhileNode.class)))) return false;

    int size = level <= 2 ? 5 : 6;
    int[][] walls = {
      {1, 2, 6, 7, 11, 12, 17},
      {1, 2, 3, 6, 8, 11, 13, 16, 18},
      {1, 7, 13, 19, 20, 21, 22, 23, 28, 29},
      {1, 7, 18, 19, 24, 25, 26, 27, 28}
    };
    State state = new State(size, walls[level - 1]);
    execute(program, state);
    return !state.collision && state.x == size - 1 && state.y == size - 1;
  }

  private static boolean contains(List<Node> nodes, Class<?> kind) {
    for (Node node : nodes) {
      if (kind.isInstance(node)) return true;
      if (node instanceof Repeat r && contains(r.body, kind)) return true;
      if (node instanceof IfNode i && (contains(i.yes, kind) || contains(i.no, kind))) return true;
      if (node instanceof WhileNode w && contains(w.body, kind)) return true;
    }
    return false;
  }

  private static void execute(List<Node> nodes, State state) {
    for (Node node : nodes) {
      if (state.collision) return;
      if (node instanceof Move m) state.move(m.dir);
      else if (node instanceof Repeat r) {
        for (int i = 0; i < r.count && !state.collision; i++) execute(r.body, state);
      } else if (node instanceof IfNode i) {
        execute(state.canMove(i.dir) ? i.yes : i.no, state);
      } else if (node instanceof WhileNode w) {
        int guard = 0;
        while (state.canMove(w.dir) && !state.collision) {
          if (++guard > 40) throw ApiException.invalid("Loop excedeu o limite de segurança.");
          int before = state.steps;
          execute(w.body, state);
          if (state.steps == before) throw ApiException.invalid("O while precisa executar movimento.");
        }
      }
    }
  }

  private sealed interface Node permits Move, Repeat, IfNode, WhileNode {}
  private record Move(char dir) implements Node {}
  private record Repeat(int count, List<Node> body) implements Node {}
  private record IfNode(char dir, List<Node> yes, List<Node> no) implements Node {}
  private record WhileNode(char dir, List<Node> body) implements Node {}

  private static final class State {
    final int size;
    final Set<Integer> walls = new HashSet<>();
    int x;
    int y;
    int steps;
    boolean collision;

    State(int size, int[] wallValues) {
      this.size = size;
      for (int wall : wallValues) walls.add(wall);
    }

    boolean canMove(char dir) {
      int nx = x, ny = y;
      switch (dir) {
        case 'R' -> nx++;
        case 'L' -> nx--;
        case 'D' -> ny++;
        case 'U' -> ny--;
        default -> { return false; }
      }
      return nx >= 0 && nx < size && ny >= 0 && ny < size && !walls.contains(ny * size + nx);
    }

    void move(char dir) {
      if (++steps > 80) throw ApiException.invalid("Seu programa excedeu 80 movimentos.");
      if (!canMove(dir)) {
        collision = true;
        return;
      }
      switch (dir) {
        case 'R' -> x++;
        case 'L' -> x--;
        case 'D' -> y++;
        case 'U' -> y--;
        default -> throw ApiException.invalid("Direção inválida.");
      }
    }
  }

  private static final class RobotParser {
    private final List<String> tokens = new ArrayList<>();
    private int at;

    RobotParser(String source) {
      if (source == null || source.length() > 2500)
        throw ApiException.invalid("Programa inválido ou muito grande.");
      String clean = source.replaceAll("(?m)//.*$", "");
      java.util.regex.Matcher m =
          java.util.regex.Pattern
              .compile("\\G\\s*(repeat|while|if|else|canMove|right|left|up|down|\\d+|\"[RDLU]\"|[(){};])\\s*")
              .matcher(clean);
      int pos = 0;
      while (pos < clean.length()) {
        if (!m.find(pos) || m.start() != pos) throw ApiException.invalid("Sintaxe do programa inválida.");
        tokens.add(m.group(1));
        pos = m.end();
      }
    }

    List<Node> parse() {
      List<Node> result = statements(null);
      if (at != tokens.size()) throw ApiException.invalid("Programa inválido.");
      return result;
    }

    private List<Node> statements(String until) {
      List<Node> result = new ArrayList<>();
      while (at < tokens.size() && !Objects.equals(tokens.get(at), until)) {
        String token = take(null);
        if (Set.of("right", "left", "up", "down").contains(token)) {
          take("(");
          take(")");
          take(";");
          result.add(new Move(switch (token) {
            case "right" -> 'R';
            case "left" -> 'L';
            case "up" -> 'U';
            default -> 'D';
          }));
        } else if ("repeat".equals(token)) {
          take("(");
          int count;
          try {
            count = Integer.parseInt(take(null));
          } catch (NumberFormatException ex) {
            throw ApiException.invalid("repeat exige um número.");
          }
          if (count < 1 || count > 12) throw ApiException.invalid("repeat aceita valores de 1 a 12.");
          take(")");
          result.add(new Repeat(count, block()));
        } else if ("if".equals(token)) {
          char dir = condition();
          List<Node> yes = block();
          List<Node> no = List.of();
          if (at < tokens.size() && "else".equals(tokens.get(at))) {
            at++;
            no = block();
          }
          result.add(new IfNode(dir, yes, no));
        } else if ("while".equals(token)) {
          result.add(new WhileNode(condition(), block()));
        } else throw ApiException.invalid("Comando não permitido: " + token);
      }
      return result;
    }

    private char condition() {
      take("(");
      take("canMove");
      take("(");
      String raw = take(null);
      if (raw == null || !raw.matches("\"[RDLU]\""))
        throw ApiException.invalid("Direção inválida em canMove.");
      take(")");
      take(")");
      return raw.charAt(1);
    }

    private List<Node> block() {
      take("{");
      List<Node> value = statements("}");
      take("}");
      return value;
    }

    private String take(String expected) {
      if (at >= tokens.size()) throw ApiException.invalid("Programa incompleto.");
      String value = tokens.get(at++);
      if (expected != null && !expected.equals(value))
        throw ApiException.invalid("Esperado " + expected + ".");
      return value;
    }
  }
}

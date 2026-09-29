package br.com.enturma.learning;

import java.util.*;
import java.util.regex.*;

/** Small bounded interpreter: no eval, host APIs, network or filesystem access. */
public final class AlgorithmEngine {
  public record Result(
      boolean won, int commands, List<Map<String, Integer>> frames, String message) {}

  interface Node {
    void run(State s);
  }

  interface Expr {
    int get(State s);
  }

  static final class State {
    int x, y, direction = 1, ticks, moves;
    final Set<Integer> walls;
    final Map<String, Integer> vars = new HashMap<>();
    final Map<String, Node> functions = new HashMap<>();
    final List<Map<String, Integer>> frames = new ArrayList<>();

    State(int level) {
      walls = walls(level);
      frame();
    }

    void tick() {
      if (++ticks > 1000)
        throw new IllegalArgumentException(
            "Limite de execução atingido: verifique loops e recursão.");
    }

    void frame() {
      frames.add(Map.of("x", x, "y", y, "step", moves));
    }

    boolean blocked(int nx, int ny) {
      return nx < 0 || ny < 0 || nx > 5 || ny > 5 || walls.contains(ny * 6 + nx);
    }

    void call(String name) {
      tick();
      int nx = x, ny = y;
      switch (name) {
        case "turnRight" -> {
          direction = (direction + 1) % 4;
          return;
        }
        case "turnLeft" -> {
          direction = (direction + 3) % 4;
          return;
        }
        case "moveRight" -> nx++;
        case "moveLeft" -> nx--;
        case "moveDown" -> ny++;
        case "moveUp" -> ny--;
        case "moveForward" -> {
          nx += new int[] {0, 1, 0, -1}[direction];
          ny += new int[] {-1, 0, 1, 0}[direction];
        }
        default -> {
          Node f = functions.get(name);
          if (f == null) throw new IllegalArgumentException("Função desconhecida: " + name);
          f.run(this);
          return;
        }
      }
      if (++moves > 100) throw new IllegalArgumentException("Limite de 100 movimentos excedido.");
      if (blocked(nx, ny))
        throw new IllegalArgumentException("Colisão: use o sensor blocked() ou revise o caminho.");
      x = nx;
      y = ny;
      frame();
    }
  }

  public static Set<Integer> walls(int level) {
    Random r = new Random(0xE27A + level * 7919L);
    Set<Integer> safe = new HashSet<>();
    int x = 0, y = 0;
    safe.add(0);
    while (x < 5 || y < 5) {
      if (x == 5 || y < 5 && r.nextBoolean()) y++;
      else x++;
      safe.add(y * 6 + x);
    }
    Set<Integer> walls = new HashSet<>();
    for (int i = 1; i < 35; i++)
      if (!safe.contains(i) && r.nextDouble() < Math.min(.25 + level * .035, .8)) walls.add(i);
    return walls;
  }

  public static Result evaluate(String code, int level) {
    State s = new State(level);
    try {
      Parser p = new Parser(code);
      Node program = p.program(false);
      program.run(s);
      boolean won = s.x == 5 && s.y == 5;
      return new Result(
          won,
          s.moves,
          s.frames,
          won ? "Objetivo alcançado." : "O algoritmo terminou antes de alcançar o objetivo.");
    } catch (IllegalArgumentException | StackOverflowError e) {
      return new Result(
          false,
          s.moves,
          s.frames,
          e instanceof StackOverflowError ? "Recursão excedeu o limite." : e.getMessage());
    }
  }

  static final class Parser {
    final List<String> tokens = new ArrayList<>();
    int pos;

    Parser(String code) {
      String input = code.replaceAll("(?s)/\\*.*?\\*/", "").replaceAll("(?m)//[^\\n]*", "");
      Matcher m =
          Pattern.compile(
                  "\\s+|[A-Za-z_][A-Za-z_0-9]*|[0-9]+|==|!=|<=|>=|&&|\\|\\||[(){};,=+*/%<>!\\-]")
              .matcher(input);
      int end = 0;
      while (m.find()) {
        if (m.start() != end)
          throw new IllegalArgumentException(
              "Símbolo não suportado perto de "
                  + input.substring(end, Math.min(end + 12, input.length())));
        end = m.end();
        if (!m.group().isBlank()) tokens.add(m.group());
      }
      if (end != input.length())
        throw new IllegalArgumentException("Código contém símbolos não suportados.");
      if (tokens.size() > 1500) throw new IllegalArgumentException("Programa muito extenso.");
    }

    boolean take(String t) {
      if (pos < tokens.size() && tokens.get(pos).equals(t)) {
        pos++;
        return true;
      }
      return false;
    }

    String next() {
      if (pos >= tokens.size()) throw new IllegalArgumentException("Código incompleto.");
      return tokens.get(pos++);
    }

    void need(String t) {
      if (!take(t))
        throw new IllegalArgumentException("Esperado '" + t + "' perto do comando " + (pos + 1));
    }

    Node program(boolean block) {
      List<Node> list = new ArrayList<>();
      while (pos < tokens.size() && (!block || !tokens.get(pos).equals("}"))) {
        list.add(statement());
      }
      if (block) need("}");
      return s -> {
        for (Node n : list) {
          s.tick();
          n.run(s);
        }
      };
    }

    Node block() {
      need("{");
      return program(true);
    }

    Node statement() {
      if (take(";")) return s -> {};
      if (take("function")) {
        String name = next();
        need("(");
        need(")");
        Node body = block();
        return s -> s.functions.put(name, body);
      }
      if (take("if")) {
        need("(");
        Expr c = expr();
        need(")");
        Node yes = block();
        Node no = take("else") ? block() : s -> {};
        return s -> {
          if (c.get(s) != 0) yes.run(s);
          else no.run(s);
        };
      }
      if (take("while")) {
        need("(");
        Expr c = expr();
        need(")");
        Node body = block();
        return s -> {
          while (c.get(s) != 0) {
            s.tick();
            body.run(s);
          }
        };
      }
      if (take("repeat")) {
        need("(");
        Expr count = expr();
        Node body;
        if (take(",")) {
          String f = next();
          need(")");
          take(";");
          body = s -> s.call(f);
        } else {
          need(")");
          body = block();
        }
        return s -> {
          int n = count.get(s);
          if (n < 0 || n > 100)
            throw new IllegalArgumentException("repeat aceita de 0 a 100 repetições.");
          for (int i = 0; i < n; i++) {
            s.tick();
            body.run(s);
          }
        };
      }
      if (take("let") || take("const") || take("var")) {
        String name = next();
        need("=");
        Expr e = expr();
        need(";");
        return s -> s.vars.put(name, e.get(s));
      }
      String name = next();
      if (take("=")) {
        Expr e = expr();
        need(";");
        return s -> s.vars.put(name, e.get(s));
      }
      need("(");
      need(")");
      need(";");
      return s -> s.call(name);
    }

    Expr expr() {
      return binary(0);
    }

    static final String[][] OPS = {
      {"||"}, {"&&"}, {"==", "!="}, {"<", ">", "<=", ">="}, {"+", "-"}, {"*", "/", "%"}
    };

    Expr binary(int rank) {
      if (rank == OPS.length) return atom();
      Expr left = binary(rank + 1);
      while (pos < tokens.size() && Arrays.asList(OPS[rank]).contains(tokens.get(pos))) {
        String op = next();
        Expr a = left, b = binary(rank + 1);
        left =
            s -> {
              int x = a.get(s);
              if (op.equals("&&") && x == 0) return 0;
              if (op.equals("||") && x != 0) return 1;
              int y = b.get(s);
              if (y == 0 && (op.equals("/") || op.equals("%")))
                throw new IllegalArgumentException("Divisão por zero.");
              return switch (op) {
                case "+" -> x + y;
                case "-" -> x - y;
                case "*" -> x * y;
                case "/" -> y == 0 ? 0 : x / y;
                case "%" -> y == 0 ? 0 : x % y;
                case "==" -> x == y ? 1 : 0;
                case "!=" -> x != y ? 1 : 0;
                case "<" -> x < y ? 1 : 0;
                case ">" -> x > y ? 1 : 0;
                case "<=" -> x <= y ? 1 : 0;
                case ">=" -> x >= y ? 1 : 0;
                case "&&" -> y != 0 ? 1 : 0;
                default -> y != 0 ? 1 : 0;
              };
            };
      }
      return left;
    }

    Expr atom() {
      if (take("!")) {
        Expr e = atom();
        return s -> e.get(s) == 0 ? 1 : 0;
      }
      if (take("-")) {
        Expr e = atom();
        return s -> -e.get(s);
      }
      if (take("(")) {
        Expr e = expr();
        need(")");
        return e;
      }
      String t = next();
      if (t.matches("[0-9]+")) {
        int n = Integer.parseInt(t);
        return s -> n;
      }
      if (t.equals("true")) return s -> 1;
      if (t.equals("false")) return s -> 0;
      if (t.equals("blocked") || t.equals("atGoal")) {
        need("(");
        need(")");
        return s ->
            t.equals("atGoal")
                ? (s.x == 5 && s.y == 5 ? 1 : 0)
                : (s.blocked(
                        s.x + new int[] {0, 1, 0, -1}[s.direction],
                        s.y + new int[] {-1, 0, 1, 0}[s.direction])
                    ? 1
                    : 0);
      }
      return s -> {
        if (t.equals("x")) return s.x;
        if (t.equals("y")) return s.y;
        Integer n = s.vars.get(t);
        if (n == null) throw new IllegalArgumentException("Variável desconhecida: " + t);
        return n;
      };
    }
  }
}

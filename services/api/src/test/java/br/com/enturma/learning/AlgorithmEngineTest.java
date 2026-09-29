package br.com.enturma.learning;

import static org.assertj.core.api.Assertions.*;

import java.util.*;
import org.junit.jupiter.api.Test;

class AlgorithmEngineTest {
  @Test
  void everyGeneratedMapHasExecutableSolution() {
    for (int level = 1; level <= 200; level++) {
      var walls = AlgorithmEngine.walls(level);
      var paths = new HashMap<Integer, String>();
      var queue = new ArrayDeque<Integer>();
      queue.add(0);
      paths.put(0, "");
      while (!queue.isEmpty() && !paths.containsKey(35)) {
        int cell = queue.remove();
        int x = cell % 6, y = cell / 6;
        int[][] d = {{1, 0}, {0, 1}, {-1, 0}, {0, -1}};
        String[] cmd = {"moveRight();", "moveDown();", "moveLeft();", "moveUp();"};
        for (int i = 0; i < 4; i++) {
          int nx = x + d[i][0], ny = y + d[i][1], n = ny * 6 + nx;
          if (nx < 0 || nx > 5 || ny < 0 || ny > 5 || walls.contains(n) || paths.containsKey(n))
            continue;
          paths.put(n, paths.get(cell) + cmd[i]);
          queue.add(n);
        }
      }
      assertThat(paths).containsKey(35);
      assertThat(
              AlgorithmEngine.evaluate("function solve(){" + paths.get(35) + "} solve();", level)
                  .won())
          .isTrue();
    }
  }

  @Test
  void executesConditionsAndLimitsInfinitePrograms() {
    var ignored =
        AlgorithmEngine.evaluate(
            "if(false){moveLeft();} let i=0; while(i<2){turnRight();i=i+1;}", 1);
    assertThat(ignored.commands()).isZero();
    assertThat(ignored.message()).doesNotContain("Colisão");
    assertThat(AlgorithmEngine.evaluate("while(true){turnRight();}", 1).message())
        .contains("Limite");
    assertThat(AlgorithmEngine.evaluate("function recurse(){recurse();} recurse();", 1).won())
        .isFalse();
    assertThat(AlgorithmEngine.evaluate("fetch('https://example.com');", 1).won()).isFalse();
  }
}

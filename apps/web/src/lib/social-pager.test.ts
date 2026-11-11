import { expect, it } from "vitest";
import {
  PAGER_ORDER,
  gestureStartAllowed,
  lockAxis,
  pagerNeighbor,
  pagerSettles,
} from "./social-pager";

it("mantém o Feed entre Clips e Criar", () => {
  expect(PAGER_ORDER).toEqual(["clips", "feed", "create"]);
});
it("mapeia o arrasto para a página vizinha, com o Feed no meio", () => {
  expect(pagerNeighbor("feed", 80)).toBe("clips");
  expect(pagerNeighbor("feed", -80)).toBe("create");
  expect(pagerNeighbor("clips", -80)).toBe("feed");
  expect(pagerNeighbor("clips", 80)).toBeNull();
  expect(pagerNeighbor("create", 80)).toBe("feed");
  expect(pagerNeighbor("create", -80)).toBeNull();
});
it("trava o eixo só depois de 10 px e prefere o vertical em diagonal", () => {
  expect(lockAxis(6, 3)).toBeNull();
  expect(lockAxis(30, 8)).toBe("x");
  expect(lockAxis(8, 30)).toBe("y");
  expect(lockAxis(20, 20)).toBe("y");
});
it("confirma a troca com 25% da largura ou com velocidade", () => {
  expect(pagerSettles(100, 400, 390)).toBe(true); // 25,6%
  expect(pagerSettles(90, 400, 390)).toBe(false);
  expect(pagerSettles(60, 80, 390)).toBe(true); // 0,75 px/ms
  expect(pagerSettles(20, 20, 390)).toBe(false); // rápido, mas menos de 24 px
});
it("ignora gestos que começam na borda do sistema", () => {
  expect(gestureStartAllowed(27, 390)).toBe(false);
  expect(gestureStartAllowed(28, 390)).toBe(true);
  expect(gestureStartAllowed(363, 390)).toBe(false);
});

import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SocialView } from "@/lib/social";
import { SocialPager } from "./social-pager";

function Pager({
  view,
  select,
  peek = () => {},
}: {
  view: SocialView;
  select: (view: SocialView) => void;
  peek?: (view: SocialView) => void;
}) {
  return (
    <SocialPager view={view} select={select} peek={peek}>
      {(page) =>
        page === "feed" ? (
          <>
            <div data-testid="carousel" data-social-gesture="ignore" />
            <textarea aria-label="Comentário" />
          </>
        ) : (
          <p>{page}</p>
        )
      }
    </SocialPager>
  );
}
const page = (name: SocialView) =>
  document.querySelector<HTMLElement>(`[data-page="${name}"]`)!;
const point = (x: number, y: number) => ({ clientX: x, clientY: y });
function swipe(el: Element, fromX: number, toX: number, y = 300, toY = y) {
  const midX = (fromX + toX) / 2,
    midY = (y + toY) / 2;
  fireEvent.touchStart(el, { touches: [point(fromX, y)] });
  fireEvent.touchMove(el, { touches: [point(midX, midY)] });
  fireEvent.touchMove(el, { touches: [point(toX, toY)] });
  fireEvent.touchEnd(el, { changedTouches: [point(toX, toY)] });
}

beforeEach(() => {
  vi.stubGlobal("innerWidth", 390);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width: 760px"),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("troca de página conforme a direção, com o Feed no meio", () => {
  const select = vi.fn();
  const { rerender } = render(<Pager view="feed" select={select} />);
  swipe(page("feed"), 100, 300); // dedo para a direita
  expect(select).toHaveBeenLastCalledWith("clips");
  swipe(page("feed"), 300, 100);
  expect(select).toHaveBeenLastCalledWith("create");
  rerender(<Pager view="clips" select={select} />);
  swipe(page("clips"), 300, 100);
  expect(select).toHaveBeenLastCalledWith("feed");
  select.mockClear();
  swipe(page("clips"), 100, 300);
  expect(select).not.toHaveBeenCalled();
});
it("não troca quando o gesto começa em carrossel, campo de texto ou borda", () => {
  const select = vi.fn();
  render(<Pager view="feed" select={select} />);
  swipe(screen.getByTestId("carousel"), 300, 100);
  swipe(screen.getByRole("textbox"), 300, 100);
  swipe(page("feed"), 10, 300);
  expect(select).not.toHaveBeenCalled();
});
it("movimento vertical dominante não troca de página", () => {
  const select = vi.fn();
  render(<Pager view="feed" select={select} />);
  swipe(page("feed"), 100, 140, 300, 500);
  expect(select).not.toHaveBeenCalled();
});
it("um arrasto curto e lento volta para a página atual", () => {
  const select = vi.fn();
  let clock = 0;
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  render(<Pager view="feed" select={select} />);
  const feed = page("feed");
  fireEvent.touchStart(feed, { touches: [point(200, 300)] });
  fireEvent.touchMove(feed, { touches: [point(150, 300)] });
  clock = 900; // 50 px em 900 ms: nem 25% da largura, nem um movimento rápido
  fireEvent.touchEnd(feed, { changedTouches: [point(150, 300)] });
  expect(select).not.toHaveBeenCalled();
  clock = 1000;
  fireEvent.touchStart(feed, { touches: [point(200, 300)] });
  fireEvent.touchMove(feed, { touches: [point(150, 300)] });
  clock = 1060; // os mesmos 50 px em 60 ms confirmam a troca
  fireEvent.touchEnd(feed, { changedTouches: [point(150, 300)] });
  expect(select).toHaveBeenCalledWith("create");
  vi.restoreAllMocks();
});
it("prepara a página vizinha assim que o arrasto horizontal começa", () => {
  const peek = vi.fn();
  render(<Pager view="feed" select={() => {}} peek={peek} />);
  fireEvent.touchStart(page("feed"), { touches: [point(300, 300)] });
  fireEvent.touchMove(page("feed"), { touches: [point(260, 302)] });
  expect(peek).toHaveBeenCalledWith("create");
});
it("as páginas inativas ficam inertes", () => {
  render(<Pager view="feed" select={() => {}} />);
  expect(page("clips")).toHaveAttribute("inert");
  expect(page("create")).toHaveAttribute("inert");
  expect(page("feed")).not.toHaveAttribute("inert");
});
it("acima de 760 px o arrasto não troca de página", () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  const select = vi.fn();
  render(<Pager view="feed" select={select} />);
  swipe(page("feed"), 300, 100);
  expect(select).not.toHaveBeenCalled();
});

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MediaTimeline } from "./media-timeline";
afterEach(cleanup);
it("offers precise keyboard alternatives to dragging either trim handle", () => {
  const change = vi.fn();
  render(
    <MediaTimeline
      duration={120}
      frames={[]}
      start={10}
      end={40}
      position={20}
      seek={() => {}}
      change={change}
    />,
  );
  fireEvent.keyDown(
    screen.getByRole("slider", { name: "In\u00edcio do corte" }),
    { key: "ArrowRight" },
  );
  expect(change).toHaveBeenCalledWith("start", 10.1, true);
  fireEvent.keyDown(screen.getByRole("slider", { name: "Fim do corte" }), {
    key: "ArrowLeft",
    shiftKey: true,
  });
  expect(change).toHaveBeenLastCalledWith("end", 39, true);
});
it("cover scrubbing never changes trimming and thumbnails use real decoded frames", () => {
  const seek = vi.fn();
  render(
    <MediaTimeline
      duration={10}
      frames={[{ time: 0, url: "data:image/jpeg;base64,test" }]}
      start={0}
      end={10}
      position={2}
      seek={seek}
      mode="cover"
    />,
  );
  expect(
    screen.queryByRole("slider", { name: "In\u00edcio do corte" }),
  ).toBeNull();
  fireEvent.keyDown(
    screen.getByRole("slider", { name: "Escolher quadro da capa" }),
    { key: "ArrowRight" },
  );
  expect(seek).toHaveBeenCalledWith(2.1);
  expect(
    screen.getByTestId("media-filmstrip").querySelector("img"),
  ).toHaveAttribute("src", "data:image/jpeg;base64,test");
});

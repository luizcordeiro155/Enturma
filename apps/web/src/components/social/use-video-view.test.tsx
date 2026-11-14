import { useRef } from "react";
import { cleanup, fireEvent, render, act } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useVideoView } from "./use-video-view";
const write = vi.hoisted(() => vi.fn());
vi.mock("@/lib/social", () => ({ socialWrite: write }));
function Fixture() {
  const ref = useRef<HTMLVideoElement>(null);
  useVideoView(ref, "post");
  return <video ref={ref} />;
}
beforeEach(() => {
  write.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(document, "hidden", {
    value: false,
    configurable: true,
  });
});
afterEach(cleanup);
it("counts actual playback once and reports completion without counting seeks", async () => {
  const { container } = render(<Fixture />);
  const video = container.querySelector("video")!;
  Object.defineProperties(video, {
    paused: { value: false },
    duration: { value: 10 },
  });
  video.currentTime = 8;
  fireEvent.seeking(video);
  fireEvent.seeked(video);
  fireEvent.timeUpdate(video);
  expect(write).not.toHaveBeenCalled();
  video.currentTime = 0;
  fireEvent.seeking(video);
  fireEvent.seeked(video);
  for (let time = 0.5; time <= 4; time += 0.5) {
    await act(async () => {
      video.currentTime = time;
      fireEvent.timeUpdate(video);
    });
  }
  expect(write).toHaveBeenCalledExactlyOnceWith("/posts/post/view", {
    watchedMs: 3000,
    completed: false,
  });
  for (let time = 4.5; time <= 9; time += 0.5) {
    await act(async () => {
      video.currentTime = time;
      fireEvent.timeUpdate(video);
    });
  }
  expect(write).toHaveBeenCalledTimes(2);
  expect(write).toHaveBeenLastCalledWith("/posts/post/view", {
    watchedMs: 9000,
    completed: true,
  });
});
it("does not count background playback and retries after a failed request", async () => {
  const { container } = render(<Fixture />);
  const video = container.querySelector("video")!;
  Object.defineProperties(video, {
    paused: { value: false },
    duration: { value: 10 },
  });
  Object.defineProperty(document, "hidden", {
    value: true,
    configurable: true,
  });
  for (let time = 0.5; time <= 4; time += 0.5) {
    video.currentTime = time;
    fireEvent.timeUpdate(video);
  }
  expect(write).not.toHaveBeenCalled();
  Object.defineProperty(document, "hidden", {
    value: false,
    configurable: true,
  });
  write.mockRejectedValueOnce(new Error("offline"));
  for (let time = 4.5; time <= 8; time += 0.5) {
    await act(async () => {
      video.currentTime = time;
      fireEvent.timeUpdate(video);
    });
  }
  expect(write).toHaveBeenCalledTimes(2);
});

import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SocialVideoVolume } from "./social-video-volume";

afterEach(cleanup);

it("names a single feed video by default", () => {
  render(
    <SocialVideoVolume volume={1} onVolumeChange={() => {}} muted onMutedChange={() => {}} />,
  );
  expect(screen.getByRole("button", { name: "Ativar som do vídeo" })).toBeInTheDocument();
  expect(screen.getByRole("slider", { name: "Volume do vídeo" })).toBeInTheDocument();
});

it("names the shared Clips sound when given the Clips labels", () => {
  const onMutedChange = vi.fn();
  const { rerender } = render(
    <SocialVideoVolume
      volume={1}
      onVolumeChange={() => {}}
      muted
      onMutedChange={onMutedChange}
      labels={{ unmute: "Ativar som dos Clips", mute: "Silenciar Clips", volume: "Volume dos Clips" }}
    />,
  );
  expect(screen.getByRole("slider", { name: "Volume dos Clips" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ativar som dos Clips" }));
  expect(onMutedChange).toHaveBeenCalledWith(false);
  rerender(
    <SocialVideoVolume
      volume={1}
      onVolumeChange={() => {}}
      muted={false}
      onMutedChange={onMutedChange}
      labels={{ unmute: "Ativar som dos Clips", mute: "Silenciar Clips", volume: "Volume dos Clips" }}
    />,
  );
  expect(screen.getByRole("button", { name: "Silenciar Clips" })).toBeInTheDocument();
});

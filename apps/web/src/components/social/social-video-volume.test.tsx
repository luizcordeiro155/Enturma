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

it("no celular, tocar liga e desliga o som e segurar abre o volume", async () => {
  const onMutedChange = vi.fn();
  const { container } = render(
    <SocialVideoVolume volume={1} onVolumeChange={() => {}} muted onMutedChange={onMutedChange} />,
  );
  const control = container.querySelector(".social-video-volume")!;
  const button = screen.getByRole("button", { name: "Ativar som do vídeo" });
  fireEvent.pointerDown(button, { pointerType: "touch", clientX: 5, clientY: 5 });
  fireEvent.pointerUp(button, { pointerType: "touch", clientX: 5, clientY: 5 });
  fireEvent.click(button);
  expect(onMutedChange).toHaveBeenCalledWith(false);
  expect(control).toHaveAttribute("data-open", "false");
  onMutedChange.mockClear();
  fireEvent.pointerDown(button, { pointerType: "touch", clientX: 5, clientY: 5 });
  await new Promise((resolve) => setTimeout(resolve, 600));
  fireEvent.pointerUp(button, { pointerType: "touch", clientX: 5, clientY: 5 });
  fireEvent.click(button);
  expect(onMutedChange).not.toHaveBeenCalled();
  expect(control).toHaveAttribute("data-open", "true");
  fireEvent.pointerDown(document.body);
  expect(control).toHaveAttribute("data-open", "false");
});

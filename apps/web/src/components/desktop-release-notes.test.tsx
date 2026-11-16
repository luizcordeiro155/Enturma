import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DesktopReleaseNotes, versionIncreased } from "./desktop-release-notes";
import { RELEASE_NOTES } from "@/lib/release-notes";
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/lib/motion", () => ({ playMotion: vi.fn() }));
afterEach(() => {
  cleanup();
  localStorage.clear();
  delete window.enturmaDesktop;
});
test("only strictly newer native versions count as an installed update", () => {
  expect(versionIncreased("0.4.9", "0.4.10")).toBe(true);
  expect(versionIncreased("0.4.10", "0.4.9")).toBe(false);
  expect(versionIncreased("0.4.9", "0.4.9")).toBe(false);
  expect(versionIncreased("unknown", "0.4.9")).toBe(false);
});
test("announces the installed release once with the current release notes", async () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  localStorage.setItem("enturma-desktop-seen-version", "0.4.1");
  window.enturmaDesktop = {
    isDesktop: true,
    checkForUpdates: vi.fn(),
    getInfo: async () => ({
      version: "0.4.2",
      platform: "win32",
      releaseNotes: ["Alteração da versão instalada"],
    }),
    openExternal: vi.fn(),
  };
  render(<DesktopReleaseNotes version="0.4.2" />);
  await screen.findByRole("dialog", { name: "Enturma atualizado." });
  for (const group of RELEASE_NOTES)
    expect(await screen.findByText(group.items[0])).toBeTruthy();
  expect(screen.queryByText("Alteração da versão instalada")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Continuar estudando" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(localStorage.getItem("enturma-desktop-seen-version")).toBe("0.4.2");
});

test("announces Android updates with their own remembered version", async () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  localStorage.setItem("enturma-android-seen-version", "0.4.600");
  render(<DesktopReleaseNotes version="0.4.610" storageKey="enturma-android-seen-version" />);
  await screen.findByRole("dialog", { name: "Enturma atualizado." });
  expect(screen.getByText(/0\.4\.610/)).toBeTruthy();
  expect(localStorage.getItem("enturma-android-seen-version")).toBe("0.4.610");
  expect(localStorage.getItem("enturma-desktop-seen-version")).toBeNull();
});

test("a first install remembers the version without announcing", () => {
  render(<DesktopReleaseNotes version="0.4.610" storageKey="enturma-android-seen-version" />);
  expect(screen.queryByRole("dialog")).toBeNull();
});

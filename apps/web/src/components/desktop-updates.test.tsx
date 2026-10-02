import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  DesktopUpdateButton,
  DesktopUpdateProvider,
  isDesktop,
  type UpdateState,
} from "./desktop-updates";
vi.mock("./call-session-provider", () => ({
  useCallSession: () => ({ session: null }),
}));
let receive: (value: UpdateState) => void;
const install = vi.fn().mockResolvedValue(undefined);
const unsubscribe = vi.fn();
beforeEach(() => {
  document.documentElement.dataset.reducedMotion = "true";
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  window.enturmaDesktop = {
    isDesktop: true,
    getInfo: async () => ({ version: "0.3.0", platform: "win32" }),
    checkForUpdates: vi.fn(),
    installUpdate: install,
    openExternal: vi.fn(),
    getUpdateState: async () => ({
      status: "current",
      progress: 0,
      currentVersion: "0.3.0",
    }),
    onUpdateState: (callback) => {
      receive = callback;
      return unsubscribe;
    },
  };
});
afterEach(() => {
  cleanup();
  delete window.enturmaDesktop;
  delete document.documentElement.dataset.reducedMotion;
  vi.clearAllMocks();
  sessionStorage.clear();
});
describe("Desktop update UI", () => {
  it("offers official installer recovery to the old bridge without invoking the failing updater", async () => {
    const external = vi.fn().mockResolvedValue(undefined);
    const oldCheck = vi.fn();
    window.enturmaDesktop = {
      isDesktop: true,
      getInfo: async () => ({ version: "0.2.0", platform: "win32" }),
      checkForUpdates: oldCheck,
      openExternal: external,
    };
    render(
      <DesktopUpdateProvider>
        <DesktopUpdateButton />
      </DesktopUpdateProvider>,
    );
    const recovery = await screen.findByRole("button", {
      name: "Baixar atualização oficial",
    });
    fireEvent.click(recovery);
    expect(external).toHaveBeenCalledWith(
      "https://enturma-desktop-download-v5-production.up.railway.app/Enturma-Windows.exe",
    );
    expect(oldCheck).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Verificar novamente" }),
    ).toBeNull();
  });
  it("keeps a downloaded update available after deferring and installs only on request", async () => {
    render(
      <DesktopUpdateProvider>
        <DesktopUpdateButton />
      </DesktopUpdateProvider>,
    );
    await screen.findByText("Você está atualizado");
    act(() =>
      receive({
        status: "downloading",
        progress: 63,
        currentVersion: "0.3.0",
        version: "0.3.1",
      }),
    );
    expect(screen.getByText(/63%/)).toBeTruthy();
    act(() =>
      receive({
        status: "ready",
        progress: 100,
        currentVersion: "0.3.0",
        version: "0.3.1",
      }),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Depois" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(install).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Atualização pronta" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Atualizar e reiniciar" }),
    );
    expect(install).toHaveBeenCalledOnce();
    cleanup();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
  it("does not show desktop controls on the web", () => {
    delete window.enturmaDesktop;
    render(
      <DesktopUpdateProvider>
        <DesktopUpdateButton />
      </DesktopUpdateProvider>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(isDesktop()).toBe(false);
  });
  it("recognizes the preload and legacy user agent", () => {
    expect(isDesktop()).toBe(true);
    delete window.enturmaDesktop;
    const getter = vi
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue("EnturmaDesktop/0.2.0");
    expect(isDesktop()).toBe(true);
    getter.mockRestore();
  });
});

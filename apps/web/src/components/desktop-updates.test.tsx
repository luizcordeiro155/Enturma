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
  DesktopUpdateTitlebarAction,
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
    getInfo: async () => ({ version: "0.3.3", platform: "win32" }),
    checkForUpdates: vi.fn(),
    installUpdate: install,
    openExternal: vi.fn(),
    getUpdateState: async () => ({
      status: "current",
      progress: 0,
      currentVersion: "0.3.3",
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
  it("only exposes titlebar download after availability and keeps progress", async () => {
    const show = vi.fn().mockResolvedValue(undefined);
    window.enturmaDesktop!.nativeUpdater = true;
    window.enturmaDesktop!.showUpdateWindow = show;
    render(<DesktopUpdateProvider><DesktopUpdateTitlebarAction /></DesktopUpdateProvider>);
    expect(screen.queryByRole("button", { name: /Baixar atualização do Enturma/ })).toBeNull();
    await act(async () => { await Promise.resolve(); });
    act(() => receive({ status: "available", currentVersion: "0.4.380", version: "0.4.381", progress: 0 }));
    fireEvent.click(screen.getByRole("button", { name: "Baixar atualização do Enturma" }));
    expect(show).toHaveBeenCalledTimes(1);
    act(() => receive({ status: "downloading", currentVersion: "0.4.380", version: "0.4.381", progress: 58 }));
    expect(screen.getByText("58%")).toBeTruthy();
    act(() => receive({ status: "ready", currentVersion: "0.4.380", version: "0.4.381", progress: 100 }));
    expect(screen.getByRole("button", { name: "Instalar atualização do Enturma" })).toBeTruthy();
  });

  it("never opens the legacy dialog automatically for a native ready update", async () => {
    const show = vi.fn().mockResolvedValue(undefined);
    window.enturmaDesktop!.nativeUpdater = true;
    window.enturmaDesktop!.showUpdateWindow = show;
    render(<DesktopUpdateProvider><DesktopUpdateButton /></DesktopUpdateProvider>);
    await screen.findByRole("button", { name: "Atualizações: Você está atualizado" });
    act(() => receive({ status: "available", currentVersion: "0.4.360", version: "0.4.361", progress: 0 }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(show).not.toHaveBeenCalled();
  });

  it('opens the local updater instead of duplicating the hosted dialog', async () => {
    const show = vi.fn().mockResolvedValue(undefined);
    window.enturmaDesktop!.nativeUpdater = true;
    window.enturmaDesktop!.showUpdateWindow = show;
    render(<DesktopUpdateProvider><DesktopUpdateButton /></DesktopUpdateProvider>);
    await screen.findByRole('button', { name: 'Atualizações: Você está atualizado' });
    act(() => receive({ status: 'ready', currentVersion: '0.4.356', version: '0.4.357', progress: 100 }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Atualizações: Atualização pronta' }));
    expect(show).toHaveBeenCalledOnce();
    expect(install).not.toHaveBeenCalled();
  });
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
    await screen.findByRole("button", {
      name: "Atualizações: Você está atualizado",
    });
    act(() =>
      receive({
        status: "downloading",
        progress: 63,
        currentVersion: "0.3.3",
        version: "0.3.4",
      }),
    );
    expect(screen.getByRole("button", { name: /63%/ })).toBeTruthy();
    act(() =>
      receive({
        status: "ready",
        progress: 100,
        currentVersion: "0.3.3",
        version: "0.3.4",
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Atualizações: Atualização pronta" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Depois" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(install).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Atualizações: Atualização pronta" }),
    );
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

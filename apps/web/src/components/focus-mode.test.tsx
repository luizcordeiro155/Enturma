import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FocusBlock, FocusModeSettings } from "./focus-mode";
import { syncNativeFocus } from "@/lib/focus-mode";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));

const native = { getFocusSupport: vi.fn(), requestFocusPermission: vi.fn(), setStudyFocus: vi.fn() };

beforeEach(() => {
  api.mockReset();
  Object.values(native).forEach((fn) => fn.mockReset());
  (window as unknown as { EnturmaNative?: unknown }).EnturmaNative = native;
});
afterEach(() => {
  cleanup();
  delete (window as unknown as { EnturmaNative?: unknown }).EnturmaNative;
});

it("explains the pause during a class and points to the setting", () => {
  render(
    <FocusBlock
      focus={{ enabled: true, active: true, blocked: true, kind: "CLASS", title: "Cálculo I", until: "2026-11-16T01:00:00Z" }}
    />,
  );
  expect(screen.getByRole("heading", { name: "O Enturma Social está pausado agora" })).toBeInTheDocument();
  expect(screen.getByText("Cálculo I")).toBeInTheDocument();
  expect(screen.getByText(/pode desativar isso nas configurações/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /configurar modo foco/i })).toHaveAttribute("href", "/settings#modo-foco");
});

it("during an AI study session it leads back to the room", () => {
  render(<FocusBlock focus={{ enabled: true, active: true, blocked: true, kind: "STUDY", title: "Física", studyId: "s1" }} />);
  expect(screen.getByRole("link", { name: "Voltar para a sala de estudo" })).toHaveAttribute("href", "/study/s1");
});

it("the setting turns focus off and tells the Android app to stop silencing", async () => {
  native.getFocusSupport.mockReturnValue(JSON.stringify({ supported: true, granted: false }));
  const until = new Date(Date.now() + 3600000).toISOString();
  api.mockImplementation((_path: string, init?: RequestInit) =>
    Promise.resolve(
      init?.method === "PUT"
        ? { enabled: false, active: true, blocked: false }
        : { enabled: true, active: true, blocked: true, kind: "CLASS", title: "Cálculo I", until },
    ),
  );
  render(<FocusModeSettings />);
  const toggle = await screen.findByRole("switch", { name: /ativado/i });
  await act(async () => {});
  expect(toggle).toBeChecked();
  expect(screen.getByRole("status")).toHaveTextContent("Em foco agora · Cálculo I");
  expect(native.setStudyFocus).toHaveBeenLastCalledWith(true, Date.parse(until));

  fireEvent.click(screen.getByRole("button", { name: "Permitir “Não perturbe”" }));
  expect(native.requestFocusPermission).toHaveBeenCalled();

  await act(async () => fireEvent.click(toggle));
  expect(api).toHaveBeenCalledWith("/planner/focus", { method: "PUT", body: JSON.stringify({ enabled: false }) });
  expect(screen.getByRole("switch", { name: /desativado/i })).not.toBeChecked();
  expect(native.setStudyFocus).toHaveBeenLastCalledWith(false, 0);
});

it("an expired focus never keeps the phone silenced", () => {
  syncNativeFocus({ enabled: true, active: true, blocked: true, until: new Date(Date.now() - 1000).toISOString() });
  expect(native.setStudyFocus).toHaveBeenLastCalledWith(false, expect.any(Number));
});

import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SessionList, type AccountSession } from "./settings-session-list";

afterEach(cleanup);
const now = new Date("2026-11-16T22:00:00-03:00");

const sessions: AccountSession[] = [
  {
    id: "here",
    device: "Navegador web",
    platform: "WEB",
    clientName: "Edge no Windows",
    createdAt: "2026-11-10T09:00:00-03:00",
    lastSeenAt: "2026-11-16T21:59:30-03:00",
    current: true,
    online: true,
  },
  {
    id: "phone",
    device: "Navegador web",
    platform: "ANDROID",
    clientName: "Android",
    createdAt: "2026-11-01T08:00:00-03:00",
    lastSeenAt: "2026-11-16T21:58:00-03:00",
    current: false,
    online: true,
  },
  {
    id: "pc",
    device: "Navegador web",
    platform: "DESKTOP",
    clientName: "Windows",
    createdAt: "2026-10-20T08:00:00-03:00",
    lastSeenAt: "2026-11-16T19:00:00-03:00",
    current: false,
    online: false,
  },
  {
    id: "old",
    device: "Navegador web",
    createdAt: "2026-09-01T08:00:00-03:00",
  },
];

test("shows where each session runs, which is this device and which are online", () => {
  const onRevoke = vi.fn();
  render(<SessionList sessions={sessions} onRevoke={onRevoke} now={now} />);
  const items = screen.getAllByRole("listitem");

  const here = within(items[0]);
  expect(here.getByText("Navegador")).toBeTruthy();
  expect(here.getByText("Edge no Windows")).toBeTruthy();
  expect(here.getByText("Este aparelho")).toBeTruthy();
  expect(here.getByText("Ativa agora")).toBeTruthy();
  expect(here.queryByRole("button")).toBeNull();

  const phone = within(items[1]);
  expect(phone.getByText("App Android")).toBeTruthy();
  expect(phone.getByText("Ativa agora")).toBeTruthy();
  expect(phone.getByText(/Login em 01\/11\/2026/)).toBeTruthy();

  const pc = within(items[2]);
  expect(pc.getByText("App desktop")).toBeTruthy();
  expect(pc.getByText("Último acesso há 3 horas")).toBeTruthy();

  const old = within(items[3]);
  expect(old.getByText("Navegador web")).toBeTruthy();
  expect(old.getByText(/Último acesso/)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Revogar App Android" }));
  expect(onRevoke).toHaveBeenCalledWith("phone");
});

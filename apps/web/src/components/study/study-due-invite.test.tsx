import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StudyDueInvite } from "./study-due-invite";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api }));
vi.mock("../navigation-link", () => ({
  NavigationLink: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
}));

const due = {
  id: "s1",
  subjectId: "calc",
  subjectName: "Cálculo I",
  startsAt: new Date(Date.now() + 8 * 60000).toISOString(),
  minutes: 45,
  goal: "Limites laterais",
  status: "PLANNED",
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
  };
});
beforeEach(() => {
  api.mockReset();
  sessionStorage.clear();
});
afterEach(cleanup);

it("invites the student into a session that is about to start", async () => {
  api.mockResolvedValue([due]);
  render(<StudyDueInvite />);
  expect(await screen.findByRole("heading", { name: "Cálculo I" }, { timeout: 4000 })).toBeInTheDocument();
  expect(screen.getByText(/em 8 min · 45 min/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ir para a sala" })).toHaveAttribute("href", "/study/s1");
});

it("giving up skips the session and closes the invitation", async () => {
  api.mockImplementation((path: string) => Promise.resolve(path.endsWith("/due") ? [due] : {}));
  render(<StudyDueInvite />);
  await screen.findByRole("heading", { name: "Cálculo I" }, { timeout: 4000 });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: /desistir de estudar agora/i })));
  expect(api).toHaveBeenCalledWith("/study/sessions/s1/skip", { method: "POST" });
  expect(screen.queryByRole("heading", { name: "Cálculo I" })).not.toBeInTheDocument();
});

it("later hides it for this visit, and a failing check shows nothing", { timeout: 15000 }, async () => {
  api.mockResolvedValue([due]);
  const { unmount } = render(<StudyDueInvite />);
  await screen.findByRole("heading", { name: "Cálculo I" }, { timeout: 4000 });
  fireEvent.click(screen.getByRole("button", { name: /lembrar em 10 min/i }));
  expect(screen.queryByRole("heading", { name: "Cálculo I" })).not.toBeInTheDocument();
  unmount();
  render(<StudyDueInvite />);
  await act(() => new Promise((resolve) => setTimeout(resolve, 1500)));
  expect(screen.queryByRole("heading", { name: "Cálculo I" })).not.toBeInTheDocument();

  cleanup();
  sessionStorage.clear();
  api.mockRejectedValue(new Error("offline"));
  render(<StudyDueInvite />);
  await act(() => new Promise((resolve) => setTimeout(resolve, 1500)));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

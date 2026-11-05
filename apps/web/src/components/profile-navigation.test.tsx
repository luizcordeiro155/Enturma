import "@testing-library/jest-dom/vitest";
import type { ComponentProps, ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { UserIdentity } from "./user-identity";
import { ConfirmedLink } from "./forum-links";
import { api } from "@/lib/api";
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({
  default: ({
    href,
    onNavigate,
    children,
    ...rest
  }: ComponentProps<"a"> & {
    href: string;
    onNavigate?: (event: { preventDefault: () => void }) => void;
  }) => (
    <a
      {...rest}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onNavigate?.({ preventDefault: () => {} });
      }}
    >
      {children}
    </a>
  ),
}));
vi.mock("@/lib/api", () => ({ api: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/live-updates", () => ({ useLiveRefresh: vi.fn() }));
vi.mock("./profile-motion", () => ({
  ProfileBackdrop: () => null,
  profileEntrance: () => undefined,
}));
vi.mock("./room-join-dialog", () => ({
  RoomJoinDialog: ({ code }: { code: string }) => (
    <div role="dialog" aria-label="Convite da sala">Convite {code}</div>
  ),
}));
vi.mock("./profile-visual-surface", () => ({
  ProfileVisualSurface: ({ actions }: { actions: ReactNode }) => (
    <div>
      <ConfirmedLink href="https://example.org/projeto" label="Site pessoal ↗" />
      {actions}
    </div>
  ),
}));
beforeEach(() => {
  history.replaceState({}, "", "/home");
  document.documentElement.dataset.reducedMotion = "true";
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.mocked(api).mockImplementation(async (path) =>
    path.endsWith("showcase")
      ? ({ appearance: {}, widgets: [] } as never)
      : ({ id: "me", name: "Estudante" } as never),
  );
});
afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.reducedMotion;
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it("removes the profile overlay history entry before navigating to the editor", async () => {
  push.mockImplementation(() =>
    expect(history.state?.enturmaOverlay).toBeUndefined(),
  );
  render(<UserIdentity user={{ id: "me", name: "Estudante" }} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Ver perfil de Estudante" }),
  );
  await waitFor(() => expect(history.state?.enturmaOverlay).toBeTruthy());
  fireEvent.click(screen.getByRole("link", { name: "Editar perfil" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/profile"));
  expect(screen.queryByRole("dialog")).toBeNull();
});

// Regression: the profile's global outside-pointer handler must not treat
// the portaled external-link warning as an outside click.
it("keeps the external-link warning open when consent is checked inside a user profile", async () => {
  render(<UserIdentity user={{ id: "me", name: "Estudante" }} />);
  fireEvent.click(screen.getByRole("button", { name: "Ver perfil de Estudante" }));
  const website = await screen.findByRole("link", { name: "Site pessoal ↗" });
  fireEvent.click(website);
  const warning = await screen.findByRole("dialog", { name: "Você está saindo do Enturma" });
  const consent = within(warning).getByLabelText(
    "Entendo que vou acessar um site externo e aceito continuar.",
  );
  await act(async () => {
    fireEvent.pointerDown(consent);
    fireEvent.click(consent);
    await Promise.resolve();
  });
  expect(warning).toBeInTheDocument();
  expect(consent).toBeChecked();
  expect(within(warning).getByRole("button", { name: /Abrir link/ })).toBeEnabled();
  expect(screen.getByRole("dialog", { name: "Perfil de Estudante" })).toBeInTheDocument();
});

it("opens an accepted web link in a new tab instead of dismissing it on checkbox change", async () => {
  const open = vi.fn();
  vi.stubGlobal("open", open);
  render(<ConfirmedLink href="https://example.org/estudo" label="Material externo" />);
  fireEvent.click(screen.getByRole("link", { name: "Material externo" }));
  const warning = screen.getByRole("dialog", {
    name: "Você está saindo do Enturma",
  });
  const consent = within(warning).getByLabelText(
    "Entendo que vou acessar um site externo e aceito continuar.",
  );
  expect(within(warning).getByRole("button", { name: /Abrir link/ })).toBeDisabled();
  fireEvent.click(consent);
  expect(warning).toBeInTheDocument();
  expect(consent).toBeChecked();
  fireEvent.click(within(warning).getByRole("button", { name: /Abrir link/ }));
  expect(open).toHaveBeenCalledWith(
    "https://example.org/estudo",
    "_blank",
    "noopener,noreferrer",
  );
  expect(screen.queryByRole("dialog", { name: "Você está saindo do Enturma" })).toBeNull();
});

it("keeps internal Enturma pages in the same window without a warning", () => {
  render(<ConfirmedLink href={location.origin + "/forum"} label="Abrir fórum" />);
  fireEvent.click(screen.getByRole("link", { name: "Abrir fórum" }));
  expect(screen.queryByRole("dialog", { name: "Você está saindo do Enturma" })).toBeNull();
});

it("shows the internal room invitation instead of an external warning or tab", () => {
  const open = vi.fn();
  vi.stubGlobal("open", open);
  render(
    <ConfirmedLink
      href="https://enturma-flax.vercel.app/join/ABCD2345"
      label="Convite da sala"
    />,
  );
  fireEvent.click(screen.getByRole("link", { name: "Convite da sala" }));
  expect(screen.getByRole("dialog", { name: "Convite da sala" })).toBeInTheDocument();
  expect(screen.queryByRole("dialog", { name: "Você está saindo do Enturma" })).toBeNull();
  expect(open).not.toHaveBeenCalled();
});

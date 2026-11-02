import type { ComponentProps, ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { UserIdentity } from "./user-identity";
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
vi.mock("./profile-visual-surface", () => ({
  ProfileVisualSurface: ({ actions }: { actions: ReactNode }) => (
    <div>{actions}</div>
  ),
}));
beforeEach(() => {
  history.replaceState({}, "", "/home");
  vi.mocked(api).mockImplementation(async (path) =>
    path.endsWith("showcase")
      ? ({ appearance: {}, widgets: [] } as never)
      : ({ id: "me", name: "Estudante" } as never),
  );
});
afterEach(() => {
  cleanup();
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

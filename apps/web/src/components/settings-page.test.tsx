import "@testing-library/jest-dom/vitest";
import type { ComponentProps, ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api, post } from "@/lib/api";
import { ProfileView } from "./profile";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: ComponentProps<"a"> & { href: string }) => (
    <a {...rest} href={href}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/api", () => ({ api: vi.fn(), post: vi.fn(), peekApiSnapshot: () => undefined }));
vi.mock("@/lib/visitor-context", () => ({ useVisitor: () => ({ requestLogin: vi.fn() }) }));
vi.mock("./app-shell-state", () => ({
  useAppShellState: () => ({ profileShortcut: { id: "me", hasAvatar: true, version: 7 } }),
}));
vi.mock("./shell", () => ({ Shell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("./app-help", () => ({ AppHelp: () => <section>Ajuda por IA</section> }));
vi.mock("./desktop-updates", () => ({ AppUpdateSettingsCard: () => <section>Atualização do aplicativo</section> }));
vi.mock("./community-feedback", () => ({
  NotificationPreferences: () => <section>Como você recebe novidades</section>,
}));
vi.mock("./focus-mode", () => ({ FocusModeSettings: () => <section id="modo-foco">Modo foco</section> }));
vi.mock("./account-privacy-card", () => ({
  AccountPrivacyCard: () => <section id="privacidade">Privacidade e controle dos seus dados</section>,
}));

const profile = {
  id: "me",
  name: "Luiz",
  username: "luiz",
  email: "luiz@example.test",
  emailVerified: true,
  hasAvatar: true,
  role: "ADMIN",
  enrollment: { periodName: "Fundamental · semestres 1–2" },
  subjects: [
    { id: "s1", name: "Algoritmos e programação", sourceName: "UNA", sourceUrl: "https://example.org/una" },
    { id: "s2", name: "Matemática computacional", sourceName: "UNA", sourceUrl: "https://example.org/una" },
  ],
};

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.mocked(api).mockImplementation(async (path: string, init?: RequestInit) => {
    if (path === "/users/me") return profile as never;
    if (path === "/auth/sessions")
      return [{ id: "sess-1", device: "Windows · Enturma Desktop", createdAt: "2026-11-16T12:00:00Z" }] as never;
    if (path === "/auth/sessions/sess-1" && init?.method === "DELETE") return undefined as never;
    return undefined as never;
  });
  vi.mocked(post).mockResolvedValue(undefined as never);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("organizes every settings feature into navigable sections", async () => {
  render(<ProfileView settings />);
  const nav = await screen.findByRole("navigation", { name: "Seções das configurações" });
  for (const label of ["Conta", "Matérias", "Estudo", "Notificações", "Ajuda e app", "Segurança", "Privacidade"])
    expect(within(nav).getByRole("link", { name: new RegExp(label) })).toBeInTheDocument();
  expect(within(nav).getByRole("link", { name: /Privacidade/ })).toHaveAttribute("href", "#privacidade");

  expect(await screen.findByText("@luiz")).toBeInTheDocument();
  expect(document.querySelector(".settings-avatar img")).toHaveAttribute(
    "src",
    "/api/backend/users/me/avatar?v=7",
  );
  expect(screen.getByText("luiz@example.test")).toBeInTheDocument();
  expect(screen.getByText("Confirmado")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Atualizar perfil acadêmico/ })).toHaveAttribute("href", "/onboarding");
  expect(screen.getByRole("link", { name: "Algoritmos e programação" })).toHaveAttribute("href", "/subjects/s1");
  expect(screen.getAllByRole("link", { name: /Estudar/ })).toHaveLength(2);
  for (const text of [
    "Ajuda por IA",
    "Atualização do aplicativo",
    "Como você recebe novidades",
    "Modo foco",
    "Privacidade e controle dos seus dados",
  ])
    expect(screen.getByText(text)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Redefinir minha senha/ })).toHaveAttribute("href", "/forgot-password");
  expect(screen.getByRole("link", { name: /Administrar catálogo/ })).toHaveAttribute("href", "/admin");
});

it("still revokes sessions and signs out", async () => {
  render(<ProfileView settings />);
  expect(await screen.findByText("Windows · Enturma Desktop")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Revogar/ }));
  await waitFor(() => expect(screen.queryByText("Windows · Enturma Desktop")).not.toBeInTheDocument());
  expect(api).toHaveBeenCalledWith("/auth/sessions/sess-1", { method: "DELETE" });

  fireEvent.click(screen.getByRole("button", { name: /Sair da conta/ }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  expect(post).toHaveBeenCalledWith("/auth/logout");
});

import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { ConnectedAccounts } from "./connected-accounts";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));

let state: {
  passwordSet: boolean;
  emailVerified: boolean;
  identities: { provider: string; login: string; createdAt: string }[];
};
let providers: Record<string, { enabled: boolean }>;

beforeEach(() => {
  window.history.replaceState(null, "", "/settings");
  providers = { google: { enabled: true }, github: { enabled: true } };
  state = { passwordSet: true, emailVerified: true, identities: [] };
  vi.mocked(api).mockImplementation(
    async (path: string, init?: RequestInit) => {
      if (path === "/public/auth/providers") return providers as never;
      if (init?.method === "DELETE") {
        const provider = path.split("/").pop()!.toUpperCase();
        state = {
          ...state,
          identities: state.identities.filter((i) => i.provider !== provider),
        };
      }
      return structuredClone(state) as never;
    },
  );
});
afterEach(cleanup);

it("oferece conectar o Google a uma conta que entra com senha", async () => {
  render(<ConnectedAccounts />);
  const google = await screen.findByRole("listitem", { name: "Google" });
  expect(within(google).getByText("Não conectada")).toBeInTheDocument();
  expect(
    await within(google).findByRole("link", { name: "Conectar" }),
  ).toHaveAttribute("href", "/api/oauth/google/start?intent=link");
});

it("mostra qual conta Google está conectada e desconecta", async () => {
  state.identities = [
    {
      provider: "GOOGLE",
      login: "ana@gmail.test",
      createdAt: "2026-11-20T10:00:00Z",
    },
  ];
  render(<ConnectedAccounts />);
  const google = await screen.findByRole("listitem", { name: "Google" });
  expect(within(google).getByText("ana@gmail.test")).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(
      within(google).getByRole("button", { name: "Desconectar Google" }),
    ),
  );
  expect(api).toHaveBeenCalledWith("/auth/identities/google", {
    method: "DELETE",
  });
  expect(within(google).getByText("Não conectada")).toBeInTheDocument();
});

it("não deixa tirar o Google de uma conta sem senha, e diz como criar uma", async () => {
  state = {
    passwordSet: false,
    emailVerified: true,
    identities: [
      {
        provider: "GOOGLE",
        login: "ana@gmail.test",
        createdAt: "2026-11-20T10:00:00Z",
      },
    ],
  };
  render(<ConnectedAccounts />);
  const google = await screen.findByRole("listitem", { name: "Google" });
  expect(
    within(google).getByRole("button", { name: "Desconectar Google" }),
  ).toBeDisabled();
  expect(
    screen.getByText(/Sua conta entra só com o Google/),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Criar uma senha" })).toHaveAttribute(
    "href",
    "/forgot-password",
  );
});

it("o GitHub é conectado pelo portfólio e pode ser desconectado aqui", async () => {
  render(<ConnectedAccounts />);
  const github = await screen.findByRole("listitem", { name: "GitHub" });
  expect(
    within(github).getByRole("link", { name: "Conectar no portfólio" }),
  ).toHaveAttribute("href", "/portfolio");
  cleanup();
  state.identities = [
    { provider: "GITHUB", login: "ana-dev", createdAt: "2026-11-20T10:00:00Z" },
  ];
  render(<ConnectedAccounts />);
  const connected = await screen.findByRole("listitem", { name: "GitHub" });
  expect(within(connected).getByText("@ana-dev")).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(
      within(connected).getByRole("button", { name: "Desconectar GitHub" }),
    ),
  );
  expect(api).toHaveBeenCalledWith("/auth/identities/github", {
    method: "DELETE",
  });
});

it("conta o resultado da volta do Google e limpa o endereço", async () => {
  window.history.replaceState(null, "", "/settings?conta=google#seguranca");
  render(<ConnectedAccounts />);
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Conta Google conectada.",
  );
  expect(window.location.search).toBe("");
  cleanup();
  window.history.replaceState(null, "", "/settings?conta=IDENTITY_IN_USE");
  render(<ConnectedAccounts />);
  expect(await screen.findByRole("alert")).toHaveTextContent(/outro perfil/);
});

it("sem o Google configurado, não oferece conectar", async () => {
  providers = { google: { enabled: false }, github: { enabled: false } };
  render(<ConnectedAccounts />);
  const google = await screen.findByRole("listitem", { name: "Google" });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(
    within(google).queryByRole("link", { name: "Conectar" }),
  ).not.toBeInTheDocument();
});

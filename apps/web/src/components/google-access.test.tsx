import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AuthForm } from "./auth-form";
import { api } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({ api: vi.fn(), post: vi.fn() }));
const leaveTo = vi.hoisted(() => vi.fn());
vi.mock("@/lib/leave", () => ({ leaveTo }));
// the sign-in film needs a real browser; these tests are about the form
vi.mock("./motion/auth-player", () => ({ default: () => null }));

const agent = (value: string) =>
  Object.defineProperty(window.navigator, "userAgent", {
    value,
    configurable: true,
  });
const BROWSER = "Mozilla/5.0 (X11; Linux x86_64) Chrome/140.0 Safari/537.36";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      media,
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  agent(BROWSER);
  window.history.replaceState(null, "", "/login");
  vi.mocked(api).mockImplementation(async (path: string) => {
    if (path === "/public/auth/providers")
      return { google: { enabled: true }, github: { enabled: true } } as never;
    throw new Error("inesperado");
  });
});
afterEach(() => {
  cleanup();
  leaveTo.mockReset();
  localStorage.clear();
  vi.unstubAllGlobals();
});

it("no login, o Google leva a pessoa de volta para onde ela ia", async () => {
  window.history.replaceState(null, "", "/login?next=%2Fportfolio");
  render(<AuthForm mode="login" />);
  const google = await screen.findByRole("link", {
    name: "Continuar com o Google",
  });
  expect(google).toHaveAttribute(
    "href",
    "/api/oauth/google/start?intent=login&remember=1&next=%2Fportfolio",
  );
  // "manter conectado" vale para o Google também
  fireEvent.click(screen.getByLabelText("Manter conectado"));
  expect(google.getAttribute("href")).toContain("remember=0");
});

it("no cadastro, o Google só segue depois de aceitar os termos", async () => {
  window.history.replaceState(null, "", "/register");
  render(<AuthForm mode="register" />);
  const google = await screen.findByRole("link", {
    name: "Criar conta com o Google",
  });
  expect(google).toHaveAttribute(
    "href",
    "/api/oauth/google/start?intent=signup&terms=1",
  );
  const blocked = fireEvent.click(google);
  expect(blocked).toBe(false);
  expect(
    await screen.findByText(/aceite os Termos e a Política de Privacidade/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: /Li e aceito/ }));
  // com os termos aceitos o navegador segue o link
  expect(fireEvent.click(google)).toBe(true);
});

it("sem o Google configurado no servidor, o botão não aparece", async () => {
  vi.mocked(api).mockResolvedValue({
    google: { enabled: false },
    github: { enabled: false },
  } as never);
  render(<AuthForm mode="login" />);
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith("/public/auth/providers"),
  );
  expect(
    screen.queryByRole("link", { name: /Google/ }),
  ).not.toBeInTheDocument();
});

it("dentro dos apps de Android e Windows, o Google abre no navegador do aparelho", async () => {
  agent(BROWSER + " EnturmaMobile/1.4.0");
  const fetcher = vi.fn(async () =>
    Response.json({
      url: "https://accounts.google.com/o/oauth2/v2/auth?state=s.a",
    }),
  );
  vi.stubGlobal("fetch", fetcher);
  render(<AuthForm mode="login" />);
  const google = await screen.findByRole("link", {
    name: "Continuar com o Google",
  });
  // the app keeps its page; it does not follow the link inside its own window
  expect(fireEvent.click(google)).toBe(false);
  await waitFor(() =>
    expect(leaveTo).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/v2/auth?state=s.a",
    ),
  );
  expect(fetcher).toHaveBeenCalledWith(
    "/api/oauth/google/start?intent=login&remember=1&next=%2Fhome&mode=json",
    expect.objectContaining({ credentials: "same-origin" }),
  );
});

it("explica quando a volta do Google não deu certo", async () => {
  window.history.replaceState(null, "", "/login?oauth=GOOGLE_EMAIL_UNVERIFIED");
  render(<AuthForm mode="login" />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Confirme o e-mail da sua conta Google",
  );
});

it("quem chega do Google sem conta é convidado a aceitar os termos e continuar", async () => {
  window.history.replaceState(null, "", "/register?google=terms");
  render(<AuthForm mode="register" />);
  expect(await screen.findByRole("status")).toHaveTextContent(
    /Ainda não há conta com esse Google/,
  );
});

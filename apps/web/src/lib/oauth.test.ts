import { describe, expect, it } from "vitest";
import {
  appOfState,
  appReturnLink,
  authorizeUrl,
  begin,
  intentFor,
  isProvider,
  oauthMessage,
  outcome,
  readPending,
  sameState,
  writePending,
} from "./oauth";

describe("começo do acesso por Google e GitHub", () => {
  it("aceita só os provedores e as intenções que cada um tem", () => {
    expect(isProvider("google")).toBe(true);
    expect(isProvider("github")).toBe(true);
    expect(isProvider("facebook")).toBe(false);
    expect(intentFor("google", "login")).toBe("login");
    expect(intentFor("google", "signup")).toBe("signup");
    expect(intentFor("google", "link")).toBe("link");
    expect(intentFor("google", null)).toBe("login");
    // o GitHub só conecta ao portfólio: não é uma forma de entrar
    expect(intentFor("github", "login")).toBe("connect");
    expect(intentFor("google", "connect")).toBeNull();
  });

  it("gera um estado e um verificador novos a cada pedido", () => {
    const one = begin("google", "login", {});
    const two = begin("google", "login", {});
    expect(one.state).not.toBe(two.state);
    expect(one.state.length).toBeGreaterThanOrEqual(32);
    expect(one.verifier.length).toBeGreaterThanOrEqual(43);
  });

  it("só guarda destinos dentro do próprio Enturma", () => {
    expect(begin("google", "login", { next: "/portfolio" }).next).toBe(
      "/portfolio",
    );
    expect(begin("google", "login", { next: "https://mal.example" }).next).toBe(
      "/home",
    );
    expect(begin("google", "login", { next: "//mal.example" }).next).toBe(
      "/home",
    );
  });

  it("manda ao Google o desafio, nunca o verificador", () => {
    const pending = begin("google", "signup", { terms: true });
    const url = new URL(
      authorizeUrl(pending, {
        clientId: "abc.apps.googleusercontent.com",
        redirectUri: "https://enturma.example/api/oauth/google/callback",
      }),
    );
    expect(url.origin + url.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(url.searchParams.get("client_id")).toBe(
      "abc.apps.googleusercontent.com",
    );
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://enturma.example/api/oauth/google/callback",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("state")).toBe(pending.state);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toMatch(
      /^[A-Za-z0-9_-]{43}$/,
    );
    expect(url.toString()).not.toContain(pending.verifier);
  });

  it("marca no estado o pedido que nasceu dentro de um dos apps", () => {
    expect(begin("google", "login", {}).state).not.toContain(".");
    const android = begin("google", "login", { app: "android" });
    const desktop = begin("github", "connect", { app: "desktop" });
    expect(appOfState(android.state)).toBe("android");
    expect(appOfState(desktop.state)).toBe("desktop");
    expect(appOfState(begin("google", "login", {}).state)).toBeNull();
    expect(appOfState(null)).toBeNull();
    expect(appOfState("qualquer.x")).toBeNull();
  });

  it("monta o link que devolve a pessoa ao app, no formato que cada app entende", () => {
    // Android lê só o caminho; o Windows junta o "host" ao caminho
    expect(appReturnLink("android", "google", "c/1", "s.a")).toBe(
      "enturma://app/api/oauth/google/callback?code=c%2F1&state=s.a",
    );
    expect(appReturnLink("desktop", "github", "c 2", "s.d")).toBe(
      "enturma://api/oauth/github/callback?code=c+2&state=s.d",
    );
  });

  it("pede ao GitHub só a identidade pública, sem permissão sobre repositórios", () => {
    const pending = begin("github", "connect", {});
    const url = new URL(
      authorizeUrl(pending, {
        clientId: "Iv1.abc",
        redirectUri: "https://enturma.example/api/oauth/github/callback",
      }),
    );
    expect(url.origin + url.pathname).toBe(
      "https://github.com/login/oauth/authorize",
    );
    expect(url.searchParams.get("state")).toBe(pending.state);
    expect(url.searchParams.has("scope")).toBe(false);
    // o código só serve a quem guarda o verificador, também no GitHub
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toMatch(
      /^[A-Za-z0-9_-]{43}$/,
    );
  });

  it("lê de volta o pedido guardado e recusa o que foi adulterado", () => {
    const pending = begin("google", "login", {
      next: "/social",
      remember: false,
    });
    expect(readPending(writePending(pending))).toEqual(pending);
    expect(readPending(undefined)).toBeNull();
    expect(readPending("não é um pedido")).toBeNull();
    expect(
      readPending(Buffer.from('{"provider":"x"}').toString("base64url")),
    ).toBeNull();
  });

  it("compara o estado por inteiro", () => {
    expect(sameState("abc", "abc")).toBe(true);
    expect(sameState("abc", "abd")).toBe(false);
    expect(sameState("abc", "abcd")).toBe(false);
    expect(sameState("abc", null)).toBe(false);
  });
});

describe("para onde a pessoa volta", () => {
  it("conta nova segue para a verificação acadêmica; conta existente, para onde ia", () => {
    const pending = begin("google", "login", { next: "/social" });
    expect(outcome(pending, { ok: true, created: true })).toBe(
      "/academic-verification?next=%2Fonboarding",
    );
    expect(outcome(pending, { ok: true })).toBe("/social");
  });

  it("sem aceitar os termos, volta ao cadastro para aceitar", () => {
    const pending = begin("google", "login", {});
    expect(
      outcome(pending, { ok: false, code: "GOOGLE_SIGNUP_NEEDS_TERMS" }),
    ).toBe("/register?google=terms");
    expect(outcome(pending, { ok: false, code: "PROVIDER_FAILED" })).toBe(
      "/login?oauth=PROVIDER_FAILED",
    );
  });

  it("vincular e conectar voltam para a tela de onde saíram", () => {
    expect(outcome(begin("google", "link", {}), { ok: true })).toBe(
      "/settings?conta=google",
    );
    expect(
      outcome(begin("google", "link", {}), {
        ok: false,
        code: "IDENTITY_IN_USE",
      }),
    ).toBe("/settings?conta=IDENTITY_IN_USE");
    expect(outcome(begin("github", "connect", {}), { ok: true })).toBe(
      "/portfolio?github=ok",
    );
    expect(
      outcome(begin("github", "connect", {}), { ok: false, code: "cancelled" }),
    ).toBe("/portfolio?github=cancelled");
  });

  it("explica cada volta em palavras de gente", () => {
    expect(oauthMessage("cancelled")).toMatch(/cancel/i);
    expect(oauthMessage("IDENTITY_IN_USE")).toMatch(/outro perfil/);
    expect(oauthMessage("GOOGLE_EMAIL_UNVERIFIED")).toMatch(
      /Confirme o e-mail/,
    );
    expect(oauthMessage("qualquer-coisa")).toMatch(/Tente de novo/);
    expect(oauthMessage(null)).toBe("");
  });
});

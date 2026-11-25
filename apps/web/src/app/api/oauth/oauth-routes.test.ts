// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as start } from "./[provider]/start/route";
import { GET as callback } from "./[provider]/callback/route";
import { OAUTH_COOKIE, readPending } from "@/lib/oauth";

const ORIGIN = "https://enturma.example";
const params = (provider: string) => ({
  params: Promise.resolve({ provider }),
});
const BROWSER = "Mozilla/5.0 (Windows NT 10.0) Chrome/140.0 Safari/537.36";
const request = (
  path: string,
  cookies: Record<string, string> = {},
  agent = BROWSER,
) =>
  new NextRequest(ORIGIN + path, {
    headers: {
      cookie: Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join("; "),
      "user-agent": agent,
    },
  });
const cookie = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((line) => line.startsWith(name + "="))
    ?.split(";")[0]
    .slice(name.length + 1);
const location = (response: Response) => response.headers.get("location") ?? "";

type Call = {
  url: string;
  body: Record<string, unknown>;
  authorization: string | null;
};
let calls: Call[];
let answers: Record<string, { status: number; body: unknown }>;

beforeEach(() => {
  vi.stubEnv("API_URL", "http://api.internal");
  calls = [];
  answers = {
    "/api/v1/public/auth/providers": {
      status: 200,
      body: {
        google: {
          enabled: true,
          clientId: "g-id",
          redirectUri: ORIGIN + "/api/oauth/google/callback",
        },
        github: {
          enabled: true,
          clientId: "gh-id",
          redirectUri: ORIGIN + "/api/oauth/github/callback",
        },
      },
    },
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push({
        url: url.pathname,
        body: init?.body ? JSON.parse(String(init.body)) : {},
        authorization: new Headers(init?.headers).get("authorization"),
      });
      const answer = answers[url.pathname] ?? { status: 500, body: {} };
      return new Response(JSON.stringify(answer.body), {
        status: answer.status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

/** Goes to the provider and returns what the browser now holds. */
async function began(path: string, cookies: Record<string, string> = {}) {
  const response = await start(
    request(path, cookies),
    params(path.split("/")[3]),
  );
  const stored = cookie(response, OAUTH_COOKIE)!;
  return { response, stored, pending: readPending(stored)! };
}

describe("ida ao provedor", () => {
  it("manda ao Google com o estado guardado só no navegador de quem pediu", async () => {
    const { response, pending } = await began(
      "/api/oauth/google/start?intent=login&next=%2Fsocial&remember=0",
    );
    const target = new URL(location(response));
    expect(target.hostname).toBe("accounts.google.com");
    expect(target.searchParams.get("state")).toBe(pending.state);
    expect(target.searchParams.get("client_id")).toBe("g-id");
    expect(pending).toMatchObject({
      intent: "login",
      next: "/social",
      remember: false,
    });
    const line = response.headers
      .getSetCookie()
      .find((c) => c.startsWith(OAUTH_COOKIE))!;
    expect(line).toMatch(/HttpOnly/i);
    expect(line).toMatch(/Path=\/api\/oauth/i);
    expect(line).toMatch(/SameSite=lax/i);
  });

  it("sem o provedor configurado, volta ao login explicando", async () => {
    answers["/api/v1/public/auth/providers"].body = {
      google: { enabled: false },
    };
    const response = await start(
      request("/api/oauth/google/start"),
      params("google"),
    );
    expect(location(response)).toBe(ORIGIN + "/login?oauth=unavailable");
  });

  it("conectar ou vincular exige alguém com sessão", async () => {
    const response = await start(
      request("/api/oauth/github/start"),
      params("github"),
    );
    expect(location(response)).toBe(ORIGIN + "/login?next=%2Fportfolio");
    expect(calls).toHaveLength(0);
  });

  it("recusa provedores que não existem", async () => {
    const response = await start(
      request("/api/oauth/outro/start"),
      params("outro"),
    );
    expect(location(response)).toBe(ORIGIN + "/login");
  });
});

describe("volta do provedor", () => {
  it("troca o código por uma sessão e leva a pessoa para onde ela ia", async () => {
    const { stored, pending } = await began(
      "/api/oauth/google/start?intent=login&next=%2Fsocial",
    );
    answers["/api/v1/auth/google"] = {
      status: 200,
      body: {
        accessToken: "acc",
        refreshToken: "ref",
        expiresIn: 600,
        userId: "u1",
        created: false,
      },
    };
    const response = await callback(
      request(
        `/api/oauth/google/callback?code=the-code&state=${pending.state}`,
        {
          [OAUTH_COOKIE]: stored,
        },
      ),
      params("google"),
    );
    expect(location(response)).toBe(ORIGIN + "/social");
    expect(cookie(response, "enturma_access")).toBe("acc");
    expect(cookie(response, "enturma_refresh")).toBe("ref");
    expect(cookie(response, "enturma_remember")).toBe("1");
    // the pending request is spent
    expect(cookie(response, OAUTH_COOKIE)).toBe("");
    const sent = calls.find((c) => c.url === "/api/v1/auth/google")!;
    expect(sent.body).toMatchObject({
      code: "the-code",
      codeVerifier: pending.verifier,
      acceptedTerms: false,
      device: "Chrome no Windows",
    });
    // the tokens never appear in the address
    expect(location(response)).not.toContain("acc");
  });

  it("conta criada agora segue para a verificação acadêmica, com os termos aceitos no cadastro", async () => {
    const { stored, pending } = await began(
      "/api/oauth/google/start?intent=signup&terms=1",
    );
    answers["/api/v1/auth/google"] = {
      status: 200,
      body: {
        accessToken: "acc",
        refreshToken: "ref",
        userId: "u1",
        created: true,
      },
    };
    const response = await callback(
      request(`/api/oauth/google/callback?code=c&state=${pending.state}`, {
        [OAUTH_COOKIE]: stored,
      }),
      params("google"),
    );
    expect(location(response)).toBe(
      ORIGIN + "/academic-verification?next=%2Fonboarding",
    );
    expect(
      calls.find((c) => c.url === "/api/v1/auth/google")!.body.acceptedTerms,
    ).toBe(true);
  });

  it("um estado que não é o deste navegador não troca código nenhum", async () => {
    const { stored } = await began("/api/oauth/google/start");
    calls = [];
    const response = await callback(
      request(
        "/api/oauth/google/callback?code=roubado&state=" + "x".repeat(43),
        {
          [OAUTH_COOKIE]: stored,
        },
      ),
      params("google"),
    );
    expect(location(response)).toBe(ORIGIN + "/login?oauth=state");
    expect(calls).toHaveLength(0);
    expect(cookie(response, "enturma_access")).toBeUndefined();
    // and with no pending request at all
    const bare = await callback(
      request("/api/oauth/google/callback?code=c&state=qualquer"),
      params("google"),
    );
    expect(location(bare)).toBe(ORIGIN + "/login?oauth=state");
  });

  it("o pedido de um provedor não vale na volta de outro", async () => {
    const { stored, pending } = await began("/api/oauth/google/start");
    calls = [];
    const response = await callback(
      request(`/api/oauth/github/callback?code=c&state=${pending.state}`, {
        [OAUTH_COOKIE]: stored,
        enturma_access: "acc",
      }),
      params("github"),
    );
    expect(location(response)).toBe(ORIGIN + "/portfolio?github=state");
    expect(calls).toHaveLength(0);
  });

  it("quem cancela no Google volta sem sessão e sem erro assustador", async () => {
    const { stored, pending } = await began("/api/oauth/google/start");
    const response = await callback(
      request(
        `/api/oauth/google/callback?error=access_denied&state=${pending.state}`,
        {
          [OAUTH_COOKIE]: stored,
        },
      ),
      params("google"),
    );
    expect(location(response)).toBe(ORIGIN + "/login?oauth=cancelled");
  });

  it("sem conta e sem termos aceitos, vai ao cadastro", async () => {
    const { stored, pending } = await began("/api/oauth/google/start");
    answers["/api/v1/auth/google"] = {
      status: 409,
      body: { code: "GOOGLE_SIGNUP_NEEDS_TERMS", message: "…" },
    };
    const response = await callback(
      request(`/api/oauth/google/callback?code=c&state=${pending.state}`, {
        [OAUTH_COOKIE]: stored,
      }),
      params("google"),
    );
    expect(location(response)).toBe(ORIGIN + "/register?google=terms");
  });

  it("conecta o GitHub à conta de quem está com sessão", async () => {
    const session = { enturma_access: "acc" };
    const { stored, pending } = await began("/api/oauth/github/start", session);
    answers["/api/v1/auth/github/connect"] = {
      status: 200,
      body: { identities: [] },
    };
    const response = await callback(
      request(`/api/oauth/github/callback?code=gh&state=${pending.state}`, {
        ...session,
        [OAUTH_COOKIE]: stored,
      }),
      params("github"),
    );
    expect(location(response)).toBe(ORIGIN + "/portfolio?github=ok");
    const sent = calls.find((c) => c.url === "/api/v1/auth/github/connect")!;
    expect(sent.authorization).toBe("Bearer acc");
    expect(sent.body.code).toBe("gh");
  });

  it("vincula o Google renovando a sessão que venceu enquanto a pessoa estava fora", async () => {
    const session = { enturma_refresh: "old-ref" };
    const { stored, pending } = await began(
      "/api/oauth/google/start?intent=link",
      session,
    );
    answers["/api/v1/auth/refresh"] = {
      status: 200,
      body: { accessToken: "new-acc", refreshToken: "new-ref", userId: "u1" },
    };
    answers["/api/v1/auth/google/link"] = {
      status: 409,
      body: { code: "IDENTITY_IN_USE", message: "…" },
    };
    const response = await callback(
      request(`/api/oauth/google/callback?code=g&state=${pending.state}`, {
        ...session,
        [OAUTH_COOKIE]: stored,
      }),
      params("google"),
    );
    expect(location(response)).toBe(ORIGIN + "/settings?conta=IDENTITY_IN_USE");
    expect(
      calls.find((c) => c.url === "/api/v1/auth/google/link")!.authorization,
    ).toBe("Bearer new-acc");
    // the rotated pair is kept, or the person would be signed out
    expect(cookie(response, "enturma_access")).toBe("new-acc");
    expect(cookie(response, "enturma_refresh")).toBe("new-ref");
  });
});

describe("dentro dos apps de Android e Windows", () => {
  const ANDROID = BROWSER + " EnturmaMobile/1.4.0";

  it("o app pede o endereço do Google para abri-lo no navegador do aparelho", async () => {
    const response = await start(
      request("/api/oauth/google/start?intent=login&mode=json", {}, ANDROID),
      params("google"),
    );
    expect(response.status).toBe(200);
    const { url } = (await response.json()) as { url: string };
    const pending = readPending(cookie(response, OAUTH_COOKIE))!;
    expect(new URL(url).hostname).toBe("accounts.google.com");
    expect(new URL(url).searchParams.get("state")).toBe(pending.state);
    expect(pending.state.endsWith(".a")).toBe(true);
  });

  it("no navegador do aparelho, a volta entrega o código ao app em vez de abrir sessão ali", async () => {
    const begun = await start(
      request("/api/oauth/google/start?intent=login&mode=json", {}, ANDROID),
      params("google"),
    );
    const stored = cookie(begun, OAUTH_COOKIE)!;
    const pending = readPending(stored)!;
    calls = [];
    // the device browser has none of the app's cookies
    const outside = await callback(
      request(
        `/api/oauth/google/callback?code=the%22code&state=${pending.state}`,
      ),
      params("google"),
    );
    expect(outside.status).toBe(200);
    expect(outside.headers.get("content-type")).toContain("text/html");
    expect(outside.headers.get("cache-control")).toContain("no-store");
    const html = await outside.text();
    expect(html).toContain(
      `enturma://app/api/oauth/google/callback?code=the%22code&amp;state=${pending.state}`,
    );
    expect(html).not.toContain('the"code');
    expect(calls).toHaveLength(0);
    expect(cookie(outside, "enturma_access")).toBeUndefined();

    // back inside the app, where the pending request lives, the sign-in completes
    answers["/api/v1/auth/google"] = {
      status: 200,
      body: {
        accessToken: "acc",
        refreshToken: "ref",
        userId: "u1",
        created: false,
      },
    };
    const inside = await callback(
      request(
        `/api/oauth/google/callback?code=the%22code&state=${pending.state}`,
        { [OAUTH_COOKIE]: stored },
        ANDROID,
      ),
      params("google"),
    );
    expect(location(inside)).toBe(ORIGIN + "/home");
    expect(cookie(inside, "enturma_access")).toBe("acc");
  });

  it("um estado de app sem pedido guardado, dentro do próprio app, é só um erro", async () => {
    const response = await callback(
      request(
        "/api/oauth/google/callback?code=c&state=" + "x".repeat(43) + ".a",
        {},
        ANDROID,
      ),
      params("google"),
    );
    expect(location(response)).toBe(ORIGIN + "/login?oauth=state");
  });

  it("no Windows o link de volta usa o formato do app de computador", async () => {
    const response = await callback(
      request(
        "/api/oauth/github/callback?code=c&state=" + "y".repeat(43) + ".d",
      ),
      params("github"),
    );
    expect(await response.text()).toContain(
      "enturma://api/oauth/github/callback?code=c&amp;state=",
    );
  });
});

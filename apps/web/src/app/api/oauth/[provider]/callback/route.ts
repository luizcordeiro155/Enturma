import { NextRequest, NextResponse } from "next/server";
import {
  appLink,
  appOfState,
  appReturnLink,
  isProvider,
  nativeApp,
  OAUTH_COOKIE,
  outcome,
  readPending,
  sameState,
  type OAuthResult,
  type PendingOAuth,
} from "@/lib/oauth";
import {
  callApi,
  currentSession,
  oauthCookieOptions,
  type Session,
} from "@/lib/oauth-server";
import { describeClient } from "@/lib/session-client";
import { setSessionCookies } from "@/lib/session-cookies";

/** Where Google and GitHub send the person back. Nothing here is trusted until the state matches. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const query = req.nextUrl.searchParams;
  const pending = readPending(req.cookies.get(OAUTH_COOKIE)?.value);
  let session: Session | undefined;
  let remember = true;
  const finish = (path: string) => {
    const response = NextResponse.redirect(new URL(path, req.url));
    response.headers.set("Cache-Control", "private, no-store");
    // One request, one answer: the pending request never serves a second callback.
    response.cookies.set(OAUTH_COOKIE, "", oauthCookieOptions(0));
    if (session) setSessionCookies(req, response, session, remember);
    return response;
  };
  const matches =
    isProvider(provider) &&
    pending !== null &&
    pending.provider === provider &&
    sameState(pending.state, query.get("state"));
  // Started inside one of the apps and now in the device browser, which holds none of the app's
  // cookies: nothing is exchanged here. The answer goes back to the app, where the pending
  // request and its verifier are.
  const app = appOfState(query.get("state"));
  if (
    !matches &&
    isProvider(provider) &&
    app &&
    !nativeApp(req.headers.get("user-agent"))
  ) {
    const state = query.get("state")!;
    const code = query.get("code");
    return handOff(
      code && !query.has("error")
        ? appReturnLink(app, provider, code, state)
        : appLink(
            app,
            `/api/oauth/${provider}/callback?${new URLSearchParams({ error: "access_denied", state })}`,
          ),
    );
  }
  if (!matches || !pending || !isProvider(provider))
    return finish(
      pending && isProvider(provider) && pending.provider === provider
        ? outcome(pending, { ok: false, code: "state" })
        : provider === "github"
          ? "/portfolio?github=state"
          : "/login?oauth=state",
    );
  const code = query.get("code");
  // The person closed the consent page or refused it.
  if (query.has("error") || !code)
    return finish(outcome(pending, { ok: false, code: "cancelled" }));

  let result: OAuthResult;
  try {
    result = await complete(req, pending, code, (value, keep) => {
      session = value;
      remember = keep;
    });
  } catch {
    result = { ok: false, code: "failed" };
  }
  return finish(outcome(pending, result));
}

async function complete(
  req: NextRequest,
  pending: PendingOAuth,
  code: string,
  store: (session: Session, remember: boolean) => void,
): Promise<OAuthResult> {
  const failure = (answer: {
    status: number;
    payload: Record<string, unknown>;
  }) => ({
    ok: false as const,
    code:
      answer.status === 429
        ? "RATE_LIMITED"
        : typeof answer.payload.code === "string"
          ? answer.payload.code
          : "failed",
  });

  if (pending.intent === "login" || pending.intent === "signup") {
    const answer = await callApi(req, "auth/google", {
      code,
      codeVerifier: pending.verifier,
      device: describeClient(req.headers.get("user-agent")).name,
      acceptedTerms: pending.terms,
    });
    if (!answer.ok || typeof answer.payload.accessToken !== "string")
      return failure(answer);
    store(answer.payload as unknown as Session, pending.remember);
    return { ok: true, created: answer.payload.created === true };
  }

  const current = await currentSession(req);
  if (!current) return { ok: false, code: "session" };
  if (current.renewed)
    store(current.renewed, req.cookies.get("enturma_remember")?.value !== "0");
  const answer = await callApi(
    req,
    pending.intent === "link" ? "auth/google/link" : "auth/github/connect",
    { code, codeVerifier: pending.verifier },
    current.access,
  );
  return answer.ok ? { ok: true } : failure(answer);
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

/** A page in the device browser whose only job is to send the person back to the app. */
function handOff(link: string) {
  const href = escapeHtml(link);
  return new NextResponse(
    `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0;url=${href}">
<title>Voltar para o Enturma</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f5f7f4;color:#1b3a33}
  main{max-width:420px;text-align:center}
  h1{font-size:1.5rem;margin:0 0 8px}
  p{margin:0 0 20px;line-height:1.5;color:#4d635d}
  a{display:inline-block;padding:14px 22px;border-radius:12px;background:#214b41;color:#fff;
    font-weight:700;text-decoration:none}
  a:focus-visible{outline:3px solid #9bc53d;outline-offset:3px}
  @media (prefers-color-scheme:dark){body{background:#10201c;color:#e8f1ec}p{color:#a9bdb5}
    a{background:#d9f07a;color:#14302a}}
</style>
</head>
<body>
<main>
<h1>Quase lá</h1>
<p>Volte para o app do Enturma para terminar. Se ele não abrir sozinho, toque no botão.</p>
<a href="${href}">Voltar para o Enturma</a>
</main>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

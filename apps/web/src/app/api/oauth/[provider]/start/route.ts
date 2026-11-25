import { NextRequest, NextResponse } from "next/server";
import {
  authorizeUrl,
  begin,
  intentFor,
  isProvider,
  nativeApp,
  OAUTH_COOKIE,
  OAUTH_COOKIE_SECONDS,
  outcome,
  writePending,
} from "@/lib/oauth";
import { oauthCookieOptions, providerConfig } from "@/lib/oauth-server";

/** Sends the person to Google or GitHub, remembering what they asked for until they return. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const go = (path: string) => {
    const response = NextResponse.redirect(new URL(path, req.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  if (!isProvider(provider)) return go("/login");
  const query = req.nextUrl.searchParams;
  const intent = intentFor(provider, query.get("intent"));
  if (!intent) return go("/login");
  const pending = begin(provider, intent, {
    next: query.get("next"),
    terms: query.get("terms") === "1",
    remember: query.get("remember") !== "0",
    app: nativeApp(req.headers.get("user-agent")),
  });
  // The apps ask for the address and open it in the device browser themselves.
  const asJson = query.get("mode") === "json";
  // Linking and connecting change an account: there must be one signed in.
  if (
    (intent === "link" || intent === "connect") &&
    !req.cookies.has("enturma_access") &&
    !req.cookies.has("enturma_refresh")
  )
    return go(
      `/login?next=${encodeURIComponent(intent === "link" ? "/settings" : "/portfolio")}`,
    );
  const client = await providerConfig(provider);
  if (!client) {
    const back = outcome(pending, { ok: false, code: "unavailable" });
    if (!asJson) return go(back);
    const answer = NextResponse.json({ url: back });
    answer.headers.set("Cache-Control", "private, no-store");
    return answer;
  }
  const target = authorizeUrl(pending, client);
  const response = asJson
    ? NextResponse.json({ url: target })
    : NextResponse.redirect(target);
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set(
    OAUTH_COOKIE,
    writePending(pending),
    oauthCookieOptions(OAUTH_COOKIE_SECONDS),
  );
  return response;
}

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { authDestination } from "./auth-navigation";

// Server-only: the sign-in round trip with Google and GitHub.
export type OAuthProvider = "google" | "github";
export type OAuthIntent = "login" | "signup" | "link" | "connect";

/** Holds the pending request while the person is at the provider. HttpOnly, ten minutes. */
export const OAUTH_COOKIE = "enturma_oauth";
export const OAUTH_COOKIE_SECONDS = 600;

/** The Android and Windows apps: the provider opens in the device browser and hands back. */
export type NativeApp = "android" | "desktop";
const APP_MARK: Record<NativeApp, string> = { android: "a", desktop: "d" };

export function nativeApp(userAgent: string | null): NativeApp | null {
  const agent = userAgent ?? "";
  if (/EnturmaMobile\//.test(agent)) return "android";
  if (/EnturmaDesktop\//.test(agent)) return "desktop";
  return null;
}

/** Which app a request was started in, read from the mark at the end of its state. */
export function appOfState(state: string | null): NativeApp | null {
  const mark = /^[A-Za-z0-9_-]{32,}\.([ad])$/.exec(state ?? "")?.[1];
  return mark === "a" ? "android" : mark === "d" ? "desktop" : null;
}

/**
 * A link that opens `path` of the site inside the app. Android reads only the path of an
 * `enturma://` link; the Windows app joins the host to the path.
 */
export function appLink(app: NativeApp, path: string) {
  return (
    (app === "android" ? "enturma://app/" : "enturma://") +
    path.replace(/^\/+/, "")
  );
}

/** Takes the provider's answer from the device browser back to the app that asked. */
export function appReturnLink(
  app: NativeApp,
  provider: OAuthProvider,
  code: string,
  state: string,
) {
  return appLink(
    app,
    `/api/oauth/${provider}/callback?${new URLSearchParams({ code, state })}`,
  );
}

export type PendingOAuth = {
  provider: OAuthProvider;
  intent: OAuthIntent;
  state: string;
  verifier: string;
  next: string;
  terms: boolean;
  remember: boolean;
};

export function isProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "github";
}

/** Google signs in and links; GitHub only connects to the portfolio. */
export function intentFor(
  provider: OAuthProvider,
  value: string | null,
): OAuthIntent | null {
  if (provider === "github") return "connect";
  if (!value) return "login";
  return value === "login" || value === "signup" || value === "link"
    ? value
    : null;
}

export function begin(
  provider: OAuthProvider,
  intent: OAuthIntent,
  options: {
    next?: string | null;
    terms?: boolean;
    remember?: boolean;
    app?: NativeApp | null;
  },
): PendingOAuth {
  return {
    provider,
    intent,
    state:
      randomBytes(32).toString("base64url") +
      (options.app ? "." + APP_MARK[options.app] : ""),
    verifier: randomBytes(48).toString("base64url"),
    next: authDestination(options.next),
    terms: options.terms === true,
    remember: options.remember !== false,
  };
}

export function authorizeUrl(
  pending: PendingOAuth,
  client: { clientId: string; redirectUri: string },
) {
  const google = pending.provider === "google";
  const url = new URL(
    google
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : "https://github.com/login/oauth/authorize",
  );
  url.searchParams.set("client_id", client.clientId);
  url.searchParams.set("redirect_uri", client.redirectUri);
  url.searchParams.set("state", pending.state);
  // The code is useless to anyone who intercepts it without the verifier kept in the cookie.
  url.searchParams.set(
    "code_challenge",
    createHash("sha256").update(pending.verifier).digest("base64url"),
  );
  url.searchParams.set("code_challenge_method", "S256");
  if (google) {
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    // Someone with several Google accounts chooses which one, every time.
    url.searchParams.set("prompt", "select_account");
  }
  // GitHub gets no scope: the public profile is all the portfolio reads.
  return url.toString();
}

export function writePending(pending: PendingOAuth) {
  return Buffer.from(JSON.stringify(pending)).toString("base64url");
}

export function readPending(value: string | undefined): PendingOAuth | null {
  if (!value) return null;
  try {
    const row = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<PendingOAuth>;
    if (
      typeof row.provider !== "string" ||
      !isProvider(row.provider) ||
      typeof row.state !== "string" ||
      row.state.length < 32 ||
      typeof row.verifier !== "string" ||
      !["login", "signup", "link", "connect"].includes(String(row.intent))
    )
      return null;
    return {
      provider: row.provider,
      intent: row.intent as OAuthIntent,
      state: row.state,
      verifier: row.verifier,
      next: authDestination(typeof row.next === "string" ? row.next : null),
      terms: row.terms === true,
      remember: row.remember !== false,
    };
  } catch {
    return null;
  }
}

export function sameState(expected: string, received: string | null) {
  if (!received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type OAuthResult =
  { ok: true; created?: boolean } | { ok: false; code: string };

const safeCode = (code: string) =>
  /^[A-Za-z_]{1,40}$/.test(code) ? code : "failed";

/** The page the person lands on once the provider sends them back. */
export function outcome(pending: PendingOAuth, result: OAuthResult) {
  if (pending.intent === "link")
    return `/settings?conta=${result.ok ? "google" : safeCode(result.code)}`;
  if (pending.intent === "connect")
    return `/portfolio?github=${result.ok ? "ok" : safeCode(result.code)}`;
  if (result.ok)
    return result.created
      ? "/academic-verification?next=%2Fonboarding"
      : pending.next;
  if (result.code === "GOOGLE_SIGNUP_NEEDS_TERMS")
    return "/register?google=terms";
  return `/login?oauth=${safeCode(result.code)}`;
}

export { oauthMessage } from "./oauth-messages";

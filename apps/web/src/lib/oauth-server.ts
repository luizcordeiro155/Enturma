import type { NextRequest } from "next/server";
import { backendUrl, upstreamHeaders } from "./server-config";
import { OAUTH_COOKIE, type OAuthProvider } from "./oauth";

type ProviderConfig = {
  enabled: boolean;
  clientId?: string;
  redirectUri?: string;
};

/** Which providers the API has credentials for. The secrets never reach the web server. */
export async function providerConfig(provider: OAuthProvider) {
  try {
    const response = await fetch(
      `${backendUrl()}/api/v1/public/auth/providers`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) return null;
    const row = ((await response.json()) as Record<string, ProviderConfig>)[
      provider
    ];
    return row?.enabled && row.clientId && row.redirectUri
      ? { clientId: row.clientId, redirectUri: row.redirectUri }
      : null;
  } catch {
    return null;
  }
}

/** Only the two routes of the round trip ever receive this cookie. */
export function oauthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax: the provider sends the person back with a top-level navigation.
    sameSite: "lax" as const,
    path: "/api/oauth",
    maxAge,
  };
}

export { OAUTH_COOKIE };

export type Session = { accessToken: string; refreshToken: string };

/** A call to the API on behalf of this browser, with what the API needs to tell clients apart. */
export async function callApi(
  req: NextRequest,
  path: string,
  body: unknown,
  access?: string,
) {
  const headers = upstreamHeaders(req);
  headers.set("Content-Type", "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const response = await fetch(`${backendUrl()}/api/v1/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  return { ok: response.ok, status: response.status, payload };
}

/**
 * The signed-in person's access token. The ten-minute one may have run out while they were at the
 * provider, so the long-lived one renews it — and the renewed pair must be stored by the caller.
 */
export async function currentSession(
  req: NextRequest,
): Promise<{ access: string; renewed?: Session } | null> {
  const access = req.cookies.get("enturma_access")?.value;
  if (access) return { access };
  const refresh = req.cookies.get("enturma_refresh")?.value;
  if (!refresh) return null;
  const renewed = await callApi(req, "auth/refresh", { token: refresh });
  if (!renewed.ok || typeof renewed.payload.accessToken !== "string")
    return null;
  return {
    access: renewed.payload.accessToken,
    renewed: renewed.payload as unknown as Session,
  };
}

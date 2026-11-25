import type { NextRequest, NextResponse } from "next/server";

/** Set by the page itself when it runs inside an allowed frame (see embed-marker.tsx). */
export const EMBED_COOKIE = "enturma_embed";
export const SESSION_COOKIES = ["enturma_access", "enturma_refresh", "enturma_remember"] as const;

/**
 * Session cookies are first-party (SameSite=Lax). Inside a site allowed by `frame-ancestors`
 * (Mostra+), a Lax cookie is never sent, so they become partitioned: usable only under that
 * top-level site, never sent by other sites, and every write still needs our Origin.
 */
export function sessionCookieOptions(req: NextRequest) {
  if (req.cookies.get(EMBED_COOKIE)?.value === "1")
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      partitioned: true,
      path: "/",
    };
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function clearSessionCookies(req: NextRequest, res: NextResponse) {
  const options = sessionCookieOptions(req);
  for (const name of SESSION_COOKIES) res.cookies.set(name, "", { ...options, maxAge: 0 });
}

/** Stores a new session the way the sign-in form does. */
export function setSessionCookies(
  req: NextRequest,
  res: NextResponse,
  credentials: { accessToken: string; refreshToken: string },
  remember: boolean,
) {
  const options = sessionCookieOptions(req);
  const kept = (maxAge: number) => (remember ? { ...options, maxAge } : options);
  res.cookies.set("enturma_access", credentials.accessToken, kept(600));
  res.cookies.set("enturma_refresh", credentials.refreshToken, kept(30 * 86400));
  res.cookies.set("enturma_remember", remember ? "1" : "0", kept(30 * 86400));
}

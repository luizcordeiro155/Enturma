import { NextRequest, NextResponse } from "next/server";
import { backendUrl, upstreamHeaders } from "@/lib/server-config";
import { authDestination } from "@/lib/auth-navigation";

const PUBLIC_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verify-academic",
  "/download",
  "/privacidade",
  "/termos",
  "/offline",
  "/session/restore",
  "/session/unavailable",
]);

function publicPage(path: string) {
  return (
    PUBLIC_ROUTES.has(path) ||
    path.startsWith("/p/") ||
    path.startsWith("/join/") ||
    path.startsWith("/caronas/seguranca/")
  );
}

function toPage(req: NextRequest, page: string) {
  const url = new URL(page, req.url);
  url.searchParams.set(
    "next",
    authDestination(req.nextUrl.pathname + req.nextUrl.search),
  );
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function signIn(req: NextRequest) {
  const response = toPage(req, "/login");
  response.cookies.delete("enturma_access");
  response.cookies.delete("enturma_refresh");
  response.cookies.delete("enturma_remember");
  return response;
}

/**
 * Validate the session before sending protected HTML/RSC to the browser.
 * Expired access tokens are restored on a dedicated screen, never by first
 * rendering the Home page and redirecting after hydration.
 */
export async function proxy(req: NextRequest) {
  if (publicPage(req.nextUrl.pathname)) return NextResponse.next();

  const access = req.cookies.get("enturma_access")?.value;
  const refresh = req.cookies.get("enturma_refresh")?.value;
  if (!access && !refresh) return signIn(req);
  if (!access) return toPage(req, "/session/restore");

  try {
    const options: RequestInit = {
      headers: {
        Authorization: `Bearer ${access}`,
        ...Object.fromEntries(upstreamHeaders(req)),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    };
    let result = await fetch(`${backendUrl()}/api/v1/auth/session-view`, options);
    // Keep authenticated navigation available while the native Git API deployment catches up.
    // Both endpoints validate the session and academic access on the server.
    if (result.status === 404)
      result = await fetch(`${backendUrl()}/api/v1/users/me`, options);
    if (result.ok) {
      const profile = await result.json();
      if (
        profile.academicAccess === false &&
        !req.nextUrl.pathname.startsWith("/academic-verification")
      )
        return toPage(req, "/academic-verification");
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
    if (result.status === 401 || result.status === 403)
      return refresh ? toPage(req, "/session/restore") : signIn(req);
    // An API outage must not be mistaken for a logout.
    return toPage(req, "/session/unavailable");
  } catch {
    return toPage(req, "/session/unavailable");
  }
}

export const config = {
  matcher: ["/((?!api/|_next/|.*\\.[^/]+$).*)"],
};

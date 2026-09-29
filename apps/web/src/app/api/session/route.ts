import { NextRequest, NextResponse } from "next/server";
import type { Credentials } from "@enturma/contracts";
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== (process.env.APP_URL ?? req.nextUrl.origin))
    return new NextResponse(null, { status: 403 });
  const base = process.env.API_URL ?? "http://localhost:8080";
  try {
    const access = req.cookies.get("enturma_access")?.value;
    if (access) {
      const check = await fetch(`${base}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (check.ok) return NextResponse.json({ ok: true });
    }
    const refresh = req.cookies.get("enturma_refresh")?.value;
    if (!refresh) return new NextResponse(null, { status: 401 });
    const result = await fetch(`${base}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: refresh }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const res = NextResponse.json(
      { ok: result.ok },
      { status: result.status, headers: { "Cache-Control": "no-store" } },
    );
    if (result.ok) {
      const c: Credentials = await result.json();
      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };
      res.cookies.set("enturma_access", c.accessToken, {
        ...options,
        maxAge: 600,
      });
      res.cookies.set("enturma_refresh", c.refreshToken, {
        ...options,
        maxAge: 2592000,
      });
    } else {
      res.cookies.delete("enturma_access");
      res.cookies.delete("enturma_refresh");
    }
    return res;
  } catch {
    return NextResponse.json(
      { message: "Servidor indisponível." },
      { status: 503 },
    );
  }
}
export async function GET(req: NextRequest) {
  const access = req.cookies.get("enturma_access")?.value;
  return NextResponse.json(
    access
      ? {
          token: access,
          url: process.env.WEBSOCKET_URL ?? "ws://localhost:8080/ws",
        }
      : { message: "Sessão expirada." },
    { status: access ? 200 : 401, headers: { "Cache-Control": "no-store" } },
  );
}

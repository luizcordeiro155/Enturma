import { NextRequest, NextResponse } from "next/server";
import type { Credentials } from "@enturma/contracts";
import {
  allowedOrigin,
  backendUrl,
  websocketUrl,
  upstreamHeaders,
} from "@/lib/server-config";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return new NextResponse(null, { status: 403 });
  try {
    const base = backendUrl();
    const access = req.cookies.get("enturma_access")?.value;
    if (access) {
      const check = await fetch(`${base}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (check.ok) return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }
    const refresh = req.cookies.get("enturma_refresh")?.value;
    if (!refresh) return new NextResponse(null, { status: 401 });
    const rememberConnected =
      req.cookies.get("enturma_remember")?.value !== "0";
    const headers = upstreamHeaders(req);
    headers.set("Content-Type", "application/json");
    const result = await fetch(`${base}/api/v1/auth/refresh`, {
      method: "POST",
      headers,
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
      res.cookies.set(
        "enturma_access",
        c.accessToken,
        rememberConnected ? { ...options, maxAge: 600 } : options,
      );
      res.cookies.set(
        "enturma_refresh",
        c.refreshToken,
        rememberConnected ? { ...options, maxAge: 2592000 } : options,
      );
      res.cookies.set(
        "enturma_remember",
        rememberConnected ? "1" : "0",
        rememberConnected ? { ...options, maxAge: 2592000 } : options,
      );
    } else if (result.status === 401) {
      res.cookies.delete("enturma_access");
      res.cookies.delete("enturma_refresh");
      res.cookies.delete("enturma_remember");
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
  if (!access)
    return NextResponse.json(
      { message: "Sessão expirada." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  try {
    return NextResponse.json(
      {
        token: access,
        url: websocketUrl(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { message: "A conexão com o servidor ainda não está configurada." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

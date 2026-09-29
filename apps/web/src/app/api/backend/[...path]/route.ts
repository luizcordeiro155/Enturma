import { NextRequest, NextResponse } from "next/server";
import type { Credentials } from "@enturma/contracts";
import {
  allowedOrigin,
  backendUrl,
  upstreamHeaders,
} from "@/lib/server-config";
import { MAX_WEB_REQUEST_BYTES } from "@/lib/upload-limits";
export const runtime = "nodejs";
export const maxDuration = 60;
const secure = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
};
async function proxy(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (path.some((p) => p === ".." || p.includes("/") || p.includes("\\")))
    return NextResponse.json({ message: "Rota inválida." }, { status: 400 });
  if (!["GET", "HEAD"].includes(req.method) && !allowedOrigin(req))
    return NextResponse.json(
      { message: "Origem não permitida." },
      { status: 403 },
    );
  const route = path.join("/");
  const headers = upstreamHeaders(req);
  headers.set(
    "Content-Type",
    req.headers.get("content-type") ?? "application/json",
  );
  const access = req.cookies.get("enturma_access")?.value;
  if (access) headers.set("Authorization", `Bearer ${access}`);
  if (Number(req.headers.get("content-length")) > MAX_WEB_REQUEST_BYTES)
    return NextResponse.json(
      { message: "O limite de envio web é 4 MB." },
      { status: 413 },
    );
  const body = ["GET", "HEAD"].includes(req.method)
    ? undefined
    : await req.arrayBuffer();
  if (body && body.byteLength > MAX_WEB_REQUEST_BYTES)
    return NextResponse.json(
      { message: "O limite de envio web é 4 MB." },
      { status: 413 },
    );
  let credentials: Credentials | undefined;
  try {
    const upstream = await fetch(
      `${backendUrl()}/api/v1/${route}${req.nextUrl.search}`,
      {
        method: req.method,
        headers,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(route.includes("/ai") ? 90000 : 45000),
      },
    );
    let payload: ReadableStream<Uint8Array> | string | null =
      upstream.status === 204 ? null : upstream.body;
    if (upstream.ok && ["auth/login", "auth/register"].includes(route)) {
      credentials = await upstream.json();
      payload = JSON.stringify({ userId: credentials!.userId });
    }
    const res = new NextResponse(payload, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
        ...(upstream.headers.has("Retry-After")
          ? { "Retry-After": upstream.headers.get("Retry-After")! }
          : {}),
        ...(upstream.headers.has("Content-Disposition")
          ? {
              "Content-Disposition": upstream.headers.get(
                "Content-Disposition",
              )!,
            }
          : {}),
      },
    });
    if (credentials) {
      res.cookies.set("enturma_access", credentials.accessToken, {
        ...cookieOptions,
        maxAge: 600,
      });
      res.cookies.set("enturma_refresh", credentials.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 86400,
      });
    }
    if (route === "auth/logout" && upstream.ok) {
      res.cookies.delete("enturma_access");
      res.cookies.delete("enturma_refresh");
    }
    return res;
  } catch {
    return NextResponse.json(
      {
        message: "O servidor está indisponível. Tente novamente em instantes.",
      },
      { status: 503 },
    );
  }
}
export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};

import { NextRequest, NextResponse } from "next/server";
import type { Credentials } from "@enturma/contracts";
const backend = process.env.API_URL ?? "http://localhost:8080";
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
  if (
    !["GET", "HEAD"].includes(req.method) &&
    req.headers.get("origin") !== (process.env.APP_URL ?? req.nextUrl.origin)
  )
    return NextResponse.json(
      { message: "Origem não permitida." },
      { status: 403 },
    );
  const route = path.join("/");
  const headers = new Headers();
  headers.set(
    "Content-Type",
    req.headers.get("content-type") ?? "application/json",
  );
  const access = req.cookies.get("enturma_access")?.value;
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const body = ["GET", "HEAD"].includes(req.method)
    ? undefined
    : await req.arrayBuffer();
  if (body && body.byteLength > 16 * 1024 * 1024)
    return NextResponse.json(
      { message: "Arquivo muito grande." },
      { status: 413 },
    );
  let credentials: Credentials | undefined;
  try {
    const upstream = await fetch(
      `${backend}/api/v1/${route}${req.nextUrl.search}`,
      {
        method: req.method,
        headers,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(route.endsWith("/ai") ? 55000 : 20000),
      },
    );
    let payload: ArrayBuffer | string | null =
      upstream.status === 204 ? null : await upstream.arrayBuffer();
    if (upstream.ok && ["auth/login", "auth/register"].includes(route)) {
      credentials = JSON.parse(
        new TextDecoder().decode(payload as ArrayBuffer),
      );
      payload = JSON.stringify({ userId: credentials!.userId });
    }
    const res = new NextResponse(payload, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
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

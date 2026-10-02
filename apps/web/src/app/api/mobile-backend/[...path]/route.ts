import { NextRequest, NextResponse } from "next/server";
import { allowedOrigin, backendUrl, upstreamHeaders } from "@/lib/server-config";
import { MAX_WEB_REQUEST_BYTES } from "@/lib/upload-limits";

export const runtime = "nodejs";
export const maxDuration = 60;

async function proxy(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (path.some((part) => part === ".." || part.includes("/") || part.includes("\\")))
    return NextResponse.json({ message: "Rota inválida." }, { status: 400 });

  const origin = req.headers.get("origin");
  if (origin && !allowedOrigin(req))
    return NextResponse.json({ message: "Origem não permitida." }, { status: 403 });

  const route = path.join("/");
  const headers = upstreamHeaders(req);
  headers.set("Content-Type", req.headers.get("content-type") ?? "application/json");

  const authorization = req.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  if (Number(req.headers.get("content-length")) > MAX_WEB_REQUEST_BYTES)
    return NextResponse.json(
      { message: "O limite de envio mobile é 4 MB." },
      { status: 413 },
    );

  const body = ["GET", "HEAD"].includes(req.method)
    ? undefined
    : await req.arrayBuffer();

  if (body && body.byteLength > MAX_WEB_REQUEST_BYTES)
    return NextResponse.json(
      { message: "O limite de envio mobile é 4 MB." },
      { status: 413 },
    );

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

    return new NextResponse(upstream.status === 204 ? null : upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
        ...(upstream.headers.has("Retry-After")
          ? { "Retry-After": upstream.headers.get("Retry-After")! }
          : {}),
        ...(upstream.headers.has("Content-Disposition")
          ? {
              "Content-Disposition": upstream.headers.get("Content-Disposition")!,
            }
          : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { message: "O servidor está indisponível. Tente novamente em instantes." },
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

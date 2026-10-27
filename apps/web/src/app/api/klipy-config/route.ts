import { NextRequest, NextResponse } from "next/server";
import { backendUrl, upstreamHeaders } from "@/lib/server-config";
/** Browser-to-KLIPY is required by the provider. An app key is client-visible by design. */
export async function GET(request: NextRequest) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (!request.cookies.has("enturma_access")) {
    return NextResponse.json({ enabled: false }, { status: 401, headers });
  }
  try {
    const session = await fetch(`${backendUrl()}/api/v1/auth/session-view`, {
      headers: {
        ...Object.fromEntries(upstreamHeaders(request)),
        Authorization: `Bearer ${request.cookies.get("enturma_access")!.value}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!session.ok)
      return NextResponse.json(
        { enabled: false },
        {
          status: session.status === 401 || session.status === 403 ? 401 : 503,
          headers,
        },
      );
  } catch {
    return NextResponse.json({ enabled: false }, { status: 503, headers });
  }
  const key = process.env.KLIPY_API_KEY?.trim();
  return NextResponse.json(key ? { enabled: true, key } : { enabled: false }, {
    headers,
  });
}

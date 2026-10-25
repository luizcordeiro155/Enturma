import { NextRequest, NextResponse } from "next/server";
/** Browser-to-KLIPY is required by the provider. An app key is client-visible by design. */
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!request.cookies.has("enturma_access")) {
    return NextResponse.json({ enabled: false }, { status: 401, headers });
  }
  const key = process.env.KLIPY_API_KEY?.trim();
  return NextResponse.json(key ? { enabled: true, key } : { enabled: false }, { headers });
}

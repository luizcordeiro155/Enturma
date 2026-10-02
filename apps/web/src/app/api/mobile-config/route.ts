import { NextResponse } from "next/server";
import { backendUrl, websocketUrl } from "@/lib/server-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      version: "0.3.0",
      apiUrl: `${backendUrl()}/api/v1`,
      websocketUrl: websocketUrl(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

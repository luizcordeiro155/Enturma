import { backendUrl } from "@/lib/server-config";
import { connection } from "next/server";
export async function GET() {
  await connection();
  try {
    const res = await fetch(`${backendUrl()}/actuator/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data = res.ok ? await res.json() : null;
    if (data?.status === "UP")
      return Response.json(
        { status: "UP" },
        { headers: { "Cache-Control": "no-store" } },
      );
  } catch {
    /* Health response intentionally contains no infrastructure details. */
  }
  return Response.json(
    { status: "DOWN" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

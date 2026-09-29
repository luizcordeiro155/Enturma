import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";

// Server-only configuration. Never import this module from a client component.
export function backendUrl() {
  const value = process.env.API_URL?.trim();
  if (!value && process.env.NODE_ENV === "production")
    throw new Error("Configure API_URL no servidor web.");
  const url = new URL(value || "http://localhost:8080");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "API_URL deve ser a origem da API, sem caminho ou credenciais.",
    );
  if (process.env.VERCEL === "1" && url.protocol !== "https:")
    throw new Error("API_URL precisa usar HTTPS na Vercel.");
  return url.origin;
}

export function websocketUrl() {
  const url = new URL(backendUrl());
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  return url.toString();
}

export function allowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const origins = new Set<string>();
  if (process.env.APP_URL) origins.add(new URL(process.env.APP_URL).origin);
  for (const key of [
    "VERCEL_URL",
    "VERCEL_BRANCH_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
  ]) {
    const host = process.env[key];
    if (host) origins.add(new URL(`https://${host}`).origin);
  }
  if (process.env.NODE_ENV !== "production")
    origins.add(new URL(req.url).origin);
  return origins.has(origin);
}

export function upstreamHeaders(req: Request) {
  const headers = new Headers();
  const secret = process.env.BFF_PROXY_SECRET;
  // Vercel overwrites this header. Never trust it on a self-hosted server.
  const ip = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (
    process.env.VERCEL === "1" &&
    secret &&
    secret.length >= 32 &&
    ip &&
    isIP(ip)
  ) {
    const subject = createHash("sha256").update(ip).digest("hex");
    const payload = `${Math.floor(Date.now() / 1000)}:${subject}`;
    const signature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    headers.set("X-Enturma-Client", `${payload}:${signature}`);
  }
  return headers;
}

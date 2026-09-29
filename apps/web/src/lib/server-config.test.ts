// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  allowedOrigin,
  backendUrl,
  websocketUrl,
  upstreamHeaders,
} from "./server-config";
afterEach(() => vi.unstubAllEnvs());
describe("configuração Vercel/SquareCloud", () => {
  it("deriva WSS da origem HTTPS sem variáveis extras", () => {
    vi.stubEnv("API_URL", "https://api.example.test/");
    expect(backendUrl()).toBe("https://api.example.test");
    expect(websocketUrl()).toBe("wss://api.example.test/ws");
  });
  it("não usa localhost em produção sem API configurada", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_URL", "");
    expect(backendUrl).toThrow("API_URL");
  });
  it("recusa caminhos, credenciais e HTTP na Vercel", () => {
    for (const value of [
      "https://api.test/api/v1",
      "https://user:pass@api.test",
    ]) {
      vi.stubEnv("API_URL", value);
      expect(backendUrl).toThrow();
    }
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("API_URL", "http://api.test");
    expect(backendUrl).toThrow("HTTPS");
  });
  it("aceita domínios exatos de produção/preview e rejeita outra origem", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_URL", "preview.example.test");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "web.example.test");
    const req = (origin: string) =>
      new Request("https://web.example.test/api", { headers: { origin } });
    expect(allowedOrigin(req("https://web.example.test"))).toBe(true);
    expect(allowedOrigin(req("https://preview.example.test"))).toBe(true);
    expect(allowedOrigin(req("https://attacker.example.test"))).toBe(false);
    expect(allowedOrigin(new Request("https://web.example.test/api"))).toBe(
      false,
    );
  });
  it("só assina o IP de plataforma quando está na Vercel", () => {
    const key = "test-only-proxy-key-not-a-real-secret";
    vi.stubEnv("BFF_PROXY_SECRET", key);
    vi.stubEnv("VERCEL", "");
    const req = new Request("https://web.test", {
      headers: {
        "x-vercel-forwarded-for": "192.0.2.1",
        "X-Enturma-Client": "forged",
      },
    });
    expect(upstreamHeaders(req).has("X-Enturma-Client")).toBe(false);
    vi.stubEnv("VERCEL", "1");
    const signed = upstreamHeaders(req).get("X-Enturma-Client")!;
    const [timestamp, subject, signature] = signed.split(":");
    expect(subject).toHaveLength(64);
    expect(signature).toBe(
      createHmac("sha256", key).update(`${timestamp}:${subject}`).digest("hex"),
    );
  });
});

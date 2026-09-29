import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { save, session, api, logout } from "./api";
const store = new Map<string, string>();
vi.mock("expo-secure-store", () => ({
  getItemAsync: async (k: string) => store.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => {
    store.set(k, v);
  },
  deleteItemAsync: async (k: string) => {
    store.delete(k);
  },
}));
beforeEach(() => store.clear());
afterEach(() => vi.unstubAllGlobals());
describe("sessão nativa", () => {
  it("guarda e recupera a sessão pelo armazenamento seguro", async () => {
    const credentials = {
      accessToken: "access-test",
      refreshToken: "refresh-test",
      expiresIn: 600,
      userId: "user-test",
    };
    await save(credentials);
    expect(await session()).toEqual(credentials);
  });
  it("não inventa uma sessão quando o armazenamento está vazio", async () => {
    expect(await session()).toBeNull();
  });
  it("não reutiliza refresh antigo quando um 401 chega depois da rotação", async () => {
    const original = {
      accessToken: "old",
      refreshToken: "old-refresh",
      expiresIn: 600,
      userId: "u",
    };
    const renewed = {
      ...original,
      accessToken: "new",
      refreshToken: "new-refresh",
    };
    await save(original);
    let releaseLate!: (value: Response) => void;
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith("/auth/refresh")) return Response.json(renewed);
      const token = new Headers(init.headers).get("Authorization");
      if (token === "Bearer new") return Response.json({ ok: true });
      if (url.endsWith("/late")) {
        markStarted();
        return new Promise<Response>((resolve) => {
          releaseLate = resolve;
        });
      }
      return Response.json({ message: "Expired" }, { status: 401 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const late = api("/late");
    await started;
    expect(await api("/fast")).toEqual({ ok: true });
    releaseLate(Response.json({ message: "Expired" }, { status: 401 }));
    expect(await late).toEqual({ ok: true });
    expect(
      fetchMock.mock.calls.filter(([url]) => url.endsWith("/auth/refresh")),
    ).toHaveLength(1);
    expect(await session()).toEqual(renewed);
  });
  it("limpa a sessão local ao sair mesmo se a rede falhar", async () => {
    await save({
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 600,
      userId: "u",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Network unavailable")),
    );
    await expect(logout()).rejects.toThrow();
    expect(await session()).toBeNull();
  });
});

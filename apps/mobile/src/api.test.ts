import { describe, it, expect, vi, beforeEach } from "vitest";
import { save, session } from "./api";
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
});

import * as SecureStore from "expo-secure-store";
import { request, ApiError, type Credentials } from "@enturma/contracts";
export const base =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
let rotating: Promise<Credentials> | null = null;
export async function save(c: Credentials) {
  await SecureStore.setItemAsync("enturma_session", JSON.stringify(c));
}
export async function session(): Promise<Credentials | null> {
  const value = await SecureStore.getItemAsync("enturma_session");
  return value ? JSON.parse(value) : null;
}
export async function logout() {
  await api("/auth/logout", { method: "POST" });
  await SecureStore.deleteItemAsync("enturma_session");
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const c = await session();
  const run = (token?: string) =>
    request<T>(base, path, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  try {
    return await run(c?.accessToken);
  } catch (e) {
    if (
      !(e instanceof ApiError) ||
      e.status !== 401 ||
      !c ||
      path.startsWith("/auth/")
    )
      throw e;
    if (!rotating)
      rotating = request<Credentials>(base, "/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ token: c.refreshToken }),
      })
        .then(async (next) => {
          await save(next);
          return next;
        })
        .finally(() => {
          rotating = null;
        });
    const next = await rotating;
    return run(next.accessToken);
  }
}

import { request, ApiError } from "@enturma/contracts";
let renewing: Promise<boolean> | null = null;
async function renew() {
  const run = async () => {
    const res = await fetch("/api/session", { method: "POST" });
    return res.ok;
  };
  return navigator.locks
    ? navigator.locks.request("enturma-refresh", run)
    : run();
}
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    return await request<T>("/api/backend", path, options);
  } catch (e) {
    if (
      !(e instanceof ApiError) ||
      e.status !== 401 ||
      path.startsWith("/auth/")
    )
      throw e;
    if (!renewing)
      renewing = renew().finally(() => {
        renewing = null;
      });
    if (await renewing) return request<T>("/api/backend", path, options);
    throw e;
  }
}
export const post = <T>(path: string, body: unknown = {}) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });

import { request, ApiError } from "@enturma/contracts";

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

const readCache = new Map<string, CacheEntry>();
const pendingReads = new Map<string, Promise<unknown>>();
let renewing: Promise<boolean> | null = null;

const SESSION_MUTATIONS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/reset-password",
]);

function announceSessionChange(path: string) {
  if (typeof window === "undefined") return;
  const detail = { path, at: Date.now() };
  window.dispatchEvent(new CustomEvent("enturma-session-changed", { detail }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("enturma-session");
    channel.postMessage(detail);
    channel.close();
  }
}

function cacheTtl(path: string) {
  if (
    path.startsWith("/notifications") ||
    path.startsWith("/rooms/") ||
    path.startsWith("/private/") ||
    path.startsWith("/calls/")
  )
    return 0;
  if (path.startsWith("/rides") || path.startsWith("/matches")) return 3_000;
  if (path.startsWith("/forum")) return 20_000;
  if (path === "/users/me" || path === "/learning/access") return 45_000;
  return 15_000;
}

export function peekApiCache<T>(path: string): T | undefined {
  const cached = readCache.get(path);
  if (!cached || cached.expiresAt <= Date.now()) {
    if (cached) readCache.delete(path);
    return undefined;
  }
  return cached.value as T;
}

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    readCache.clear();
    return;
  }
  for (const key of readCache.keys()) {
    if (key.startsWith(prefix)) readCache.delete(key);
  }
}

async function renew() {
  const run = async () => {
    const res = await fetch("/api/session", { method: "POST" });
    return res.ok;
  };
  return navigator.locks?.request
    ? navigator.locks.request("enturma-refresh", run)
    : run();
}

async function requestWithRenewal<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
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

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const ttl = method === "GET" ? cacheTtl(path) : 0;
  const bypassRead = options?.cache === "no-store" || options?.cache === "reload";
  const cacheable = method === "GET" && ttl > 0;

  if (cacheable && !bypassRead) {
    const cached = peekApiCache<T>(path);
    if (cached !== undefined) return cached;
    const pending = pendingReads.get(path);
    if (pending) return pending as Promise<T>;
  }

  const task = requestWithRenewal<T>(path, options);
  if (cacheable && !bypassRead) pendingReads.set(path, task);

  try {
    const value = await task;
    if (cacheable) {
      readCache.set(path, { value, expiresAt: Date.now() + ttl });
    } else if (method !== "GET") {
      invalidateApiCache();
      if (SESSION_MUTATIONS.has(path)) announceSessionChange(path);
    }
    return value;
  } finally {
    if (cacheable && !bypassRead) pendingReads.delete(path);
  }
}

export const post = <T>(path: string, body: unknown = {}) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });

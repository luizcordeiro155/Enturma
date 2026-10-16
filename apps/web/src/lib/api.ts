import { request, ApiError } from "@enturma/contracts";

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

const readCache = new Map<string, CacheEntry>();
const pendingReads = new Map<string, Promise<unknown>>();
let renewing: Promise<boolean> | null = null;
let sessionGeneration = 0;
// BroadcastChannel also reaches other channel objects in the same document.
// Keep one origin ID across module reloads, so login cannot reload its own form.
const documentIdentity = (() => {
  if (typeof window === "undefined") return "server";
  const page = window as Window & { __enturmaSessionDocumentId?: string };
  return (page.__enturmaSessionDocumentId ??= crypto.randomUUID());
})();

const SESSION_MUTATIONS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/reset-password",
]);

function announceSessionChange(path: string) {
  if (typeof window === "undefined") return;
  const detail = { path, at: Date.now(), source: documentIdentity };
  window.dispatchEvent(new CustomEvent("enturma-session-changed", { detail }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("enturma-session");
    channel.postMessage(detail);
    channel.close();
  }
}

function cacheTtl(path: string) {
  if (path.startsWith("/auth/")) return 0;
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
    return undefined;
  }
  return cached.value as T;
}

/** Last confirmed data, for first paint only. Revalidate after mounting; never use for access decisions. */
export function peekApiSnapshot<T>(path: string): T | undefined {
  return readCache.get(path)?.value as T | undefined;
}

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    for (const cached of readCache.values()) cached.expiresAt = 0;
    return;
  }
  for (const key of readCache.keys()) {
    if (key.startsWith(prefix)) readCache.delete(key);
  }
}

export function resetSessionCache() {
  sessionGeneration++;
  readCache.clear();
  pendingReads.clear();
}

if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  const sessionChannel = new BroadcastChannel("enturma-session");
  sessionChannel.addEventListener("message", (event: MessageEvent) => {
    if (event.data?.source === documentIdentity) return;
    resetSessionCache();
    // Clear preserved route state as well as data when another tab changes account.
    window.location.reload();
  });
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
  generation = sessionGeneration,
): Promise<T> {
  try {
    return await request<T>("/api/backend", path, options);
  } catch (e) {
    if (generation !== sessionGeneration)
      throw new DOMException("A sessão mudou.", "AbortError");
    if (
      !(e instanceof ApiError) ||
      e.status !== 401 ||
      (path.startsWith("/auth/") && !path.startsWith("/auth/academic/"))
    )
      throw e;
    if (!renewing)
      renewing = renew().finally(() => {
        renewing = null;
      });
    const renewed = await renewing;
    if (generation !== sessionGeneration)
      throw new DOMException("A sessão mudou.", "AbortError");
    if (renewed) return request<T>("/api/backend", path, options);
    throw e;
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  if (method !== "GET" && SESSION_MUTATIONS.has(path)) resetSessionCache();
  const generation = sessionGeneration;
  const ttl = method === "GET" ? cacheTtl(path) : 0;
  const bypassRead =
    options?.cache === "no-store" || options?.cache === "reload";
  const cacheable = method === "GET" && ttl > 0;

  if (cacheable && !bypassRead) {
    const cached = peekApiCache<T>(path);
    if (cached !== undefined) return cached;
    const pending = pendingReads.get(path);
    if (pending) return pending as Promise<T>;
  }

  const task = requestWithRenewal<T>(path, options, generation).then(
    (value) => {
      // Every deduplicated caller must see the session check, not only the first caller.
      if (generation !== sessionGeneration)
        throw new DOMException(
          "A sessão mudou durante a solicitação.",
          "AbortError",
        );
      return value;
    },
  );
  if (cacheable && !bypassRead) pendingReads.set(path, task);

  try {
    const value = await task;
    if (generation !== sessionGeneration)
      throw new DOMException(
        "A sessão mudou durante a solicitação.",
        "AbortError",
      );
    if (cacheable) {
      if (readCache.size >= 120 && !readCache.has(path))
        readCache.delete(readCache.keys().next().value!);
      readCache.set(path, { value, expiresAt: Date.now() + ttl });
    } else if (method !== "GET") {
      invalidateApiCache();
      if (SESSION_MUTATIONS.has(path)) announceSessionChange(path);
    }
    return value;
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404].includes(error.status))
      readCache.delete(path);
    throw error;
  } finally {
    if (cacheable && !bypassRead && pendingReads.get(path) === task)
      pendingReads.delete(path);
  }
}

export const post = <T>(path: string, body: unknown = {}) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  invalidateApiCache,
  peekApiCache,
  peekApiSnapshot,
  resetSessionCache,
  prepareSessionNavigation,
} from "./api";

beforeEach(() => {
  resetSessionCache();
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("session-scoped navigation snapshots", () => {
  it("checks the HttpOnly cookie locally while reusing a recent backend renewal", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(async () =>
      Response.json({ ok: true }),
    );
    expect(await prepareSessionNavigation()).toBe(true);
    expect(await prepareSessionNavigation()).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith("/api/session", {
      cache: "no-store",
    });
    vi.advanceTimersByTime(8 * 60_000);
    expect(await prepareSessionNavigation()).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
    resetSessionCache();
    await prepareSessionNavigation();
    expect(fetch).toHaveBeenCalledTimes(4);
  });
  it("renews a missing access cookie even after a recent successful renewal", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    expect(await prepareSessionNavigation()).toBe(true);
    expect(await prepareSessionNavigation()).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenLastCalledWith("/api/session", { method: "POST" });
  });
  it("renews after a real API denial regardless of the recent renewal hint", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(
        Response.json({ message: "Entre para continuar." }, { status: 401 }),
      )
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(Response.json({ id: "current-account" }));
    await prepareSessionNavigation();
    expect(await api("/users/me")).toEqual({ id: "current-account" });
    expect(
      vi
        .mocked(fetch)
        .mock.calls.filter(
          ([url, options]) =>
            url === "/api/session" && options?.method === "POST",
        ),
    ).toHaveLength(2);
  });
  it("never memoizes a failed renewal", async () => {
    vi.mocked(fetch).mockImplementation(
      async () => new Response(null, { status: 401 }),
    );
    expect(await prepareSessionNavigation()).toBe(false);
    expect(await prepareSessionNavigation()).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("renews an invalid session-view token once even when its local cookie still exists", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(
        Response.json({ message: "Sessão expirada." }, { status: 401 }),
      )
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(Response.json({ academicAccess: true }));
    await prepareSessionNavigation();
    expect(await prepareSessionNavigation()).toBe(true);
    expect(await api("/auth/session-view", { cache: "no-store" })).toEqual({
      academicAccess: true,
    });
    expect(
      vi
        .mocked(fetch)
        .mock.calls.filter(
          ([url, options]) =>
            url === "/api/session" && options?.method === "POST",
        ),
    ).toHaveLength(2);
  });
  it.each(["/auth/login", "/auth/register"])(
    "never retries %s after a credentials denial",
    async (path) => {
      vi.mocked(fetch).mockResolvedValue(
        Response.json({ message: "Dados inválidos." }, { status: 401 }),
      );
      await expect(
        api(path, { method: "POST", body: "{}" }),
      ).rejects.toMatchObject({ status: 401 });
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
  it("waits for concurrent API renewal before accepting a local cookie check", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ ok: true }));
    await prepareSessionNavigation();
    let finishCookie!: (response: Response) => void;
    let finishRenewal!: (response: Response) => void;
    let renewalStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      renewalStarted = resolve;
    });
    vi.mocked(fetch).mockImplementation(async (url, options) => {
      if (url === "/api/session" && options?.method === "POST") {
        renewalStarted();
        return new Promise<Response>((resolve) => {
          finishRenewal = resolve;
        });
      }
      if (url === "/api/session")
        return new Promise<Response>((resolve) => {
          finishCookie = resolve;
        });
      return Response.json({ message: "Sessão expirada." }, { status: 401 });
    });
    let navigated = false;
    const navigation = prepareSessionNavigation().then((ready) => {
      navigated = ready;
      return ready;
    });
    const read = api("/users/me");
    const denied = expect(read).rejects.toMatchObject({ status: 401 });
    await started;
    finishCookie(Response.json({ ok: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(navigated).toBe(false);
    finishRenewal(new Response(null, { status: 401 }));
    expect(await navigation).toBe(false);
    await denied;
  });
  it("rejects a delayed cookie check after logout without starting another renewal", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ ok: true }));
    await prepareSessionNavigation();
    let finishCookie!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finishCookie = resolve;
        }),
    );
    const navigation = prepareSessionNavigation();
    resetSessionCache();
    finishCookie(Response.json({ ok: true }));
    expect(await navigation).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("keeps previously displayed data while revalidating an expired response", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValueOnce(Response.json([{ id: "first" }]));
    await api("/study-rooms");
    vi.advanceTimersByTime(16000);
    expect(peekApiCache("/study-rooms")).toBeUndefined();
    expect(peekApiSnapshot("/study-rooms")).toEqual([{ id: "first" }]);
    vi.mocked(fetch).mockResolvedValueOnce(Response.json([{ id: "new" }]));
    expect(await api("/study-rooms")).toEqual([{ id: "new" }]);
    expect(peekApiSnapshot("/study-rooms")).toEqual([{ id: "new" }]);
  });

  it("never returns previous-account data to either deduplicated reader", async () => {
    let resolve!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const first = api("/users/me");
    const second = api("/users/me");
    const failures = [
      expect(first).rejects.toMatchObject({ name: "AbortError" }),
      expect(second).rejects.toMatchObject({ name: "AbortError" }),
    ];
    resetSessionCache();
    resolve(Response.json({ id: "previous-account" }));
    await Promise.all(failures);
    expect(peekApiSnapshot("/users/me")).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("invalidates freshness on edits and removes snapshots after an access denial", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json([{ id: "room" }]));
    await api("/study-rooms");
    invalidateApiCache();
    expect(peekApiCache("/study-rooms")).toBeUndefined();
    expect(peekApiSnapshot("/study-rooms")).toHaveLength(1);
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ message: "Access denied" }, { status: 403 }),
    );
    await expect(api("/study-rooms")).rejects.toMatchObject({ status: 403 });
    expect(peekApiSnapshot("/study-rooms")).toBeUndefined();
  });

  it("never caches academic approval or other authentication proof", async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      Response.json({ accessAllowed: true }),
    );
    await api("/auth/academic/status");
    expect(peekApiSnapshot("/auth/academic/status")).toBeUndefined();
    await api("/auth/academic/status");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

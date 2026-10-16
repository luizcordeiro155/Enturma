import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  invalidateApiCache,
  peekApiCache,
  peekApiSnapshot,
  resetSessionCache,
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

import { expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
function worker(
  clients: { url: string; focused: boolean; visibilityState: string }[] = [],
) {
  const handlers: Record<string, ((e: unknown) => void)[]> = {};
  const stored = new Map<string, unknown>();
  const showNotification = vi.fn(async (_title: string, _options: unknown) => {
    void _title;
    void _options;
  });
  const cache = {
    match: async (r: Request) => stored.get(r.url),
    put: async (r: Request, v: unknown) => {
      stored.set(r.url, v);
    },
    keys: async () => [...stored.keys()].map((k) => new Request(k)),
    delete: async (r: Request) => stored.delete(r.url),
  };
  const context = {
    self: {
      location: { origin: "https://enturma.test" },
      navigator: {},
      addEventListener: (name: string, fn: (e: unknown) => void) => {
        (handlers[name] ??= []).push(fn);
      },
      clients: {
        matchAll: async () =>
          clients.map((c) => ({ ...c, postMessage: vi.fn() })),
      },
      registration: { showNotification },
    },
    caches: { open: async () => cache },
    URL,
    Request,
    Response,
    Promise,
  };
  vm.runInNewContext(readFileSync("public/sw.js", "utf8"), context);
  async function send(type: string, event: object) {
    const tasks: Promise<unknown>[] = [];
    for (const fn of handlers[type] ?? [])
      fn({ ...event, waitUntil: (p: Promise<unknown>) => tasks.push(p) });
    await Promise.all(tasks);
  }
  return { showNotification, send };
}
test("Web Push displays with an unrelated focused page and deduplicates across realtime and push", async () => {
  const w = worker([
    {
      url: "https://enturma.test/home",
      focused: true,
      visibilityState: "visible",
    },
  ]);
  const data = {
    id: "account:123",
    title: "Nova mensagem",
    body: "Olá",
    href: "/friends?chat=123",
  };
  await w.send("push", { data: { json: () => data } });
  await w.send("message", {
    source: { url: "https://enturma.test/home" },
    data: { type: "ENTURMA_SHOW_NOTIFICATION", data },
  });
  expect(w.showNotification).toHaveBeenCalledTimes(1);
});
test("focused conversation suppresses its alert; unfocused visible tab does not", async () => {
  const data = { id: "account:124", href: "/friends?chat=123" };
  const focused = worker([
    {
      url: "https://enturma.test/friends?chat=123",
      focused: true,
      visibilityState: "visible",
    },
  ]);
  await focused.send("push", { data: { json: () => data } });
  expect(focused.showNotification).not.toHaveBeenCalled();
  const unfocused = worker([
    {
      url: "https://enturma.test/friends?chat=123",
      focused: false,
      visibilityState: "visible",
    },
  ]);
  await unfocused.send("push", { data: { json: () => data } });
  expect(unfocused.showNotification).toHaveBeenCalledTimes(1);
});
test("notification links cannot navigate to another site", async () => {
  const w = worker();
  await w.send("push", {
    data: { json: () => ({ id: "a:3", href: "https://evil.test/" }) },
  });
  expect(w.showNotification.mock.calls[0]?.[1]).toMatchObject({
    data: { href: "/notifications" },
  });
});

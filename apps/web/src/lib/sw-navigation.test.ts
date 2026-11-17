import { expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/** The service worker's fetch handler, run in isolation. */
function fetchHandler() {
  let handler: ((event: unknown) => void) | undefined;
  const self = {
    location: { origin: "https://enturma.test" },
    navigator: {},
    addEventListener: (name: string, fn: (e: unknown) => void) => {
      if (name === "fetch") handler = fn;
    },
    clients: { matchAll: async () => [] },
    registration: {},
  };
  vm.runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self,
    caches: { open: async () => ({}), match: async () => undefined },
    fetch: vi.fn(async () => new Response("")),
    URL,
    Request,
    Response,
    Promise,
  });
  return (request: { url: string; method: string; mode: string; destination: string }) => {
    const respondWith = vi.fn();
    handler!({ request, respondWith });
    return respondWith;
  };
}

test("page loads inside the Mostra+ iframe go straight to the network", () => {
  // Re-issued from the worker, they would lose the partitioned session cookies.
  const handle = fetchHandler();
  const framed = handle({ url: "https://enturma.test/home", method: "GET", mode: "navigate", destination: "iframe" });
  expect(framed).not.toHaveBeenCalled();
  const page = handle({ url: "https://enturma.test/home", method: "GET", mode: "navigate", destination: "document" });
  expect(page).toHaveBeenCalled();
});

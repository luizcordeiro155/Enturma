import { NextRequest } from "next/server";
import { expect, test } from "vitest";
import { proxy } from "./proxy";

function page(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`https://enturma.test${path}`, { headers });
}

test("a normal page load without a session goes to the login", async () => {
  const res = await proxy(page("/home", { "sec-fetch-dest": "document" }));
  expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
});

test("inside an iframe a page load without cookies restores the session on the client", async () => {
  // Browsers do not attach the partitioned cookies to iframe page loads, only to fetches.
  const res = await proxy(page("/home", { "sec-fetch-dest": "iframe" }));
  const target = new URL(res.headers.get("location")!);
  expect(target.pathname).toBe("/session/restore");
  expect(target.searchParams.get("next")).toBe("/home");
  expect(res.headers.get("set-cookie") ?? "").not.toContain("enturma_access=;");
});

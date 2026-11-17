import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import { clearSessionCookies, sessionCookieOptions } from "./session-cookies";
import config from "../../next.config";

function request(cookie?: string) {
  return new NextRequest("https://enturma.example/api/session", {
    headers: cookie ? { cookie } : {},
  });
}

describe("session cookies", () => {
  it("stay first-party (SameSite=Lax) on the Enturma site", () => {
    expect(sessionCookieOptions(request())).toMatchObject({ httpOnly: true, sameSite: "lax" });
    expect(sessionCookieOptions(request())).not.toHaveProperty("partitioned");
  });

  it("become partitioned when the app runs framed by an allowed site", () => {
    expect(sessionCookieOptions(request("enturma_embed=1"))).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      partitioned: true,
      path: "/",
    });
  });

  it("clear with the same attributes they were set with", () => {
    const res = NextResponse.json({});
    clearSessionCookies(request("enturma_embed=1"), res);
    const header = res.headers.getSetCookie().join("\n");
    for (const name of ["enturma_access", "enturma_refresh", "enturma_remember"])
      expect(header).toMatch(new RegExp(`${name}=;.*Max-Age=0.*Partitioned`, "i"));
  });
});

describe("framing policy", () => {
  it("only Mostra+ (and Enturma itself) may frame the app", async () => {
    const [rule] = await config.headers!();
    const csp = rule.headers.find((h) => h.key === "Content-Security-Policy")!.value;
    expect(csp).toContain("frame-ancestors 'self' https://mostraplus.com.br https://*.mostraplus.com.br");
    expect(rule.headers.find((h) => h.key === "X-Frame-Options")).toBeUndefined();
  });
});

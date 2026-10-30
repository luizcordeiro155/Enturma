import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
]) {
  for (const theme of ["dark", "light"])
    test(`visitor and authentication ${viewport.width} ${theme}`, async ({
      page,
    }, info) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(
        (theme) =>
          localStorage.setItem(
            "enturma-experience",
            JSON.stringify({ theme: theme.toUpperCase() }),
          ),
        theme,
      );
      await page.goto("/login");
      await expect(
        page.getByRole("link", { name: /Explorar como visitante/ }),
      ).toBeVisible();
      await expect(page.locator(".auth-story img").first()).toHaveAttribute(
        "src",
        /enturma-mobile-official/,
      );
      await page.screenshot({
        path: info.outputPath(`login-${theme}-${viewport.width}.png`),
        fullPage: true,
      });
      await page.getByRole("link", { name: /Explorar como visitante/ }).click();
      await expect(
        page.getByRole("heading", { name: "Seu próximo estudo começa aqui." }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.getByRole("button", { name: "Caronas", exact: true }).click();
      const gate = page.getByRole("dialog", { name: "Faça parte da turma." });
      await expect(gate).toBeVisible();
      await expect(
        gate.getByRole("link", { name: /Criar minha conta/ }),
      ).toHaveAttribute("href", "/register");
      await page.screenshot({
        path: info.outputPath(`visitor-gate-${theme}-${viewport.width}.png`),
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await expect(gate).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Seu próximo estudo começa aqui." }),
      ).toBeVisible();
      const catalogResponse = page.waitForResponse((response) =>
        response.url().includes("/api/backend/catalog/institutions?") &&
        response.request().method() === "GET",
      );
      await page.getByRole("button", { name: /Explorar o catálogo/ }).click();
      await expect(
        page.getByRole("heading", { name: "Encontre seu caminho." }),
      ).toBeVisible();
      expect((await catalogResponse).ok()).toBe(true);
      await expect(page.getByText("Consultando o catálogo…")).toHaveCount(0);
      // Next's route announcer also uses role=alert. Only catalog errors belong here.
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
      await expect(page.locator(".visitor-catalog li").first()).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`visitor-catalog-${theme}-${viewport.width}.png`),
        fullPage: true,
      });
      await page.goto("/register");
      await expect(
        page.getByRole("link", { name: /Explorar como visitante/ }),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`register-${theme}-${viewport.width}.png`),
        fullPage: true,
      });
    });
}

test("visitor never admits native clients or weakens private authorization", async ({
  request,
}) => {
  for (const ua of ["EnturmaMobile/1.0", "EnturmaDesktop/1.0"]) {
    const result = await request.get("/visitante", {
      headers: { "User-Agent": ua },
      maxRedirects: 0,
    });
    expect(result.status()).toBe(307);
    expect(result.headers().location).toMatch(/\/home$/);
  }
  for (const path of ["/rooms", "/profile", "/caronas"]) {
    const result = await request.get(path, { maxRedirects: 0 });
    expect(result.status()).toBe(307);
    expect(result.headers().location).toContain("/login");
  }
  const api = process.env.E2E_API_URL ?? "http://localhost:8080";
  for (const path of ["/users/me", "/study-rooms", "/notifications/inbox"]) {
    const result = await request.get(`${api}/api/v1${path}`);
    expect([401, 403]).toContain(result.status());
  }
});

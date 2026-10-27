import { test, expect } from "@playwright/test";

test("public presentation has a share image and enters login with an animated CTA", async ({
  page,
  request,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Sua faculdade. Muito mais em companhia.",
    }),
  ).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/start\/poster\.png$/,
  );
  const poster = await request.get("/start/poster.png");
  expect(poster.status()).toBe(200);
  expect(poster.headers()["content-type"]).toContain("image/png");
  const png = await poster.body();
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  await page.screenshot({
    path: info.outputPath("start-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("link", { name: "Quero participar" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("start-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Quero participar" }).click();
  await expect(page).toHaveURL(/\/login$/);
  const forgot = page.getByRole("link", { name: "Esqueci minha senha" });
  await expect(forgot).toBeVisible();
  expect(
    await forgot.evaluate((el) => getComputedStyle(el).textDecorationLine),
  ).toContain("underline");
  for (const theme of ["Claro", "Escuro", "Sistema"]) {
    const choice = page
      .locator(".auth-theme-option")
      .filter({ hasText: theme });
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    expect(
      await choice.locator("span").evaluate((el) => getComputedStyle(el).color),
    ).toBe(await choice.evaluate((el) => getComputedStyle(el).color));
  }
});

test("native mobile skips presentation and session routing never exposes private content", async ({
  browser,
  baseURL,
}) => {
  const native = await browser.newContext({
    baseURL,
    userAgent: "Mozilla/5.0 Android EnturmaMobile/0.4.359",
  });
  try {
    const page = await native.newPage();
    await page.goto("/start");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("#start-title")).toHaveCount(0);
    await native.addCookies([
      { name: "enturma_access", value: "expired-test-token", url: baseURL! },
    ]);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("#start-title")).toHaveCount(0);
  } finally {
    await native.close();
  }
});

test("presentation remains usable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/start");
  expect(
    await page
      .locator("[data-float]")
      .evaluateAll(
        (nodes) => nodes.flatMap((node) => node.getAnimations()).length,
      ),
  ).toBe(0);
  await page.getByRole("link", { name: "Quero participar" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

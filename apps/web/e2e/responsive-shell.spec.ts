import { authenticate } from "./session";
import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("login contrast and navigation remain accessible at every viewport", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() =>
    localStorage.setItem(
      "enturma-experience",
      JSON.stringify({ theme: "DARK", reducedMotion: true }),
    ),
  );
  await page.goto("/login");
  await expect(page.locator(".auth-story h1")).toHaveCSS(
    "color",
    "rgb(24, 63, 54)",
  );
  await expect(page.locator(".auth-story")).toHaveCSS(
    "background-color",
    "rgb(221, 242, 128)",
  );
  await expect(page.locator(".auth-main")).not.toHaveCSS(
    "background-color",
    "rgb(221, 242, 128)",
  );
  await page.screenshot({
    path: "../../.local/login-contrast-desktop.png",
    animations: "disabled",
  });
  const tag = randomUUID().slice(0, 8),
    email = `screen-${tag}@example.test`,
    password = "E2E-password-long-123";
  const registered = await request.post(
    `${process.env.E2E_API_URL ?? "http://localhost:8080"}/api/v1/auth/register`,
    {
      data: {
        name: "Estudante",
        username: `screen_${tag}`,
        email,
        password,
        device: "E2E",
      },
    },
  );
  expect(registered.ok()).toBe(true);
  await authenticate(page.context(), await registered.json());
  // Include the longest sidebar variant, with the programming entry visible.
  await page.route("**/api/backend/learning/access", (route) =>
    route.fulfill({ json: { eligible: true } }),
  );
  for (const [width, height] of [
    [1376, 766],
    [1376, 768],
    [1920, 1080],
    [3440, 1440],
    [1024, 600],
    [390, 844],
    [320, 568],
  ]) {
    const view = await page.context().newPage();
    await view.setViewportSize({ width, height });
    await view.goto("/home");
    if (width <= 760)
      await view
        .getByRole("button", { name: "Mais opções", exact: true })
        .click();
    const nav =
      width <= 760
        ? view.getByRole("dialog", { name: "Mais opções do Enturma" })
        : view.getByRole("navigation", { name: "Principal" });
    const settings = nav.getByRole("link", {
      name: "Configurações",
      exact: true,
    });
    await settings.focus();
    await settings.scrollIntoViewIfNeeded();
    const box = await settings.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(height);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(
      await view.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1376 || width === 3440 || width === 320)
      await view.screenshot({
        path: `../../.local/shell-${width}-${height}.png`,
        animations: "disabled",
      });
    await view.close();
  }
  const settingsPage = await page.context().newPage();
  await settingsPage.setViewportSize({ width: 1376, height: 766 });
  await settingsPage.goto("/home");
  await settingsPage.evaluate(() =>
    document.documentElement.style.setProperty("--font-scale", "1.35"),
  );
  const settings = settingsPage
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: "Configurações" });
  await settings.focus();
  await settings.click();
  await expect(settingsPage).toHaveURL(/settings/);
  expect(
    await settingsPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await settingsPage.close();
});
